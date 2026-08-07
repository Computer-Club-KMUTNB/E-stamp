-- Server-authoritative login throttling for public participant and staff logins.
-- Login RPCs are callable only with a server-side Supabase secret after this migration.

create table if not exists public.login_attempt_guards (
  client_key text primary key,
  failed_attempts smallint not null default 0,
  window_started_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint login_attempt_guards_failed_attempts_check
    check (failed_attempts between 0 and 3),
  constraint login_attempt_guards_client_key_check
    check (client_key ~ '^(participant_login|staff_login):[a-f0-9]{64}$')
);

alter table public.login_attempt_guards enable row level security;
revoke all on table public.login_attempt_guards from public, anon, authenticated;

create or replace function public.reserve_login_attempt(
  p_client_key text,
  p_challenge_verified boolean
)
returns table (
  allowed boolean,
  challenge_required boolean
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_attempts smallint;
  current_window_started_at timestamptz;
begin
  if p_client_key !~ '^(participant_login|staff_login):[a-f0-9]{64}$' then
    raise exception 'invalid login attempt key';
  end if;

  insert into public.login_attempt_guards (client_key)
  values (p_client_key)
  on conflict (client_key) do nothing;

  select guard.failed_attempts, guard.window_started_at
  into current_attempts, current_window_started_at
  from public.login_attempt_guards guard
  where guard.client_key = p_client_key
  for update;

  if current_window_started_at <= now() - interval '15 minutes' then
    current_attempts := 0;
    current_window_started_at := now();
  end if;

  if current_attempts >= 3 and not p_challenge_verified then
    update public.login_attempt_guards
    set updated_at = now()
    where client_key = p_client_key;

    return query select false, true;
    return;
  end if;

  if current_attempts >= 3 and p_challenge_verified then
    current_attempts := 0;
    current_window_started_at := now();
  end if;

  current_attempts := current_attempts + 1;

  update public.login_attempt_guards
  set
    failed_attempts = current_attempts,
    window_started_at = current_window_started_at,
    updated_at = now()
  where client_key = p_client_key;

  return query select true, current_attempts >= 3;
end;
$$;

create or replace function public.clear_login_attempts(p_client_key text)
returns void
language sql
security definer
set search_path = ''
as $$
  delete from public.login_attempt_guards
  where client_key = p_client_key;
$$;

revoke all on function public.reserve_login_attempt(text, boolean) from public, anon, authenticated;
revoke all on function public.clear_login_attempts(text) from public, anon, authenticated;
grant execute on function public.reserve_login_attempt(text, boolean) to service_role;
grant execute on function public.clear_login_attempts(text) to service_role;

-- Participant credentials must never be checked through the public Data API.
revoke all on function public.login_attendee(text, text) from public, anon, authenticated;
grant execute on function public.login_attendee(text, text) to service_role;

-- lookup_booth_pin was created outside the migrations in older deployments.
-- Apply its grants only when the function is present so fresh migration runs remain valid.
do $$
begin
  if to_regprocedure('public.lookup_booth_pin(text)') is not null then
    execute 'revoke all on function public.lookup_booth_pin(text) from public, anon, authenticated';
    execute 'grant execute on function public.lookup_booth_pin(text) to service_role';
  end if;
end
$$;

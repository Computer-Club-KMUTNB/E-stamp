-- Protect participant registration from direct anonymous RPC calls and automation.

alter table public.login_attempt_guards
  drop constraint if exists login_attempt_guards_client_key_check;

alter table public.login_attempt_guards
  add constraint login_attempt_guards_client_key_check
  check (client_key ~ '^(participant_login|participant_register|staff_login):[a-f0-9]{64}$');

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
  if p_client_key !~ '^(participant_login|participant_register|staff_login):[a-f0-9]{64}$' then
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

revoke all on function public.reserve_login_attempt(text, boolean) from public, anon, authenticated;
grant execute on function public.reserve_login_attempt(text, boolean) to service_role;

-- Revoke every register_attendee overload, including schemas evolved outside migrations.
do $$
declare
  registration_function record;
begin
  for registration_function in
    select procedure.oid::regprocedure as signature
    from pg_proc procedure
    join pg_namespace namespace on namespace.oid = procedure.pronamespace
    where namespace.nspname = 'public'
      and procedure.proname = 'register_attendee'
      and procedure.prokind = 'f'
  loop
    execute format(
      'revoke all on function %s from public, anon, authenticated',
      registration_function.signature
    );
    execute format(
      'grant execute on function %s to service_role',
      registration_function.signature
    );
  end loop;
end
$$;

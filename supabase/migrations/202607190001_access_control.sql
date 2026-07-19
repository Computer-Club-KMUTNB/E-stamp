-- E-Stamp access-control baseline.
-- Run this migration after the four application tables have been created.

alter table public.user_info enable row level security;
alter table public.user_stamps enable row level security;
alter table public.booths enable row level security;
alter table public.activity_log enable row level security;

-- Remove every policy from earlier development iterations, regardless of name.
do $$
declare policy_row record;
begin
  for policy_row in
    select schemaname, tablename, policyname
    from pg_policies
    where schemaname = 'public'
      and tablename in ('user_info', 'user_stamps', 'booths', 'activity_log')
  loop
    execute format('drop policy if exists %I on %I.%I', policy_row.policyname, policy_row.schemaname, policy_row.tablename);
  end loop;
end
$$;

-- Explicit table privileges: anon can only discover booth names/zones.
revoke all on table public.user_info from anon, authenticated;
revoke all on table public.user_stamps from anon, authenticated;
revoke all on table public.booths from anon, authenticated;
revoke all on table public.activity_log from anon, authenticated;

grant select on table public.booths to anon, authenticated;
grant insert, update, delete on table public.booths to authenticated;
grant select on table public.user_info to authenticated;
grant select, update on table public.user_stamps to authenticated;
grant select, insert on table public.activity_log to authenticated;

create policy "booths are publicly readable"
on public.booths for select
to anon, authenticated
using (true);

create policy "authenticated staff manage booths"
on public.booths for all
to authenticated
using (true)
with check (true);

create policy "authenticated staff read attendee info"
on public.user_info for select
to authenticated
using (true);

create policy "authenticated staff read stamp books"
on public.user_stamps for select
to authenticated
using (true);

create policy "authenticated staff update stamp books"
on public.user_stamps for update
to authenticated
using (true)
with check (true);

create policy "authenticated staff read activity"
on public.activity_log for select
to authenticated
using (true);

create policy "authenticated staff create activity"
on public.activity_log for insert
to authenticated
with check (
  action_type in ('check_in', 'redeem_reward')
  and (action_type <> 'check_in' or booth_id is not null)
);

-- Public registration is intentionally exposed only through this narrow,
-- transactional function. Anonymous users cannot SELECT user_info or stamps.
create or replace function public.register_attendee(
  p_hashed_user_id text,
  p_student_id text,
  p_name text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_hashed_user_id !~ '^[a-f0-9]{64}$' then
    raise exception 'invalid hashed user id';
  end if;
  if p_student_id !~ '^[0-9]{13}$' then
    raise exception 'invalid student id';
  end if;
  if char_length(btrim(p_name)) < 2 or char_length(btrim(p_name)) > 120 then
    raise exception 'invalid attendee name';
  end if;

  insert into public.user_info (hashed_user_id, student_id, name)
  values (lower(p_hashed_user_id), p_student_id, btrim(p_name))
  on conflict (hashed_user_id) do nothing;

  insert into public.user_stamps (hashed_user_id)
  values (lower(p_hashed_user_id))
  on conflict (hashed_user_id) do nothing;
end;
$$;

revoke all on function public.register_attendee(text, text, text) from public;
grant execute on function public.register_attendee(text, text, text) to anon, authenticated;

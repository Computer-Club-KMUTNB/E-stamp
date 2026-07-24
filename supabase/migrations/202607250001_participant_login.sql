-- Participant login and duplicate registration handling.
-- The security-definer functions keep user_info/user_stamps protected by RLS
-- while returning only the authenticated participant's own progress.

create unique index if not exists user_info_student_id_key
  on public.user_info (student_id)
  where student_id is not null;

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

  if exists (
    select 1 from public.user_info
    where student_id = p_student_id
  ) then
    raise exception 'attendee already exists';
  end if;

  insert into public.user_info (hashed_user_id, student_id, name)
  values (lower(p_hashed_user_id), p_student_id, btrim(p_name));

  insert into public.user_stamps (hashed_user_id)
  values (lower(p_hashed_user_id));
end;
$$;

revoke all on function public.register_attendee(text, text, text) from public;
grant execute on function public.register_attendee(text, text, text) to anon, authenticated;

create or replace function public.login_attendee(
  p_hashed_user_id text,
  p_name text
)
returns table (
  hashed_user_id text,
  student_id text,
  name text,
  created_at timestamptz,
  front_booths_visited text[],
  back_booths_visited text[]
)
language plpgsql
security definer
set search_path = ''
as $$
begin
  return query
  select
    info.hashed_user_id,
    info.student_id,
    info.name,
    info.created_at,
    coalesce(stamps.front_booths_visited, '{}'::text[]),
    coalesce(stamps.back_booths_visited, '{}'::text[])
  from public.user_info info
  left join public.user_stamps stamps on stamps.hashed_user_id = info.hashed_user_id
  where info.hashed_user_id = lower(p_hashed_user_id)
    and lower(btrim(info.name)) = lower(btrim(p_name));
end;
$$;

revoke all on function public.login_attendee(text, text) from public;
grant execute on function public.login_attendee(text, text) to anon, authenticated;

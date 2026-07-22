-- Separate the booth number shown to staff from the globally unique internal id.
-- Staff can insert booth 01 in both zones; ids become front-01 and back-01.

alter table public.booths
  add column if not exists booth_number text;

update public.booths
set booth_number = regexp_replace(id::text, '^(front|back)-', '')
where booth_number is null or btrim(booth_number) = '';

alter table public.booths
  alter column booth_number set not null;

create unique index if not exists booths_zone_booth_number_key
  on public.booths (zone, booth_number);

create or replace function public.set_booth_internal_id()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.booth_number := btrim(coalesce(new.booth_number, new.id::text));

  if new.booth_number = '' then
    raise exception 'booth number is required';
  end if;

  -- The id is internal and globally unique; booth_number remains the display value.
  new.id := (new.zone::text || '-' || new.booth_number);
  return new;
end;
$$;

drop trigger if exists set_booth_internal_id_before_insert on public.booths;
create trigger set_booth_internal_id_before_insert
before insert on public.booths
for each row execute function public.set_booth_internal_id();

comment on column public.booths.booth_number is
  'Human-facing booth number; unique only within a zone.';


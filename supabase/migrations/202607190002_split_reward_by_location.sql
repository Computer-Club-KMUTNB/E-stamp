-- Allow attendees to qualify for and collect a reward independently at each venue.
alter table public.user_stamps
  add column if not exists front_reward_collected boolean not null default false,
  add column if not exists back_reward_collected boolean not null default false;

comment on column public.user_stamps.front_reward_collected is
  'Reward collected after completing all booths where booths.zone = front';

comment on column public.user_stamps.back_reward_collected is
  'Reward collected after completing all booths where booths.zone = back';

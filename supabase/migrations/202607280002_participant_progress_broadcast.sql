-- Notify an individual participant when staff changes their stamp book.
-- The public broadcast contains no attendee data; the participant revalidates
-- their saved credentials through login_attendee before refreshing progress.

create or replace function public.broadcast_participant_progress_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform realtime.send(
    jsonb_build_object('updated_at', new.updated_at),
    'progress_changed',
    'participant:' || new.hashed_user_id,
    false
  );
  return new;
end;
$$;

drop trigger if exists broadcast_participant_progress_after_update on public.user_stamps;
create trigger broadcast_participant_progress_after_update
after update of
  front_booths_visited,
  back_booths_visited,
  is_collect_reward,
  front_reward_collected,
  back_reward_collected
on public.user_stamps
for each row
when (
  old.front_booths_visited is distinct from new.front_booths_visited
  or old.back_booths_visited is distinct from new.back_booths_visited
  or old.is_collect_reward is distinct from new.is_collect_reward
  or old.front_reward_collected is distinct from new.front_reward_collected
  or old.back_reward_collected is distinct from new.back_reward_collected
)
execute function public.broadcast_participant_progress_change();

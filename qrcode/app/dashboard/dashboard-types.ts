export type Zone = "front" | "back";
export type ZoneFilter = "all" | Zone;

export interface ActivityItem {
  id: string | number;
  user: string;
  action: string;
  target: string;
  time: string;
}

export interface BoothRow {
  id: string;
  name: string;
  zone: Zone;
}

export interface BoothItem extends BoothRow {
  visits: number;
}

export interface StampRow {
  front_booths_visited: string[] | null;
  back_booths_visited: string[] | null;
  is_collect_reward: boolean | null;
}

export interface UserInfoRow {
  title: string | null;
  faculty: string;
}

export interface SexItem {
  label: string;
  count: number;
  color: string;
}

export interface FacultyRankItem {
  faculty: string;
  count: number;
}

export interface ActivityLog {
  id: string | number;
  action_type: string;
  created_at: string;
  booth_id: string | null;
  user_info:
    | { name: string | null; student_id: string | null }
    | { name: string | null; student_id: string | null }[]
    | null;
  booths: { name: string; zone: Zone } | { name: string; zone: Zone }[] | null;
}

export interface TimelineItem {
  time: string;
  attendees: number;
}

export interface FunnelItem {
  range: string;
  attendees: number;
}

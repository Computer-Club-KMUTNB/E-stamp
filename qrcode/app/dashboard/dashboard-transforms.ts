import type {
  ActivityItem,
  ActivityLog,
  BoothItem,
  BoothRow,
  FunnelItem,
  StampRow,
  TimelineItem,
  Zone,
} from "./dashboard-types";

export function firstRelation<T>(relation: T | T[] | null): T | null {
  return Array.isArray(relation) ? relation[0] ?? null : relation;
}

export function percentage(count: number, total: number): string {
  return total ? `${Math.round((count / total) * 100)}%` : "";
}

export function buildBoothsWithVisits(booths: BoothRow[], logs: ActivityLog[]): BoothItem[] {
  const map = new Map(booths.map((booth) => [booth.id, { ...booth, visits: 0 }]));
  logs.forEach((log) => {
    if (log.action_type !== "check_in" || !log.booth_id) return;
    const booth = map.get(log.booth_id);
    if (booth) booth.visits += 1;
  });
  return Array.from(map.values());
}

export function buildRecentActivity(logs: ActivityLog[]): ActivityItem[] {
  return logs.slice(0, 5).map((log) => {
    const user = firstRelation(log.user_info);
    const booth = firstRelation(log.booths);
    return {
      id: log.id,
      user: user?.name || user?.student_id || "ไม่ทราบชื่อผู้เข้าร่วม",
      action: log.action_type === "redeem_reward" ? "รับรางวัลที่" : "เช็กอินที่",
      target: log.action_type === "redeem_reward" ? "บูธรางวัล" : booth?.name || log.booth_id || "ไม่ทราบชื่อบูธ",
      time: new Date(log.created_at).toLocaleString("th-TH", { dateStyle: "short", timeStyle: "short" }),
    };
  });
}

export function buildTimeline(logs: ActivityLog[]): TimelineItem[] {
  const groups = new Map<number, number>();
  logs.forEach((log) => {
    if (log.action_type !== "check_in") return;
    const date = new Date(log.created_at);
    date.setMinutes(0, 0, 0);
    groups.set(date.getTime(), (groups.get(date.getTime()) ?? 0) + 1);
  });

  const timeline = Array.from(groups)
    .sort(([left], [right]) => left - right)
    .map(([timestamp, attendees]) => {
      const date = new Date(timestamp);
      const day = date.toLocaleDateString("th-TH", { day: "numeric", month: "short" });
      return { time: `${day} ${date.getHours().toString().padStart(2, "0")}:00`, attendees };
    });

  return timeline.length ? timeline : [{ time: "รอข้อมูล", attendees: 0 }];
}

export function buildFunnel(rows: StampRow[], zone: Zone, boothTotal: number): FunnelItem[] {
  const first = Math.max(1, Math.ceil(boothTotal / 3));
  const second = Math.max(first + 1, Math.ceil((boothTotal * 2) / 3));
  const counts = [0, 0, 0, 0];
  const key = zone === "front" ? "front_booths_visited" : "back_booths_visited";

  rows.forEach((row) => {
    const value = row[key]?.length ?? 0;
    if (!value) counts[0] += 1;
    else if (value <= first) counts[1] += 1;
    else if (value <= second) counts[2] += 1;
    else counts[3] += 1;
  });

  return [
    { range: "0", attendees: counts[0] },
    { range: `1–${first}`, attendees: counts[1] },
    { range: `${first + 1}–${second}`, attendees: counts[2] },
    { range: `${second + 1}+`, attendees: counts[3] },
  ];
}

function csvCell(value: string | number | null): string {
  return `"${String(value ?? "").replace(/"/g, "\"\"")}"`;
}

export function exportActivityCsv(logs: ActivityLog[]): void {
  const header = ["id", "ชื่อผู้เข้าร่วม", "รหัสนักศึกษา", "ประเภทกิจกรรม", "ชื่อบูธ", "โซน", "วันเวลา"];
  const rows = logs.map((log) => {
    const user = firstRelation(log.user_info);
    const booth = firstRelation(log.booths);
    return [
      log.id,
      user?.name ?? "",
      user?.student_id ?? "",
      log.action_type,
      booth?.name ?? "",
      booth?.zone === "front" ? "โซนหน้า" : booth?.zone === "back" ? "โซนหลัง" : "",
      log.created_at,
    ];
  });
  const csv = `\uFEFF${[header, ...rows].map((row) => row.map(csvCell).join(",")).join("\r\n")}`;
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = `openworld-activity-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

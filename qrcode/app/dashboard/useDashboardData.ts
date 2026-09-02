"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { ActivityLog, BoothRow, StampRow, UserInfoRow } from "./dashboard-types";

async function fetchAllRows<T>(
  fetchPage: (from: number, to: number) => PromiseLike<{ data: any[] | null; error: any }>
): Promise<T[]> {
  let all: T[] = [];
  let page = 0;
  const pageSize = 1000;
  while (true) {
    const { data, error } = await fetchPage(page * pageSize, (page + 1) * pageSize - 1);
    if (error) throw error;
    if (!data || data.length === 0) break;
    all = all.concat(data as T[]);
    if (data.length < pageSize) break;
    page++;
  }
  return all;
}

export function useDashboardData(enabled: boolean) {
  const [stampRows, setStampRows] = useState<StampRow[]>([]);
  const [boothRows, setBoothRows] = useState<BoothRow[]>([]);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [userInfoRows, setUserInfoRows] = useState<UserInfoRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const [stamps, booths, activity, users] = await Promise.all([
        fetchAllRows<StampRow>((from, to) =>
          supabase.from("user_stamps").select("front_booths_visited, back_booths_visited, is_collect_reward").range(from, to)
        ),
        supabase.from("booths").select("id, name, zone").order("name"),
        fetchAllRows<ActivityLog>((from, to) =>
          supabase
            .from("activity_log")
            .select("id, action_type, created_at, booth_id, user_info(name, student_id), booths(name, zone)")
            .order("created_at", { ascending: false })
            .range(from, to)
        ),
        fetchAllRows<UserInfoRow>((from, to) =>
          supabase.from("user_info").select("title, faculty").range(from, to)
        ),
      ]);
      if (booths.error) throw booths.error;
      setStampRows(stamps);
      setBoothRows((booths.data ?? []) as BoothRow[]);
      setLogs(activity);
      setUserInfoRows(users);
    } catch (caught) {
      console.error("Error fetching dashboard data:", caught);
      setError("โหลดข้อมูล Dashboard ไม่สำเร็จ กรุณาลองใหม่");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;
    void refresh();
    const channel = supabase
      .channel("dashboard:realtime")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "activity_log" }, () => void refresh())
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "user_stamps" }, () => void refresh())
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "user_stamps" }, () => void refresh())
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [enabled, refresh]);

  return { stampRows, boothRows, logs, userInfoRows, isLoading, error, refresh };
}

"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { ActivityLog, BoothRow, StampRow, UserInfoRow } from "./dashboard-types";

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
        supabase.from("user_stamps").select("front_booths_visited, back_booths_visited, is_collect_reward"),
        supabase.from("booths").select("id, name, zone").order("name"),
        supabase
          .from("activity_log")
          .select("id, action_type, created_at, booth_id, user_info(name, student_id), booths(name, zone)")
          .order("created_at", { ascending: false }),
        supabase.from("user_info").select("title, faculty"),
      ]);
      const queryError = stamps.error ?? booths.error ?? activity.error ?? users.error;
      if (queryError) throw queryError;
      setStampRows((stamps.data ?? []) as StampRow[]);
      setBoothRows((booths.data ?? []) as BoothRow[]);
      setLogs((activity.data ?? []) as unknown as ActivityLog[]);
      setUserInfoRows((users.data ?? []) as UserInfoRow[]);
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

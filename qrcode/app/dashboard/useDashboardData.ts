"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { ActivityLog, BoothRow, StampRow } from "./dashboard-types";

export function useDashboardData(enabled: boolean) {
  const [stampRows, setStampRows] = useState<StampRow[]>([]);
  const [boothRows, setBoothRows] = useState<BoothRow[]>([]);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const [stamps, booths, activity] = await Promise.all([
        supabase.from("user_stamps").select("front_booths_visited, back_booths_visited, is_collect_reward"),
        supabase.from("booths").select("id, name, zone").order("name"),
        supabase
          .from("activity_log")
          .select("id, action_type, created_at, booth_id, user_info(name, student_id), booths(name, zone)")
          .order("created_at", { ascending: false }),
      ]);
      const queryError = stamps.error ?? booths.error ?? activity.error;
      if (queryError) throw queryError;
      setStampRows((stamps.data ?? []) as StampRow[]);
      setBoothRows((booths.data ?? []) as BoothRow[]);
      setLogs((activity.data ?? []) as unknown as ActivityLog[]);
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
      .channel("dashboard:activity_log")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "activity_log" }, () => void refresh())
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [enabled, refresh]);

  return { stampRows, boothRows, logs, isLoading, error, refresh };
}

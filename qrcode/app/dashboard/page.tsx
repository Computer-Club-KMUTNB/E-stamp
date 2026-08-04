"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Download, Gift, MapPin, Moon, Sun, Users } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { ActivityFeed, BoothChart, FacultyRankingPanel, FunnelChart, Metric, SexBreakdownPanel, TimelineChart } from "./DashboardViews";
import {
  buildBoothsWithVisits,
  buildFacultyRanking,
  buildFunnel,
  buildRecentActivity,
  buildSexBreakdown,
  buildTimeline,
  exportActivityCsv,
  percentage,
} from "./dashboard-transforms";
import type { ZoneFilter } from "./dashboard-types";
import { useDashboardData } from "./useDashboardData";

const THEME_KEY = "dashboard_theme";

export default function DashboardPage() {
  const [zone, setZone] = useState<ZoneFilter>("all");
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [authed, setAuthed] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const { stampRows, boothRows, logs, userInfoRows, isLoading, error, refresh } = useDashboardData(authed);

  useEffect(() => {
    setIsDarkMode(window.localStorage.getItem(THEME_KEY) === "dark");
    const sync = () => setIsOnline(navigator.onLine);
    sync();
    window.addEventListener("online", sync);
    window.addEventListener("offline", sync);
    return () => {
      window.removeEventListener("online", sync);
      window.removeEventListener("offline", sync);
    };
  }, []);

  useEffect(() => {
    let active = true;
    void supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      if (!data.session) window.location.replace("/admin-login?next=/dashboard");
      else setAuthed(true);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        setAuthed(false);
        window.location.replace("/admin-login?next=/dashboard");
      }
    });
    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dashboard-dark", isDarkMode);
    window.localStorage.setItem(THEME_KEY, isDarkMode ? "dark" : "light");
    return () => document.documentElement.classList.remove("dashboard-dark");
  }, [isDarkMode]);

  const boothsWithVisits = useMemo(() => buildBoothsWithVisits(boothRows, logs), [boothRows, logs]);
  const filteredBooths = useMemo(
    () => boothsWithVisits.filter((booth) => zone === "all" || booth.zone === zone),
    [boothsWithVisits, zone],
  );
  const popular = useMemo(
    () => [...filteredBooths].sort((a, b) => b.visits - a.visits || a.name.localeCompare(b.name, "th")).slice(0, 5),
    [filteredBooths],
  );
  const leastVisited = useMemo(
    () => [...filteredBooths].sort((a, b) => a.visits - b.visits || a.name.localeCompare(b.name, "th")).slice(0, 5),
    [filteredBooths],
  );
  const recent = useMemo(() => buildRecentActivity(logs), [logs]);
  const timeline = useMemo(() => buildTimeline(logs), [logs]);

  const total = stampRows.length;
  const rewards = stampRows.filter((row) => row.is_collect_reward).length;
  const frontTotal = boothRows.filter((booth) => booth.zone === "front").length;
  const backTotal = boothRows.filter((booth) => booth.zone === "back").length;
  const frontFunnel = useMemo(() => buildFunnel(stampRows, "front", frontTotal), [stampRows, frontTotal]);
  const backFunnel = useMemo(() => buildFunnel(stampRows, "back", backTotal), [stampRows, backTotal]);
  const sexBreakdown = useMemo(() => buildSexBreakdown(userInfoRows), [userInfoRows]);
  const facultyRanking = useMemo(() => buildFacultyRanking(userInfoRows), [userInfoRows]);

  if (!authed) return <div className="dashboard-container" aria-busy="true">
    <div className="dashboard-skeleton-header"><span/><span/></div>
    <div className="dashboard-metrics">{[1, 2, 3].map((n) => <div key={n} className="dashboard-skeleton-block dashboard-glass"/>)}</div>
    <p className="dashboard-empty">กำลังตรวจสอบสิทธิ์เข้าใช้งาน…</p>
  </div>;
  const top = popular[0];

  return <div className="dashboard-container">
    <header className="dashboard-header">
      <div>
        <p className="dashboard-eyebrow">KMUTNB OPEN WORLD</p>
        <h1 className="dashboard-title">Event Dashboard</h1>
        <p className="dashboard-subtitle">ภาพรวมการเข้าร่วมกิจกรรมแบบเรียลไทม์</p>
      </div>
      <div className="dashboard-actions">
        <button type="button" onClick={() => exportActivityCsv(logs)} disabled={!logs.length} className="dashboard-glass dashboard-export-button">
          <Download size={18}/><span>ส่งออก CSV</span>
        </button>
        <button type="button" aria-label={isDarkMode ? "เปลี่ยนเป็นโหมดสว่าง" : "เปลี่ยนเป็นโหมดมืด"} aria-pressed={isDarkMode} onClick={() => setIsDarkMode((value) => !value)} className="dashboard-glass dashboard-theme-button">
          {isDarkMode ? <Sun size={20}/> : <Moon size={20}/>}
        </button>
        <div className={isOnline ? "dashboard-status dashboard-glass" : "dashboard-status dashboard-glass offline"} role="status"><i/><span>{isOnline ? "ระบบออนไลน์" : "ออฟไลน์"}</span></div>
      </div>
    </header>

    {error && <div className="dashboard-error" role="alert">{error}<button onClick={() => void refresh()}>ลองใหม่</button></div>}

    <div className="dashboard-zone-filter dashboard-glass">
      <span>แสดงข้อมูลบูธ</span>
      <div>{([["all", "ทั้งหมด"], ["front", "โซนหน้า"], ["back", "โซนหลัง"]] as const).map(([value, label]) =>
        <button type="button" key={value} className={zone === value ? "active" : ""} aria-pressed={zone === value} onClick={() => setZone(value)}>{label}</button>,
      )}</div>
    </div>

    <div className="dashboard-metrics">
      <Metric title="ผู้เข้าร่วมทั้งหมด" value={isLoading ? "…" : total.toLocaleString()} detail="อัปเดตแบบเรียลไทม์" icon={<Users size={20}/>}/>
      <Metric title="บูธยอดนิยม" value={isLoading ? "…" : top?.visits ? top.name : "ยังไม่มีข้อมูล"} detail={top?.visits ? `${top.visits.toLocaleString()} ครั้ง` : "รอการเช็กอิน"} icon={<MapPin size={20}/>} textValue/>
      <Metric title="รับรางวัลแล้ว" value={isLoading ? "…" : `${rewards.toLocaleString()} คน`} detail={total ? `${percentage(rewards, total)} ของผู้เข้าร่วมทั้งหมด` : "ยังไม่มีผู้เข้าร่วม"} icon={<Gift size={20}/>}/>
    </div>

    <div className="dashboard-content-grid">
      <TimelineChart data={timeline}/>
      <section className="dashboard-panel dashboard-glass">
        <h2><CheckCircle2 size={20}/>กิจกรรมล่าสุด</h2>
        <ActivityFeed items={recent}/>
      </section>
    </div>

    <div className="dashboard-booth-grid">
      <BoothChart title="อันดับบูธ" data={popular}/>
      <BoothChart title="บูธที่คนไปน้อยที่สุด" data={leastVisited} least/>
      <SexBreakdownPanel data={sexBreakdown}/>
      <FacultyRankingPanel data={facultyRanking}/>
    </div>

    <section className="dashboard-funnel-section dashboard-glass">
      <h2>ความคืบหน้าการสะสมแสตมป์</h2>
      <p>จำนวนผู้เข้าร่วม แบ่งตามจำนวนบูธที่สะสมได้ในแต่ละโซน</p>
      <div className="dashboard-funnel-grid">
        <FunnelChart title={`โซนหน้า · ${frontTotal} บูธ`} data={frontFunnel}/>
        <FunnelChart title={`โซนหลัง · ${backTotal} บูธ`} data={backFunnel}/>
      </div>
    </section>

  </div>;
}

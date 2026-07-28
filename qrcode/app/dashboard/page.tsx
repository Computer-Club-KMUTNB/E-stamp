"use client";

import { useCallback, useEffect, useState } from "react";
import { Activity, CheckCircle2, Gift, MapPin, Moon, Sun, TrendingUp, Users } from "lucide-react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { supabase } from "@/lib/supabase";

interface ActivityItem { id: string | number; user: string; action: string; target: string; time: string }
interface BoothItem { name: string; visits: number }
interface TimelineItem { time: string; attendees: number }

interface ActivityLog {
  id: string | number;
  action_type: string;
  created_at: string;
  booth_id: string | null;
  user_info: { name: string | null; student_id: string | null } | { name: string | null; student_id: string | null }[] | null;
  booths: { name: string } | { name: string }[] | null;
}

function firstRelation<T>(relation: T | T[] | null): T | null {
  return Array.isArray(relation) ? relation[0] ?? null : relation;
}

export default function DashboardPage() {
  const [currentAttendees, setCurrentAttendees] = useState(0);
  const [rewardsClaimed, setRewardsClaimed] = useState(0);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [authed, setAuthed] = useState(false);
  const [checkInTimelineData, setCheckInTimelineData] = useState<TimelineItem[]>([{ time: "Waiting...", attendees: 0 }]);
  const [popularBoothsData, setPopularBoothsData] = useState<BoothItem[]>([{ name: "No data", visits: 0 }]);
  const [recentActivityData, setRecentActivityData] = useState<ActivityItem[]>([]);

  useEffect(() => {
    let active = true;
    void supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      if (!data.session) {
        window.location.replace("/admin-login?next=/dashboard");
        return;
      }
      setAuthed(true);
    });
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        setAuthed(false);
        window.location.replace("/admin-login?next=/dashboard");
      }
    });
    return () => {
      active = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dashboard-dark", isDarkMode);
    return () => document.documentElement.classList.remove("dashboard-dark");
  }, [isDarkMode]);

  const fetchDashboardData = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const [attendees, rewards, logs] = await Promise.all([
        supabase.from("user_stamps").select("*", { count: "exact", head: true }),
        supabase.from("user_stamps").select("*", { count: "exact", head: true }).eq("is_collect_reward", true),
        supabase.from("activity_log").select("id, action_type, created_at, booth_id, user_info(name, student_id), booths(name)").order("created_at", { ascending: false }),
      ]);

      const queryError = attendees.error ?? rewards.error ?? logs.error;
      if (queryError) throw queryError;
      setCurrentAttendees(attendees.count ?? 0);
      setRewardsClaimed(rewards.count ?? 0);

      const rows = (logs.data ?? []) as unknown as ActivityLog[];
      setRecentActivityData(rows.slice(0, 5).map((log) => {
        const user = firstRelation(log.user_info);
        const booth = firstRelation(log.booths);
        return {
          id: log.id,
          user: user?.name || user?.student_id || "Unknown Student",
          action: log.action_type === "redeem_reward" ? "redeemed" : "checked in at",
          target: log.action_type === "redeem_reward" ? "Grand Prize" : booth?.name || log.booth_id || "Unknown Booth",
          time: new Date(log.created_at).toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" }),
        };
      }));

      const boothCounts: Record<string, BoothItem> = {};
      const timeGroups: Record<string, number> = {};
      rows.forEach((log) => {
        if (log.action_type !== "check_in") return;
        const booth = firstRelation(log.booths);
        if (booth?.name) {
          boothCounts[booth.name] ??= { name: booth.name, visits: 0 };
          boothCounts[booth.name].visits += 1;
        }
        const date = new Date(log.created_at);
        const hour = `${date.getHours().toString().padStart(2, "0")}:00`;
        timeGroups[hour] = (timeGroups[hour] || 0) + 1;
      });

      const booths = Object.values(boothCounts).sort((a, b) => b.visits - a.visits).slice(0, 5);
      setPopularBoothsData(booths.length ? booths : [{ name: "No data", visits: 0 }]);
      const timeline = Object.keys(timeGroups).sort().map((time) => ({ time, attendees: timeGroups[time] }));
      setCheckInTimelineData(timeline.length ? timeline : [{ time: "Waiting...", attendees: 0 }]);
    } catch (dashboardError) {
      console.error("Error fetching dashboard data:", dashboardError);
      setError("โหลดข้อมูล Dashboard ไม่สำเร็จ กรุณาลองใหม่");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authed) return;
    void fetchDashboardData();
    const channel = supabase.channel("dashboard:activity_log")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "activity_log" }, () => void fetchDashboardData())
      .subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [fetchDashboardData, authed]);

  if (!authed) return null;

  const topBooth = popularBoothsData[0];
  return <div className="dashboard-container">
    <header className="dashboard-header dashboard-fade-in">
      <div><p className="dashboard-eyebrow">KMUTNB OPEN WORLD</p><h1 className="dashboard-title">Event Dashboard</h1><p className="dashboard-subtitle">ภาพรวมการเข้าร่วมกิจกรรมแบบเรียลไทม์</p></div>
      <div className="dashboard-actions">
        <button aria-label="สลับโหมดสี" onClick={() => setIsDarkMode((value) => !value)} className="dashboard-glass dashboard-theme-button">{isDarkMode ? <Sun size={20}/> : <Moon size={20}/>}</button>
        <button onClick={() => { void supabase.auth.signOut().then(() => window.location.replace("/admin-login?next=/dashboard")); }} className="dashboard-glass dashboard-theme-button" aria-label="ออกจากระบบ" title="ออกจากระบบ">⏻</button>
        <div className="dashboard-status dashboard-glass"><i/><span>System Live</span></div>
      </div>
    </header>
    {error && <div className="dashboard-error" role="alert">{error} <button onClick={() => void fetchDashboardData()}>ลองใหม่</button></div>}
    <div className="dashboard-metrics">
      <Metric title="ผู้เข้าร่วมทั้งหมด" value={isLoading ? "..." : currentAttendees.toLocaleString()} detail="อัปเดตแบบเรียลไทม์" icon={<Users size={20}/>}/>
      <Metric title="บูธยอดนิยม" value={isLoading ? "..." : topBooth.visits ? topBooth.name : "ยังไม่มีข้อมูล"} detail={topBooth.visits ? `${topBooth.visits.toLocaleString()} ครั้ง` : "รอการเช็กอิน"} icon={<MapPin size={20}/>} textValue/>
      <Metric title="รับรางวัลแล้ว" value={isLoading ? "..." : rewardsClaimed.toLocaleString()} detail="จากผู้เข้าร่วมทั้งหมด" icon={<Gift size={20}/>}/>
    </div>
    <div className="dashboard-content-grid">
      <section className="dashboard-panel dashboard-glass"><h2><Activity size={20}/>การเช็กอินตามเวลา</h2><div className="dashboard-chart"><ResponsiveContainer width="100%" height="100%"><AreaChart data={checkInTimelineData} margin={{ top:10,right:20,left:0,bottom:0 }}><defs><linearGradient id="dashboardAttendees" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="var(--dashboard-brand)" stopOpacity={.8}/><stop offset="95%" stopColor="var(--dashboard-brand)" stopOpacity={0}/></linearGradient></defs><XAxis dataKey="time" stroke="var(--dashboard-muted)" fontSize={12} tickLine={false} axisLine={false}/><YAxis allowDecimals={false} stroke="var(--dashboard-muted)" fontSize={12} tickLine={false} axisLine={false}/><CartesianGrid strokeDasharray="3 3" stroke="var(--dashboard-border)" vertical={false}/><Tooltip contentStyle={{backgroundColor:"var(--dashboard-tooltip)",borderColor:"var(--dashboard-border)",borderRadius:8}}/><Area type="monotone" dataKey="attendees" stroke="var(--dashboard-brand)" strokeWidth={3} fill="url(#dashboardAttendees)"/></AreaChart></ResponsiveContainer></div></section>
      <section className="dashboard-panel dashboard-glass"><h2><CheckCircle2 size={20}/>กิจกรรมล่าสุด</h2><div className="dashboard-feed">{recentActivityData.length ? recentActivityData.map((item) => <div className="dashboard-feed-item" key={item.id}><div className="dashboard-feed-icon">{item.action === "redeemed" ? <Gift size={16}/> : <MapPin size={16}/>}</div><div><p>{item.user} {item.action} <strong>{item.target}</strong></p><small>{item.time}</small></div></div>) : <p className="dashboard-empty">ยังไม่มีกิจกรรมล่าสุด</p>}</div><h2 className="dashboard-ranking-title">อันดับบูธ</h2><div className="dashboard-chart dashboard-chart-small"><ResponsiveContainer width="100%" height="100%"><BarChart data={popularBoothsData} layout="vertical"><XAxis type="number" hide/><YAxis dataKey="name" type="category" width={100} stroke="var(--dashboard-muted)" fontSize={12} tickLine={false} axisLine={false}/><Tooltip cursor={{fill:"rgba(172,53,32,.05)"}} contentStyle={{backgroundColor:"var(--dashboard-tooltip)",borderColor:"var(--dashboard-border)",borderRadius:8}}/><Bar dataKey="visits" fill="var(--dashboard-brand)" radius={[0,4,4,0]}/></BarChart></ResponsiveContainer></div></section>
    </div>
  </div>;
}

function Metric({ title, value, detail, icon, textValue = false }: { title:string; value:string; detail:string; icon:React.ReactNode; textValue?:boolean }) {
  return <article className="dashboard-metric dashboard-glass"><div className="dashboard-metric-header"><h2>{title}</h2><span>{icon}</span></div><div className={textValue ? "dashboard-metric-value dashboard-metric-text" : "dashboard-metric-value"}>{value}</div><div className="dashboard-trend"><TrendingUp size={16}/>{detail}</div></article>;
}

"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Activity, CheckCircle2, Download, Gift, MapPin, Moon, Sun, TrendingUp, Users } from "lucide-react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { supabase } from "@/lib/supabase";

type Zone = "front" | "back";
type ZoneFilter = "all" | Zone;
interface ActivityItem { id:string|number; user:string; action:string; target:string; time:string }
interface BoothRow { id:string; name:string; zone:Zone }
interface BoothItem extends BoothRow { visits:number }
interface StampRow { front_booths_visited:string[]|null; back_booths_visited:string[]|null; is_collect_reward:boolean|null }
interface ActivityLog {
  id:string|number; action_type:string; created_at:string; booth_id:string|null;
  user_info:{name:string|null;student_id:string|null}|{name:string|null;student_id:string|null}[]|null;
  booths:{name:string;zone:Zone}|{name:string;zone:Zone}[]|null;
}
interface TimelineItem { time:string; attendees:number }
interface FunnelItem { range:string; attendees:number }

function firstRelation<T>(relation:T|T[]|null):T|null { return Array.isArray(relation) ? relation[0] ?? null : relation; }
function percentage(count:number,total:number) { return total ? `${Math.round(count / total * 100)}%` : ""; }
function csvCell(value:string|number|null) { return `"${String(value ?? "").replace(/"/g, "\"\"")}"`; }
function funnel(rows:StampRow[],zone:Zone,total:number):FunnelItem[] {
  const first=Math.max(1,Math.ceil(total/3));
  const second=Math.max(first+1,Math.ceil(total*2/3));
  const counts=[0,0,0,0];
  const key=zone==="front" ? "front_booths_visited" : "back_booths_visited";
  rows.forEach(row => {
    const value=row[key]?.length ?? 0;
    if (!value) counts[0]++; else if (value<=first) counts[1]++; else if (value<=second) counts[2]++; else counts[3]++;
  });
  return [
    {range:"0",attendees:counts[0]},
    {range:`1–${first}`,attendees:counts[1]},
    {range:`${first+1}–${second}`,attendees:counts[2]},
    {range:`${second+1}+`,attendees:counts[3]},
  ];
}

export default function DashboardPage() {
  const [stampRows,setStampRows]=useState<StampRow[]>([]);
  const [boothRows,setBoothRows]=useState<BoothRow[]>([]);
  const [logs,setLogs]=useState<ActivityLog[]>([]);
  const [zone,setZone]=useState<ZoneFilter>("all");
  const [isDarkMode,setIsDarkMode]=useState(false);
  const [isLoading,setIsLoading]=useState(true);
  const [error,setError]=useState("");
  const [authed,setAuthed]=useState(false);

  useEffect(() => {
    let active=true;
    void supabase.auth.getSession().then(({data}) => {
      if (!active) return;
      if (!data.session) window.location.replace("/admin-login?next=/dashboard");
      else setAuthed(true);
    });
    const {data:listener}=supabase.auth.onAuthStateChange((_event,session) => {
      if (!session) { setAuthed(false); window.location.replace("/admin-login?next=/dashboard"); }
    });
    return () => { active=false; listener.subscription.unsubscribe(); };
  },[]);

  useEffect(() => {
    document.documentElement.classList.toggle("dashboard-dark",isDarkMode);
    return () => document.documentElement.classList.remove("dashboard-dark");
  },[isDarkMode]);

  const fetchDashboardData=useCallback(async() => {
    setIsLoading(true); setError("");
    try {
      const stamps=await supabase
        .from("user_stamps")
        .select("front_booths_visited, back_booths_visited, is_collect_reward");
      const [booths,activity]=await Promise.all([
        supabase.from("booths").select("id, name, zone").order("name"),
        supabase.from("activity_log").select("id, action_type, created_at, booth_id, user_info(name, student_id), booths(name, zone)").order("created_at",{ascending:false}),
      ]);
      const queryError=stamps.error ?? booths.error ?? activity.error;
      if (queryError) throw queryError;
      setStampRows((stamps.data ?? []) as StampRow[]);
      setBoothRows((booths.data ?? []) as BoothRow[]);
      setLogs((activity.data ?? []) as unknown as ActivityLog[]);
    } catch (caught) {
      console.error("Error fetching dashboard data:",caught);
      setError("โหลดข้อมูล Dashboard ไม่สำเร็จ กรุณาลองใหม่");
    } finally { setIsLoading(false); }
  },[]);

  useEffect(() => {
    if (!authed) return;
    void fetchDashboardData();
    const channel=supabase.channel("dashboard:activity_log")
      .on("postgres_changes",{event:"INSERT",schema:"public",table:"activity_log"},() => void fetchDashboardData())
      .subscribe();
    return () => { void supabase.removeChannel(channel); };
  },[authed,fetchDashboardData]);

  const boothsWithVisits=useMemo(() => {
    const map=new Map(boothRows.map(booth => [booth.id,{...booth,visits:0}]));
    logs.forEach(log => {
      if (log.action_type!=="check_in" || !log.booth_id) return;
      const booth=map.get(log.booth_id);
      if (booth) booth.visits++;
    });
    return [...map.values()];
  },[boothRows,logs]);
  const filteredBooths=useMemo(() => boothsWithVisits.filter(booth => zone==="all" || booth.zone===zone),[boothsWithVisits,zone]);
  const popular=useMemo(() => [...filteredBooths].sort((a,b)=>b.visits-a.visits || a.name.localeCompare(b.name,"th")).slice(0,5),[filteredBooths]);
  const leastVisited=useMemo(() => [...filteredBooths].sort((a,b)=>a.visits-b.visits || a.name.localeCompare(b.name,"th")).slice(0,5),[filteredBooths]);
  const recent=useMemo<ActivityItem[]>(() => logs.slice(0,5).map(log => {
    const user=firstRelation(log.user_info); const booth=firstRelation(log.booths);
    return {id:log.id,user:user?.name||user?.student_id||"ไม่ทราบชื่อผู้เข้าร่วม",action:log.action_type==="redeem_reward"?"รับรางวัลที่":"เช็กอินที่",target:log.action_type==="redeem_reward"?"บูธรางวัล":booth?.name||log.booth_id||"ไม่ทราบชื่อบูธ",time:new Date(log.created_at).toLocaleString("th-TH",{dateStyle:"short",timeStyle:"short"})};
  }),[logs]);
  const timeline=useMemo<TimelineItem[]>(() => {
    const groups=new Map<number,number>();
    logs.forEach(log => {
      if (log.action_type!=="check_in") return;
      const date=new Date(log.created_at); date.setMinutes(0,0,0);
      groups.set(date.getTime(),(groups.get(date.getTime())??0)+1);
    });
    const data=[...groups.entries()].sort(([a],[b])=>a-b).map(([timestamp,attendees]) => {
      const date=new Date(timestamp);
      return {time:`${date.toLocaleDateString("th-TH",{day:"numeric",month:"short"})} ${date.getHours().toString().padStart(2,"0")}:00`,attendees};
    });
    return data.length ? data : [{time:"รอข้อมูล",attendees:0}];
  },[logs]);

  const total=stampRows.length;
  const rewards=stampRows.filter(row=>row.is_collect_reward).length;
  const frontTotal=boothRows.filter(booth=>booth.zone==="front").length;
  const backTotal=boothRows.filter(booth=>booth.zone==="back").length;
  const frontFunnel=useMemo(()=>funnel(stampRows,"front",frontTotal),[stampRows,frontTotal]);
  const backFunnel=useMemo(()=>funnel(stampRows,"back",backTotal),[stampRows,backTotal]);

  const exportCsv=() => {
    const header=["id","ชื่อผู้เข้าร่วม","รหัสนักศึกษา","ประเภทกิจกรรม","ชื่อบูธ","โซน","วันเวลา"];
    const rows=logs.map(log => {
      const user=firstRelation(log.user_info); const booth=firstRelation(log.booths);
      return [log.id,user?.name??"",user?.student_id??"",log.action_type,booth?.name??"",booth?.zone==="front"?"โซนหน้า":booth?.zone==="back"?"โซนหลัง":"",log.created_at];
    });
    const csv=`\uFEFF${[header,...rows].map(row=>row.map(csvCell).join(",")).join("\r\n")}`;
    const url=URL.createObjectURL(new Blob([csv],{type:"text/csv;charset=utf-8"}));
    const link=document.createElement("a"); link.href=url; link.download=`openworld-activity-${new Date().toISOString().slice(0,10)}.csv`;
    document.body.appendChild(link); link.click(); link.remove(); URL.revokeObjectURL(url);
  };

  if (!authed) return null;
  const top=popular[0];
  return <div className="dashboard-container">
    <header className="dashboard-header">
      <div><p className="dashboard-eyebrow">KMUTNB OPEN WORLD</p><h1 className="dashboard-title">Event Dashboard</h1><p className="dashboard-subtitle">ภาพรวมการเข้าร่วมกิจกรรมแบบเรียลไทม์</p></div>
      <div className="dashboard-actions">
        <button type="button" onClick={exportCsv} disabled={!logs.length} className="dashboard-glass dashboard-export-button"><Download size={18}/><span>ส่งออก CSV</span></button>
        <button type="button" aria-label="สลับโหมดสี" onClick={()=>setIsDarkMode(value=>!value)} className="dashboard-glass dashboard-theme-button">{isDarkMode?<Sun size={20}/>:<Moon size={20}/>}</button>
        <div className="dashboard-status dashboard-glass"><i/><span>ระบบออนไลน์</span></div>
      </div>
    </header>
    {error&&<div className="dashboard-error" role="alert">{error}<button onClick={()=>void fetchDashboardData()}>ลองใหม่</button></div>}
    <div className="dashboard-zone-filter dashboard-glass"><span>แสดงข้อมูลบูธ</span><div>{([["all","ทั้งหมด"],["front","โซนหน้า"],["back","โซนหลัง"]] as const).map(([value,label])=><button type="button" key={value} className={zone===value?"active":""} aria-pressed={zone===value} onClick={()=>setZone(value)}>{label}</button>)}</div></div>
    <div className="dashboard-metrics">
      <Metric title="ผู้เข้าร่วมทั้งหมด" value={isLoading?"...":total.toLocaleString()} detail="อัปเดตแบบเรียลไทม์" icon={<Users size={20}/>}/>
      <Metric title="บูธยอดนิยม" value={isLoading?"...":top?.visits?top.name:"ยังไม่มีข้อมูล"} detail={top?.visits?`${top.visits.toLocaleString()} ครั้ง`:"รอการเช็กอิน"} icon={<MapPin size={20}/>} textValue/>
      <Metric title="รับรางวัลแล้ว" value={isLoading?"...":`${rewards.toLocaleString()} คน`} detail={total?`${percentage(rewards,total)} ของผู้เข้าร่วมทั้งหมด`:"ยังไม่มีผู้เข้าร่วม"} icon={<Gift size={20}/>}/>
    </div>
    <div className="dashboard-content-grid">
      <section className="dashboard-panel dashboard-glass"><h2><Activity size={20}/>การเช็กอินตามวันและเวลา</h2><div className="dashboard-chart"><ResponsiveContainer width="100%" height="100%"><AreaChart data={timeline} margin={{top:10,right:20,left:0,bottom:0}}><defs><linearGradient id="dashboardAttendees" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="var(--dashboard-brand)" stopOpacity={.8}/><stop offset="95%" stopColor="var(--dashboard-brand)" stopOpacity={0}/></linearGradient></defs><XAxis dataKey="time" stroke="var(--dashboard-muted)" fontSize={12} tickLine={false} axisLine={false}/><YAxis allowDecimals={false} stroke="var(--dashboard-muted)" fontSize={12} tickLine={false} axisLine={false}/><CartesianGrid strokeDasharray="3 3" stroke="var(--dashboard-border)" vertical={false}/><Tooltip contentStyle={{backgroundColor:"var(--dashboard-tooltip)",borderColor:"var(--dashboard-border)",borderRadius:8}}/><Area type="monotone" dataKey="attendees" stroke="var(--dashboard-brand)" strokeWidth={3} fill="url(#dashboardAttendees)"/></AreaChart></ResponsiveContainer></div></section>
      <section className="dashboard-panel dashboard-glass"><h2><CheckCircle2 size={20}/>กิจกรรมล่าสุด</h2><div className="dashboard-feed">{recent.length?recent.map(item=><div className="dashboard-feed-item" key={item.id}><div className="dashboard-feed-icon">{item.action.includes("รับรางวัล")?<Gift size={16}/>:<MapPin size={16}/>}</div><div><p>{item.user} {item.action} <strong>{item.target}</strong></p><small>{item.time}</small></div></div>):<p className="dashboard-empty">ยังไม่มีกิจกรรมล่าสุด</p>}</div></section>
    </div>
    <div className="dashboard-booth-grid"><BoothChart title="อันดับบูธ" data={popular}/><BoothChart title="บูธที่คนไปน้อยที่สุด" data={leastVisited} least/></div>
    <section className="dashboard-funnel-section dashboard-glass"><h2>ความคืบหน้าการสะสมแสตมป์</h2><p>จำนวนผู้เข้าร่วม แบ่งตามจำนวนบูธที่สะสมได้ในแต่ละโซน</p><div className="dashboard-funnel-grid"><FunnelChart title={`โซนหน้า · ${frontTotal} บูธ`} data={frontFunnel}/><FunnelChart title={`โซนหลัง · ${backTotal} บูธ`} data={backFunnel}/></div></section>
  </div>;
}

function Metric({title,value,detail,icon,textValue=false}:{title:string;value:string;detail:string;icon:React.ReactNode;textValue?:boolean}) {
  return <article className="dashboard-metric dashboard-glass"><div className="dashboard-metric-header"><h2>{title}</h2><span>{icon}</span></div><div className={textValue?"dashboard-metric-value dashboard-metric-text":"dashboard-metric-value"}>{value}</div><div className="dashboard-trend"><TrendingUp size={16}/>{detail}</div></article>;
}
function BoothChart({title,data,least=false}:{title:string;data:BoothItem[];least?:boolean}) {
  return <section className="dashboard-booth-panel dashboard-glass"><h2><MapPin size={20}/>{title}</h2>{data.length?<div className="dashboard-booth-chart"><ResponsiveContainer width="100%" height="100%"><BarChart data={data} layout="vertical" margin={{right:12}}><XAxis type="number" allowDecimals={false} hide/><YAxis dataKey="name" type="category" width={110} stroke="var(--dashboard-muted)" fontSize={12} tickLine={false} axisLine={false}/><Tooltip cursor={{fill:"rgba(172,53,32,.05)"}} contentStyle={{backgroundColor:"var(--dashboard-tooltip)",borderColor:"var(--dashboard-border)",borderRadius:8}}/><Bar dataKey="visits" fill={least?"#d97706":"var(--dashboard-brand)"} radius={[0,4,4,0]}/></BarChart></ResponsiveContainer></div>:<p className="dashboard-empty">ยังไม่มีข้อมูลบูธ</p>}</section>;
}
function FunnelChart({title,data}:{title:string;data:FunnelItem[]}) {
  return <div className="dashboard-funnel-card"><h3>{title}</h3><div className="dashboard-funnel-chart"><ResponsiveContainer width="100%" height="100%"><BarChart data={data} layout="vertical" margin={{right:20}}><XAxis type="number" allowDecimals={false} hide/><YAxis dataKey="range" type="category" width={50} stroke="var(--dashboard-muted)" fontSize={12} tickLine={false} axisLine={false}/><Tooltip contentStyle={{backgroundColor:"var(--dashboard-tooltip)",borderColor:"var(--dashboard-border)",borderRadius:8}}/><Bar dataKey="attendees" fill="var(--dashboard-brand-light)" radius={[0,4,4,0]}/></BarChart></ResponsiveContainer></div></div>;
}

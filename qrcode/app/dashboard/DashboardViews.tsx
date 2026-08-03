"use client";

import type { ReactNode } from "react";
import { Activity, Gift, MapPin, TrendingUp } from "lucide-react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { ActivityItem, BoothItem, FunnelItem, TimelineItem } from "./dashboard-types";

const tooltipStyle = {
  backgroundColor: "var(--dashboard-tooltip)",
  borderColor: "var(--dashboard-border)",
  borderRadius: 8,
};

export function Metric({ title, value, detail, icon, textValue = false }: { title:string; value:string; detail:string; icon:ReactNode; textValue?:boolean }) {
  return <article className="dashboard-metric dashboard-glass">
    <div className="dashboard-metric-header"><h2>{title}</h2><span>{icon}</span></div>
    <div className={textValue ? "dashboard-metric-value dashboard-metric-text" : "dashboard-metric-value"}>{value}</div>
    <div className="dashboard-trend"><TrendingUp size={16}/>{detail}</div>
  </article>;
}

export function ActivityFeed({ items }: { items:ActivityItem[] }) {
  return <div className="dashboard-feed">
    {items.length ? items.map((item) => <div className="dashboard-feed-item" key={item.id}>
      <div className="dashboard-feed-icon">{item.action.includes("รับรางวัล") ? <Gift size={16}/> : <MapPin size={16}/>}</div>
      <div><p>{item.user} {item.action} <strong>{item.target}</strong></p><small>{item.time}</small></div>
    </div>) : <p className="dashboard-empty">ยังไม่มีกิจกรรมล่าสุด</p>}
  </div>;
}

export function TimelineChart({ data }: { data:TimelineItem[] }) {
  return <section className="dashboard-panel dashboard-glass">
    <h2><Activity size={20}/>การเช็กอินตามวันและเวลา</h2>
    <div className="dashboard-chart"><ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top:10, right:20, left:0, bottom:0 }}>
        <defs><linearGradient id="dashboardAttendees" x1="0" y1="0" x2="0" y2="1">
          <stop offset="5%" stopColor="var(--dashboard-brand)" stopOpacity={.8}/>
          <stop offset="95%" stopColor="var(--dashboard-brand)" stopOpacity={0}/>
        </linearGradient></defs>
        <XAxis dataKey="time" stroke="var(--dashboard-muted)" fontSize={12} tickLine={false} axisLine={false}/>
        <YAxis allowDecimals={false} stroke="var(--dashboard-muted)" fontSize={12} tickLine={false} axisLine={false}/>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--dashboard-border)" vertical={false}/>
        <Tooltip contentStyle={tooltipStyle}/>
        <Area type="monotone" dataKey="attendees" stroke="var(--dashboard-brand)" strokeWidth={3} fill="url(#dashboardAttendees)"/>
      </AreaChart>
    </ResponsiveContainer></div>
  </section>;
}

export function BoothChart({ title, data, least = false }: { title:string; data:BoothItem[]; least?:boolean }) {
  return <section className="dashboard-booth-panel dashboard-glass">
    <h2><MapPin size={20}/>{title}</h2>
    {data.length ? <div className="dashboard-booth-chart"><ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} layout="vertical" margin={{ right:12 }}>
        <XAxis type="number" allowDecimals={false} hide/>
        {/* ชื่อบูธภาษาไทยยาวเกินความกว้างแกน Y จึงตัดด้วย … แล้วให้ tooltip แสดงชื่อเต็ม */}
        <YAxis dataKey="name" type="category" width={124} stroke="var(--dashboard-muted)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(name: string) => (name.length > 17 ? `${name.slice(0, 16)}…` : name)}/>
        <Tooltip cursor={{ fill:"rgba(172,53,32,.05)" }} contentStyle={tooltipStyle}/>
        <Bar dataKey="visits" fill={least ? "#d97706" : "var(--dashboard-brand)"} radius={[0,4,4,0]}/>
      </BarChart>
    </ResponsiveContainer></div> : <p className="dashboard-empty">ยังไม่มีข้อมูลบูธ</p>}
  </section>;
}

export function FunnelChart({ title, data }: { title:string; data:FunnelItem[] }) {
  return <div className="dashboard-funnel-card">
    <h3>{title}</h3>
    <div className="dashboard-funnel-chart"><ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} layout="vertical" margin={{ right:20 }}>
        <XAxis type="number" allowDecimals={false} hide/>
        <YAxis dataKey="range" type="category" width={50} stroke="var(--dashboard-muted)" fontSize={12} tickLine={false} axisLine={false}/>
        <Tooltip contentStyle={tooltipStyle}/>
        <Bar dataKey="attendees" fill="var(--dashboard-brand-light)" radius={[0,4,4,0]}/>
      </BarChart>
    </ResponsiveContainer></div>
  </div>;
}

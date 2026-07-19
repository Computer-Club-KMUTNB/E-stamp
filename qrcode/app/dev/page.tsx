"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getAllClubs } from "@/lib/dataClient";
import { locationNames } from "@/lib/mockData";
import type { Club, Zone } from "@/lib/types";

const zones: Zone[] = ["front", "back"];

export default function DevPage() {
  const [clubs, setClubs] = useState<Club[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getAllClubs().then(setClubs).catch((caught) => {
      setError(caught instanceof Error ? caught.message : "โหลดรายการบูธไม่สำเร็จ");
    }).finally(() => setLoading(false));
  }, []);

  return <div className="py-8 sm:py-12">
    <header className="border-b pb-8" style={{borderColor:"var(--line)"}}><p className="eyebrow">STAFF CONSOLE</p><h1 className="mt-2 text-4xl font-black tracking-tight sm:text-5xl">เลือกจุดปฏิบัติงาน</h1><p className="mt-3 max-w-2xl leading-7 text-slate-600">เลือกบูธเพื่อเปิดกล้องสแกน หรือเปิดตรวจรับรางวัล ข้อมูลทุกครั้งจะส่งไปยัง Dashboard อัตโนมัติ</p></header>
    {error && <div role="alert" className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 font-bold text-red-800">{error}</div>}
    {loading ? <div className="grid gap-4 py-10 sm:grid-cols-2">{[1,2,3,4].map(n=><div key={n} className="h-28 animate-pulse rounded-3xl bg-white/70"/>)}</div> : clubs.length === 0 ? <section className="card mt-8 text-center"><div className="text-5xl">⌁</div><h2 className="mt-4 text-2xl font-black">ยังไม่มีข้อมูลบูธ</h2><p className="mt-2 text-slate-600">เพิ่มข้อมูลในตาราง booths ของ Supabase แล้วรีเฟรชหน้านี้</p></section> : zones.map(zone => { const zoneClubs=clubs.filter(club=>club.location===zone); return <section className="min-w-0 mt-10" key={zone}><div className="mb-4 flex items-center justify-between gap-3"><div className="min-w-0"><p className="eyebrow">{zone.toUpperCase()} ZONE</p><h2 className="mt-1 break-words text-2xl font-black">{locationNames[zone]}</h2></div><span className="shrink-0 rounded-full border bg-white px-3 py-1 text-sm font-bold text-slate-600" style={{borderColor:"var(--line)"}}>{zoneClubs.length} บูธ</span></div><div className="grid min-w-0 gap-3 md:grid-cols-2">{zoneClubs.map((club,index)=><Link href={`/club/${encodeURIComponent(club.id)}`} className="group flex min-w-0 max-w-full items-center gap-3 overflow-hidden rounded-2xl border bg-white/80 p-4 no-underline transition hover:-translate-y-0.5 hover:shadow-lg sm:gap-4" style={{borderColor:"var(--line)"}} key={club.id}><span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-red-50 font-black text-red-800">{String(index+1).padStart(2,"0")}</span><span className="min-w-0 flex-1 overflow-hidden"><b className="block overflow-hidden text-ellipsis whitespace-nowrap text-base text-slate-950 sm:text-lg" title={club.name}>{club.name}</b><small className="block overflow-hidden text-ellipsis whitespace-nowrap text-slate-500">รหัสบูธ {club.id}</small></span><span className="shrink-0 text-xl text-slate-400 transition group-hover:translate-x-1 group-hover:text-red-800">→</span></Link>)}</div></section>; })}
    <section className="mt-12 rounded-3xl bg-slate-950 p-6 text-white sm:p-8"><p className="eyebrow !text-red-300">REWARD DESK</p><div className="mt-2 flex flex-col justify-between gap-5 md:flex-row md:items-center"><div><h2 className="text-2xl font-black">ตรวจรับรางวัล</h2><p className="mt-1 text-slate-400">ตรวจแสตมป์ครบทุกบูธและบันทึกการรับรางวัล</p></div><div className="flex flex-col gap-2 sm:flex-row">{zones.map(zone=><Link className="inline-flex min-h-12 items-center justify-center rounded-xl bg-white px-5 font-bold text-slate-950 no-underline hover:bg-red-100" href={`/reward/reward-${zone}`} key={zone}>เปิด{locationNames[zone]} →</Link>)}</div></div></section>
  </div>;
}

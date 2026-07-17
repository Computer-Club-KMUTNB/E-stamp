"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { QrImage } from "@/components/QrImage";
import { getAllClubs } from "@/lib/dataClient";
import { locationNames } from "@/lib/mockData";
import type { Club, Zone } from "@/lib/types";

const rewardZones: Zone[] = ["front", "back"];

export default function DevPage() {
  const [origin, setOrigin] = useState("");
  const [clubs, setClubs] = useState<Club[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    setOrigin(window.location.origin);
    getAllClubs().then(setClubs).catch((caught) => {
      setError(caught instanceof Error ? caught.message : "โหลดรายการบูธไม่สำเร็จ");
    });
  }, []);

  return <div className="py-4 sm:py-8"><header className="card"><p className="text-sm font-black uppercase tracking-widest text-brand">Development tools</p><h1 className="mt-2 text-3xl font-black sm:text-4xl">หน้าทดสอบระบบ Supabase</h1><p className="mt-3 text-slate-600">รายการบูธด้านล่างโหลดจากฐานข้อมูลจริง การสแกนจะบันทึกลง user_stamps และ activity_log</p><div className="mt-5"><Link className="primary" href="/register">ไปหน้าลงทะเบียน</Link></div>{error && <p className="mt-4 rounded-xl bg-red-50 p-3 font-bold text-red-700">{error}</p>}</header>
    <h2 className="mb-4 mt-10 text-2xl font-black">จุดบูธ ({clubs.length})</h2><div className="grid gap-5 md:grid-cols-2">{clubs.map((club) => { const url = `${origin}/club/${encodeURIComponent(club.id)}`; return <article className="card" key={club.id}><p className="text-sm font-bold text-brand">{locationNames[club.location]}</p><h3 className="mt-1 text-xl font-black">{club.name}</h3><p className="my-3 break-all text-xs text-slate-500">{url}</p><QrImage value={url} label="QR สำหรับเปิดหน้าจุดบริการ" downloadName={`${club.id}.png`} /><Link className="primary mt-4 w-full" href={`/club/${encodeURIComponent(club.id)}`}>เปิดหน้าสแกน</Link></article>; })}</div>
    <h2 className="mb-4 mt-10 text-2xl font-black">จุดรับรางวัล</h2><div className="grid gap-5 md:grid-cols-2">{rewardZones.map((zone) => { const token = `reward-${zone}`; const url = `${origin}/reward/${token}`; return <article className="card" key={zone}><p className="text-sm font-bold text-brand">จุดรับรางวัล</p><h3 className="mt-1 text-xl font-black">{locationNames[zone]}</h3><p className="my-3 break-all text-xs text-slate-500">{url}</p><QrImage value={url} label="QR สำหรับเปิดหน้าจุดรับรางวัล" downloadName={`${token}.png`} /><Link className="primary mt-4 w-full" href={`/reward/${token}`}>เปิดหน้าสแกน</Link></article>; })}</div>
  </div>;
}

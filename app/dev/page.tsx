"use client";
import Link from "next/link";
import { useState } from "react";
import { QrImage } from "@/components/QrImage";
import { clearLocalData } from "@/lib/dataClient";
import { clubs, locationNames, rewardBooths } from "@/lib/mockData";

export default function DevPage() {
  const [origin] = useState(() => typeof window === "undefined" ? "" : window.location.origin);
  return <div className="py-4 sm:py-8"><header className="card"><p className="text-sm font-black uppercase tracking-widest text-brand">Development tools</p><h1 className="mt-2 text-3xl font-black sm:text-4xl">หน้าทดสอบระบบ</h1><p className="mt-3 text-slate-600">เปิดลิงก์จุดบริการบนอุปกรณ์เจ้าหน้าที่ แล้วใช้ QR ที่ได้จากหน้าลงทะเบียนทดสอบสแกน</p><div className="mt-5 flex flex-wrap gap-3"><Link className="primary" href="/register">ไปหน้าลงทะเบียน</Link><button className="secondary" onClick={async () => { if (confirm("ล้างข้อมูลผู้เข้าร่วม แสตมป์ และรางวัลทั้งหมดในเครื่องนี้?")) { await clearLocalData(); alert("ล้างข้อมูลแล้ว"); } }}>ล้างข้อมูลทดสอบ</button></div></header>
    <h2 className="mb-4 mt-10 text-2xl font-black">จุดชมรม ({clubs.length})</h2><div className="grid gap-5 md:grid-cols-2">{clubs.map((club) => { const url = `${origin}/club/${club.token}`; return <article className="card" key={club.id}><p className="text-sm font-bold text-brand">{locationNames[club.location]}</p><h3 className="mt-1 text-xl font-black">{club.name}</h3><p className="my-3 break-all text-xs text-slate-500">{url}</p><QrImage value={url} label="QR สำหรับเปิดหน้าจุดบริการ" downloadName={`${club.id}.png`} /><Link className="primary mt-4 w-full" href={`/club/${club.token}`}>เปิดหน้าสแกน</Link></article>; })}</div>
    <h2 className="mb-4 mt-10 text-2xl font-black">จุดรับรางวัล ({rewardBooths.length})</h2><div className="grid gap-5 md:grid-cols-2">{rewardBooths.map((booth) => { const url = `${origin}/reward/${booth.token}`; return <article className="card" key={booth.id}><p className="text-sm font-bold text-brand">จุดรับรางวัล</p><h3 className="mt-1 text-xl font-black">{locationNames[booth.location]}</h3><p className="my-3 break-all text-xs text-slate-500">{url}</p><QrImage value={url} label="QR สำหรับเปิดหน้าจุดรับรางวัล" downloadName={`${booth.id}.png`} /><Link className="primary mt-4 w-full" href={`/reward/${booth.token}`}>เปิดหน้าสแกน</Link></article>; })}</div>
  </div>;
}

"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { QrImage } from "@/components/QrImage";
import { getAllClubs, loginStudent } from "@/lib/dataClient";
import { locationNames } from "@/lib/mockData";
import type { Club, Student } from "@/lib/types";

export default function ParticipantLoginPage() {
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [student, setStudent] = useState<Student | null>(null);
  const [visitedClubIds, setVisitedClubIds] = useState<string[]>([]);
  const [clubs, setClubs] = useState<Club[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getAllClubs().then(setClubs).catch(() => setClubs([]));
  }, []);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (name.trim().length < 2) return setError("กรุณากรอกชื่อ–นามสกุล");
    if (!/^\d{13}$/.test(code)) return setError("รหัสนักศึกษาต้องเป็นตัวเลข 13 หลัก");
    setLoading(true); setError("");
    try {
      const result = await loginStudent(code, name);
      if (!result) {
        setError("ไม่พบผู้ใช้นี้ กรุณาตรวจสอบชื่อและรหัสนักศึกษา");
        return;
      }
      setStudent(result.student);
      setVisitedClubIds(result.visitedClubIds);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "เข้าสู่ระบบไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
    } finally { setLoading(false); }
  }

  if (student) {
    const visited = new Set(visitedClubIds);
    return <div className="mx-auto max-w-5xl py-8 sm:py-14">
      <div className="mb-8"><p className="eyebrow">PARTICIPANT LOGIN</p><h1 className="mt-2 text-4xl font-black tracking-tight sm:text-5xl">ยินดีต้อนรับ {student.name}</h1><p className="mt-3 text-slate-600">QR ของคุณและรายการบูธที่เข้าร่วมแล้ว</p></div>
      <div className="grid gap-6 lg:grid-cols-[.7fr_1.3fr]">
        <section className="card h-fit text-center"><h2 className="text-2xl font-black">QR ของคุณ</h2><p className="mt-1 font-mono text-slate-500">{"•".repeat(Math.max(student.studentCode.length - 4, 0)) + student.studentCode.slice(-4)}</p><div className="my-6"><QrImage value={student.qrToken} downloadName={`e-stamp-${student.studentCode}.png`} /></div><p className="text-sm leading-6 text-slate-600">บันทึกภาพนี้ไว้ใช้สะสมแสตมป์ที่ทุกบูธ</p><button className="secondary mt-5 w-full" onClick={() => { setStudent(null); setCode(""); setName(""); setVisitedClubIds([]); }}>ออกจากหน้านี้</button></section>
        <section className="card"><div className="flex items-end justify-between gap-3"><div><p className="eyebrow">BOOTH PROGRESS</p><h2 className="mt-1 text-2xl font-black">รายการบูธทั้งหมด</h2></div><span className="rounded-full bg-green-100 px-3 py-1 text-sm font-bold text-green-800">{visitedClubIds.length}/{clubs.length} แห่ง</span></div>{clubs.length === 0 ? <p className="mt-6 rounded-2xl bg-slate-50 p-5 text-center text-slate-600">ยังโหลดรายการบูธไม่สำเร็จ กรุณารีเฟรชหน้านี้</p> : <div className="mt-5 space-y-6">{(["front", "back"] as const).map((zone) => { const zoneClubs = clubs.filter((club) => club.location === zone); return <div key={zone}><div className="mb-3 flex items-center justify-between"><h3 className="font-black">{locationNames[zone]}</h3><span className="text-sm text-slate-500">{zoneClubs.filter((club) => visited.has(club.id)).length}/{zoneClubs.length}</span></div><div className="grid gap-2 sm:grid-cols-2">{zoneClubs.map((club) => { const checkedIn = visited.has(club.id); return <div key={club.id} className={`flex items-center gap-3 rounded-2xl border p-3 ${checkedIn ? "border-green-200 bg-green-50" : "border-slate-200 bg-white"}`}><span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl text-sm font-black ${checkedIn ? "bg-green-600 text-white" : "bg-slate-100 text-slate-500"}`}>{checkedIn ? "✓" : club.boothNumber}</span><span className="min-w-0"><b className="block truncate text-sm">{club.name}</b><small className={checkedIn ? "text-green-700" : "text-slate-500"}>{checkedIn ? "เข้าร่วมแล้ว" : `บูธ ${club.boothNumber} · ยังไม่ได้เข้าร่วม`}</small></span></div>; })}</div></div>; })}</div>}</section>
      </div>
    </div>;
  }

  return <div className="mx-auto grid min-h-[calc(100vh-5rem)] max-w-md place-items-center py-10"><section className="card w-full"><p className="eyebrow">PARTICIPANT LOGIN</p><h1 className="mt-2 text-3xl font-black">เข้าสู่ระบบผู้เข้าร่วม</h1><p className="mt-2 text-sm leading-6 text-slate-600">ใช้ชื่อและรหัสนักศึกษาที่ลงทะเบียนไว้ เพื่อดู QR และความคืบหน้าของคุณ</p><form className="mt-7 space-y-4" onSubmit={submit}><div><label className="block font-bold" htmlFor="name">ชื่อ–นามสกุล</label><input id="name" autoComplete="name" maxLength={120} required value={name} onChange={(e) => setName(e.target.value)} className="field" placeholder="เช่น สมชาย ใจดี" /></div><div><label className="block font-bold" htmlFor="studentCode">รหัสนักศึกษา</label><input id="studentCode" inputMode="numeric" autoComplete="off" maxLength={13} required value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} className="field font-mono tracking-wider" placeholder="6901234567890" /></div>{error && <p role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-4 font-semibold text-red-800">{error}</p>}<button disabled={loading} className="primary w-full" type="submit">{loading ? "กำลังตรวจสอบ…" : "เข้าสู่ระบบ"}</button></form><p className="mt-5 text-center text-sm text-slate-500">ลืมรหัส? กรุณาติดต่อที่บูธรับรางวัล</p><p className="mt-3 text-center text-sm text-slate-600">ยังไม่มีบัญชี? <Link className="font-bold text-red-800 underline" href="/register">ลงทะเบียน</Link></p></section></div>;
}

"use client";
import { useCallback, useEffect, useState } from "react";
import { Scanner } from "@/components/Scanner";
import { ScanStatus, StatusBox } from "@/components/StatusBox";
import { getClubByToken, getStudentByToken, recordStamp } from "@/lib/dataClient";
import type { Club } from "@/lib/types";

export default function ClubScannerPage({ params }: { params: { token: string } }) {
  const { token } = params; const [club, setClub] = useState<Club | null>(); const [status, setStatus] = useState<ScanStatus | null>(null); const [resetKey, setResetKey] = useState(0);
  useEffect(() => { getClubByToken(token).then(setClub).catch(() => setClub(null)); }, [token]);
  const onScan = useCallback(async (qrToken: string) => { if (!club) return; try { const student = await getStudentByToken(qrToken); if (!student) { setStatus({ tone: "error", title: "ไม่พบผู้เข้าร่วม", detail: "กรุณาลงทะเบียนก่อนรับแสตมป์" }); return; } const result = await recordStamp(student.id, club.id); setStatus(result.created ? { tone: "success", title: `ประทับตรา ${club.name} สำเร็จ`, detail: `${student.name} • รหัส ${student.studentCode}` } : { tone: "warning", title: "เคยรับแสตมป์แล้ว", detail: `${club.name} • รหัส ${student.studentCode}` }); } catch (caught) { setStatus({ tone: "error", title: "บันทึกไม่สำเร็จ", detail: caught instanceof Error ? caught.message : "กรุณาลองสแกนอีกครั้ง" }); } }, [club]);
  if (club === undefined) return <div className="mx-auto mt-20 h-52 max-w-xl animate-pulse rounded-3xl bg-white/70" />;
  if (club === null) return <div className="mx-auto mt-16 max-w-xl card text-center"><p className="text-6xl">⛔</p><h1 className="mt-5 text-3xl font-black">ลิงก์ชมรมไม่ถูกต้อง</h1><p className="mt-3 text-slate-600">โปรดตรวจสอบ QR Code หรือลิงก์ของจุดบริการ</p></div>;
  return <div className="mx-auto max-w-4xl py-6 sm:py-10"><header className="mb-6"><div className="flex flex-wrap items-center gap-2"><span className="rounded-full bg-red-100 px-3 py-1 text-xs font-black uppercase tracking-wider text-red-800">{club.location} zone</span><span className="text-sm text-slate-500">รหัสบูธ {club.id}</span></div><h1 className="mt-3 text-3xl font-black tracking-tight sm:text-5xl">{club.name}</h1><p className="mt-2 text-slate-600">สแกน QR ของผู้เข้าร่วมเพื่อบันทึกแสตมป์</p></header><section className="card">{status ? <div className="space-y-5"><StatusBox status={status} /><button className="primary w-full" onClick={() => { setStatus(null); setResetKey((n) => n + 1); }}>สแกนคนถัดไป →</button></div> : <Scanner onScan={onScan} resetKey={resetKey} />}</section></div>;
}

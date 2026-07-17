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
  if (club === undefined) return <p className="py-20 text-center text-xl font-bold">กำลังโหลด…</p>;
  if (club === null) return <div className="mx-auto mt-16 max-w-xl card text-center"><p className="text-6xl">⛔</p><h1 className="mt-5 text-3xl font-black">ลิงก์ชมรมไม่ถูกต้อง</h1><p className="mt-3 text-slate-600">โปรดตรวจสอบ QR Code หรือลิงก์ของจุดบริการ</p></div>;
  return <div className="mx-auto max-w-4xl py-4 sm:py-8"><header className="mb-5 text-center"><p className="font-bold text-brand">จุดประทับตราชมรม</p><h1 className="mt-1 text-3xl font-black sm:text-5xl">{club.name}</h1></header><section className="card">{status ? <div className="space-y-5"><StatusBox status={status} /><button className="primary w-full" onClick={() => { setStatus(null); setResetKey((n) => n + 1); }}>สแกนคนถัดไป</button></div> : <Scanner onScan={onScan} resetKey={resetKey} />}</section></div>;
}

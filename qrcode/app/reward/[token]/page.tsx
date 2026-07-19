"use client";
import { useCallback, useEffect, useState } from "react";
import { Scanner } from "@/components/Scanner";
import { ScanStatus, StatusBox } from "@/components/StatusBox";
import { createRewardClaim, getAllClubs, getRewardBoothByToken, getRewardClaim, getStampsForStudent, getStudentByToken } from "@/lib/dataClient";
import { locationNames } from "@/lib/mockData";
import type { Club, RewardBooth } from "@/lib/types";

export default function RewardScannerPage({ params }: { params: { token: string } }) {
  const { token } = params; const [booth, setBooth] = useState<RewardBooth | null>(); const [clubs, setClubs] = useState<Club[]>([]); const [status, setStatus] = useState<ScanStatus | null>(null); const [resetKey, setResetKey] = useState(0);
  useEffect(() => { getRewardBoothByToken(token).then(async (value) => { setBooth(value); if (value) setClubs(await getAllClubs()); }).catch(() => setBooth(null)); }, [token]);
  const onScan = useCallback(async (qrToken: string) => { if (!booth) return; try { const student = await getStudentByToken(qrToken); if (!student) { setStatus({ tone: "error", title: "ไม่พบผู้เข้าร่วม" }); return; } const stamps = await getStampsForStudent(student.id); const stampIds = new Set(stamps.map((stamp) => stamp.clubId)); const missing = clubs.filter((club) => !stampIds.has(club.id)); if (missing.length) { setStatus({ tone: "error", title: `ขาดอีก ${missing.length} บูธ`, detail: missing.map((club) => club.name).join(", ") }); return; } const oldClaim = await getRewardClaim(student.id, booth.location); if (oldClaim) { setStatus({ tone: "warning", title: "รับรางวัลแล้ว", detail: "ผู้เข้าร่วมรับรางวัลไปแล้ว ไม่สามารถรับซ้ำได้" }); return; } await createRewardClaim(student.id, booth.location); setStatus({ tone: "success", title: "รับรางวัลได้", detail: `🎉 แสตมป์ครบแล้ว • ${student.name} • รหัส ${student.studentCode}` }); } catch (caught) { setStatus({ tone: "error", title: "ตรวจสอบไม่สำเร็จ", detail: caught instanceof Error ? caught.message : "กรุณาลองสแกนอีกครั้ง" }); } }, [booth, clubs]);
  if (booth === undefined) return <p className="py-20 text-center text-xl font-bold">กำลังโหลด…</p>;
  if (booth === null) return <div className="mx-auto mt-16 max-w-xl card text-center"><p className="text-6xl">⛔</p><h1 className="mt-5 text-3xl font-black">ลิงก์จุดรับรางวัลไม่ถูกต้อง</h1></div>;
  return <div className="mx-auto max-w-4xl py-4 sm:py-8"><header className="mb-5 text-center"><p className="font-bold text-brand">จุดตรวจรับรางวัล • {locationNames[booth.location]}</p><h1 className="mt-1 text-3xl font-black sm:text-5xl">ตรวจแสตมป์ครบทุกบูธ</h1><p className="mt-2 text-slate-600">ต้องมีแสตมป์ครบ {clubs.length} บูธ จากทั้งสองสถานที่</p></header><section className="card">{status ? <div className="space-y-5"><StatusBox status={status} /><button className="primary w-full" onClick={() => { setStatus(null); setResetKey((n) => n + 1); }}>สแกนคนถัดไป</button></div> : <Scanner onScan={onScan} resetKey={resetKey} />}</section></div>;
}

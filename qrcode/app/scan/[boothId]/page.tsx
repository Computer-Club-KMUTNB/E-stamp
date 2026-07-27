"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Scanner, type ScannerHandle } from "@/components/Scanner";
import { ScanStatus, StatusBox } from "@/components/StatusBox";
import { getClubByToken, getStudentByToken, recordStamp } from "@/lib/dataClient";
import { locationNames } from "@/lib/mockData";
import type { Club } from "@/lib/types";

const STAFF_PIN_KEY = "staff_pin_booth";

export default function PinScannerPage({ params }: { params: { boothId: string } }) {
  const { boothId } = params;
  const router = useRouter();
  const [club, setClub] = useState<Club | null | undefined>(undefined);
  const [status, setStatus] = useState<ScanStatus | null>(null);
  const [resetKey, setResetKey] = useState(0);
  const scannerRef = useRef<ScannerHandle>(null);

  useEffect(() => {
    // Verify PIN session matches this booth
    const sessionBooth = window.sessionStorage.getItem(STAFF_PIN_KEY);
    if (!sessionBooth || sessionBooth !== decodeURIComponent(boothId)) {
      router.replace("/staff-login");
      return;
    }
    getClubByToken(decodeURIComponent(boothId)).then(setClub).catch(() => setClub(null));
  }, [boothId, router]);

  const onScan = useCallback(async (qrToken: string) => {
    if (!club) return;
    try {
      const student = await getStudentByToken(qrToken);
      if (!student) {
        setStatus({ tone: "error", title: "ไม่พบผู้เข้าร่วม", detail: "กรุณาลงทะเบียนก่อนรับแสตมป์" });
        return;
      }
      const result = await recordStamp(student.id, club.id);
      setStatus(result.created
        ? { tone: "success", title: `ประทับตรา ${club.name} สำเร็จ`, detail: student.name }
        : { tone: "warning", title: "เคยรับแสตมป์แล้ว", detail: `${student.name} • ${club.name}` }
      );
    } catch (caught) {
      setStatus({ tone: "error", title: "บันทึกไม่สำเร็จ", detail: caught instanceof Error ? caught.message : "กรุณาลองสแกนอีกครั้ง" });
    }
  }, [club]);

  function logout() {
    window.sessionStorage.removeItem(STAFF_PIN_KEY);
    router.replace("/staff-login");
  }

  if (club === undefined) return <div className="mx-auto mt-20 h-52 max-w-xl animate-pulse rounded-3xl bg-white/70" />;
  if (club === null) return <div className="mx-auto mt-16 max-w-xl card text-center"><p className="text-6xl">⛔</p><h1 className="mt-5 text-3xl font-black">บูธไม่ถูกต้อง</h1><p className="mt-3 text-slate-600">PIN นี้ไม่ตรงกับบูธใด กรุณาติดต่อผู้ดูแลระบบ</p><button className="secondary mt-6" onClick={logout}>ออกจากระบบ</button></div>;

  return <div className="mx-auto max-w-4xl py-6 sm:py-10">
    <header className="mb-6">
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-black tracking-wider text-red-800">{locationNames[club.location]}</span>
        <span className="text-sm text-slate-500">เลขบูธ {club.boothNumber}</span>
      </div>
      <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-5xl">{club.name}</h1>
      <p className="mt-2 text-slate-600">สแกน QR ของผู้เข้าร่วมเพื่อบันทึกแสตมป์</p>
    </header>
    <section className="card">
      <div className={status ? "hidden" : ""}><Scanner ref={scannerRef} onScan={onScan} resetKey={resetKey} /></div>
      {status && <div className="space-y-5">
        <StatusBox status={status} />
        <button className="primary w-full" onClick={() => { setStatus(null); setResetKey((k) => k + 1); void scannerRef.current?.start(); }}>สแกนคนถัดไป →</button>
      </div>}
    </section>
    <div className="mt-12 text-center">
      <button onClick={logout} className="text-sm font-medium text-slate-400 hover:text-slate-600 underline underline-offset-4">
        ออกจากระบบ
      </button>
    </div>
  </div>;
}

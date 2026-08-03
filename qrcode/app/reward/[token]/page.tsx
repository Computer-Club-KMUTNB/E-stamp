"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Scanner, type ScannerHandle } from "@/components/Scanner";
import { ScanStatus, StatusBox } from "@/components/StatusBox";
import { createRewardClaim, getAllClubs, getRewardBoothByToken, getRewardClaim, getStampsForStudent, getStudentByToken } from "@/lib/dataClient";
import { locationNames } from "@/lib/mockData";
import type { Club, RewardBooth } from "@/lib/types";

const STAFF_PIN_KEY = "staff_pin_booth";

export default function RewardScannerPage({ params }: { params: { token: string } }) {
  const { token } = params; 
  const router = useRouter();
  const [booth, setBooth] = useState<RewardBooth | null>(); 
  const [clubs, setClubs] = useState<Club[]>([]); 
  const [status, setStatus] = useState<ScanStatus | null>(null); 
  const scannerRef = useRef<ScannerHandle>(null);

  useEffect(() => { 
    // Verify PIN session matches this desk
    const sessionBooth = window.sessionStorage.getItem(STAFF_PIN_KEY);
    if (!sessionBooth || sessionBooth !== token) {
      router.replace("/staff-login");
      return;
    }

    getRewardBoothByToken(token).then(async (value) => { 
      if (!value) { setBooth(null); return; } 
      setClubs(await getAllClubs()); 
      setBooth(value); 
    }).catch(() => setBooth(null)); 
  }, [token, router]);

  const onScan = useCallback(async (qrToken: string) => { 
    if (!booth) return; 
    try { 
      const student = await getStudentByToken(qrToken); 
      if (!student) { setStatus({ tone: "error", title: "ไม่พบผู้เข้าร่วม" }); return; } 
      const stamps = await getStampsForStudent(student.id); 
      const stampIds = new Set(stamps.map((stamp) => stamp.clubId)); 
      const frontCount = clubs.filter((club) => club.location === "front" && stampIds.has(club.id)).length; 
      const backCount = clubs.filter((club) => club.location === "back" && stampIds.has(club.id)).length; 
      const totalCount = frontCount + backCount; 
      if (frontCount < 5 || backCount < 5 || totalCount < 10) { 
        setStatus({ tone: "warning", title: `${student.name} • ยังไม่ครบเงื่อนไข`, detail: `${locationNames.front} ${frontCount}/5 ชมรม • ${locationNames.back} ${backCount}/5 ชมรม • รวม ${totalCount}/10 ชมรม` }); 
        return; 
      } 
      const oldClaim = await getRewardClaim(student.id); 
      if (oldClaim) { 
        setStatus({ tone: "warning", title: "รับรางวัลแล้ว", detail: `${student.name} รับรางวัลไปแล้ว ไม่สามารถรับซ้ำได้` }); 
        return; 
      } 
      await createRewardClaim(student.id); 
      setStatus({ tone: "success", title: "รับรางวัลได้", detail: `🎉 ${student.name} • ครบสถานที่ละ 5 ชมรม รวม ${totalCount} ชมรม` }); 
    } catch (caught) { 
      setStatus({ tone: "error", title: "ตรวจสอบไม่สำเร็จ", detail: caught instanceof Error ? caught.message : "กรุณาลองสแกนอีกครั้ง" }); 
    } 
  }, [booth, clubs]);

  function logout() {
    window.sessionStorage.removeItem(STAFF_PIN_KEY);
    router.replace("/staff-login");
  }

  if (booth === undefined) return <div className="mx-auto mt-20 h-52 max-w-xl animate-pulse rounded-3xl bg-white/70" aria-busy="true" aria-label="กำลังโหลด" />;
  if (booth === null) return <div className="mx-auto mt-16 max-w-xl card text-center"><p className="text-6xl">⛔</p><h1 className="mt-5 text-3xl font-black">ลิงก์จุดรับรางวัลไม่ถูกต้อง</h1></div>;
  if (clubs.length === 0) return <div className="mx-auto mt-16 max-w-xl card text-center"><p className="text-6xl">⚙️</p><h1 className="mt-5 text-3xl font-black">ยังไม่มีบูธในสถานที่นี้</h1><p className="mt-3 text-slate-600">กรุณาเพิ่มข้อมูลบูธก่อนเปิดจุดตรวจรับรางวัล</p></div>;
  
  return <div className="mx-auto max-w-4xl py-4 sm:py-8">
    <header className="mb-5 text-center sm:text-left">
      <p className="eyebrow">REWARD DESK</p>
      <h1 className="mt-1 text-3xl font-black tracking-tight sm:text-5xl">ตรวจสิทธิ์รับรางวัล</h1>
      <p className="mt-2 text-slate-600">ต้องเข้าร่วม {locationNames.front} อย่างน้อย 5 ชมรม และ {locationNames.back} อย่างน้อย 5 ชมรม รวมอย่างน้อย 10 ชมรม</p>
    </header>
    <section className="card">
      <div className={status ? "hidden" : ""}><Scanner ref={scannerRef} onScan={onScan} resetKey={0} /></div>
      {status && <div className="space-y-5">
        <StatusBox status={status} />
        <button className="primary w-full" onClick={() => { setStatus(null); void scannerRef.current?.start(); }}>สแกนคนถัดไป</button>
      </div>}
    </section>
    <div className="mt-12 text-center">
      <button onClick={logout} className="text-sm font-medium text-slate-400 hover:text-slate-600 underline underline-offset-4">
        ออกจากระบบ
      </button>
    </div>
  </div>;
}

"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { PARTICIPANT_SESSION_KEY, notifyParticipantSessionChange } from "@/components/AuthNav";
import { QrImage } from "@/components/QrImage";
import { getAllClubs, loginStudent } from "@/lib/dataClient";
import { locationNames } from "@/lib/mockData";
import { supabase } from "@/lib/supabase";
import type { Club, Student, Zone } from "@/lib/types";

const zones: Zone[] = ["front", "back"];

export default function ParticipantLoginPage() {
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [student, setStudent] = useState<Student | null>(null);
  const [visitedClubIds, setVisitedClubIds] = useState<string[]>([]);
  const [clubs, setClubs] = useState<Club[]>([]);
  const [openZone, setOpenZone] = useState<Zone | null>(null);
  const [showRewardConditions, setShowRewardConditions] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [progressConnection, setProgressConnection] = useState<"connecting" | "live" | "fallback" | "offline">("connecting");
  const progressRefreshInFlight = useRef(false);
  const progressRefreshTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    getAllClubs().then(setClubs).catch(() => setClubs([]));
    const savedSession = window.sessionStorage.getItem(PARTICIPANT_SESSION_KEY);
    if (savedSession) {
      try {
        const parsed = JSON.parse(savedSession) as { student?: Student; visitedClubIds?: string[] };
        if (parsed.student?.id && parsed.student.qrToken) {
          setStudent(parsed.student);
          setVisitedClubIds(parsed.visitedClubIds ?? []);
        }
      } catch {
        window.sessionStorage.removeItem(PARTICIPANT_SESSION_KEY);
      }
    }
  }, []);

  const refreshParticipantProgress = useCallback(async (currentStudent: Student) => {
    if (progressRefreshInFlight.current || !navigator.onLine) return;
    progressRefreshInFlight.current = true;
    try {
      const result = await loginStudent(currentStudent.studentCode, currentStudent.name);
      if (!result || result.student.id !== currentStudent.id) return;
      setVisitedClubIds(result.visitedClubIds);
      window.sessionStorage.setItem(PARTICIPANT_SESSION_KEY, JSON.stringify(result));
    } catch (caught) {
      console.error("Participant progress refresh failed:", caught);
    } finally {
      progressRefreshInFlight.current = false;
    }
  }, []);

  useEffect(() => {
    if (!student) return;
    const currentStudent = student;
    const scheduleRefresh = () => {
      if (progressRefreshTimer.current) clearTimeout(progressRefreshTimer.current);
      progressRefreshTimer.current = setTimeout(() => void refreshParticipantProgress(currentStudent), 250);
    };
    const handleOnline = () => {
      setProgressConnection("connecting");
      scheduleRefresh();
    };
    const handleOffline = () => setProgressConnection("offline");
    const handleVisibility = () => {
      if (document.visibilityState === "visible") scheduleRefresh();
    };

    const channel = supabase
      .channel(`participant:${currentStudent.qrToken}`, {
        config: { private: false, broadcast: { ack: true, self: false } },
      })
      .on("broadcast", { event: "progress_changed" }, scheduleRefresh)
      .subscribe((status, subscribeError) => {
        if (subscribeError) console.error("Participant realtime subscription failed:", subscribeError);
        if (!navigator.onLine) setProgressConnection("offline");
        else if (status === "SUBSCRIBED") {
          setProgressConnection("live");
          scheduleRefresh();
        } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT" || status === "CLOSED") {
          setProgressConnection("fallback");
        }
      });
    const pollingTimer = window.setInterval(() => {
      if (navigator.onLine && document.visibilityState === "visible") void refreshParticipantProgress(currentStudent);
    }, 10_000);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      if (progressRefreshTimer.current) clearTimeout(progressRefreshTimer.current);
      window.clearInterval(pollingTimer);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      document.removeEventListener("visibilitychange", handleVisibility);
      void supabase.removeChannel(channel);
    };
  }, [refreshParticipantProgress, student]);

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
      window.sessionStorage.setItem(PARTICIPANT_SESSION_KEY, JSON.stringify(result));
      notifyParticipantSessionChange();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "เข้าสู่ระบบไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
    } finally { setLoading(false); }
  }

  if (student) {
    const visited = new Set(visitedClubIds);
    const zoneCounts = Object.fromEntries(zones.map((zone) => [zone, clubs.filter((club) => club.location === zone && visited.has(club.id)).length])) as Record<Zone, number>;
    const rewardReady = zoneCounts.front >= 5 && zoneCounts.back >= 5 && visitedClubIds.length >= 10;

    return <div className="mx-auto max-w-5xl py-8 sm:py-14">
      <div className="mb-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="eyebrow">PARTICIPANT LOGIN</p>
          <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-bold ${
            progressConnection === "live"
              ? "border-green-200 bg-green-50 text-green-700"
              : progressConnection === "offline"
                ? "border-red-200 bg-red-50 text-red-700"
                : "border-amber-200 bg-amber-50 text-amber-800"
          }`} role="status" aria-live="polite">
            <i className={`h-2 w-2 rounded-full ${progressConnection === "live" ? "bg-green-600" : progressConnection === "offline" ? "bg-red-600" : "bg-amber-500"}`} />
            {progressConnection === "live" ? "อัปเดตแบบเรียลไทม์" : progressConnection === "offline" ? "ออฟไลน์" : progressConnection === "fallback" ? "กำลังใช้การอัปเดตสำรอง" : "กำลังเชื่อมต่อ…"}
          </span>
        </div>
        <h1 className="mt-2 text-4xl font-black tracking-tight sm:text-5xl">ยินดีต้อนรับ {student.name}</h1>
        <p className="mt-3 text-slate-600">ดู QR และตรวจสอบความคืบหน้าของคุณได้ที่นี่</p>
      </div>
      <div className="grid gap-6 lg:grid-cols-[.7fr_1.3fr]">
        <section className="card h-fit text-center"><h2 className="text-2xl font-black">QR ของคุณ</h2><p className="mt-1 font-mono text-slate-500">{"•".repeat(Math.max(student.studentCode.length - 4, 0)) + student.studentCode.slice(-4)}</p><div className="my-4"><QrImage value={student.qrToken} compact downloadName={`e-stamp-${student.studentCode}.png`} /></div><p className="text-sm leading-6 text-slate-600">บันทึกภาพนี้ไว้ใช้สะสมแสตมป์ที่ทุกบูธ</p></section>
        <section className="card"><div className="flex items-end justify-between gap-3"><div><p className="eyebrow">BOOTH PROGRESS</p><h2 className="mt-1 text-2xl font-black">ความคืบหน้าของคุณ</h2></div><span className="rounded-full bg-green-100 px-3 py-1 text-sm font-bold text-green-800">{visitedClubIds.length}/{clubs.length} แห่ง</span></div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {zones.map((zone) => <button key={zone} type="button" className="rounded-2xl border border-slate-200 bg-white p-4 text-left transition hover:border-red-300 hover:shadow-md" onClick={() => { setOpenZone(zone); setShowRewardConditions(false); }}><div className="flex items-center justify-between gap-2"><span className="font-black">{locationNames[zone]}</span><span className="text-xl text-slate-400">→</span></div><p className="mt-2 text-sm text-slate-500">เข้าร่วมแล้ว {zoneCounts[zone]}/{clubs.filter((club) => club.location === zone).length} บูธ</p><span className="mt-3 inline-block text-sm font-bold text-red-800">กดเพื่อดูบูธ</span></button>)}
            <button type="button" className={`rounded-2xl border p-4 text-left transition hover:shadow-md ${rewardReady ? "border-green-200 bg-green-50" : "border-amber-200 bg-amber-50"}`} onClick={() => { setShowRewardConditions(true); setOpenZone(null); }}><div className="flex items-center justify-between gap-2"><span className="font-black">เงื่อนไขรับรางวัล</span><span className="text-xl">→</span></div><p className={`mt-2 text-sm font-bold ${rewardReady ? "text-green-700" : "text-amber-800"}`}>{rewardReady ? "ตรงเงื่อนไขแล้ว" : "ยังไม่ครบเงื่อนไข"}</p><span className="mt-3 inline-block text-sm font-bold text-slate-700">กดเพื่อดูเงื่อนไข</span></button>
          </div>
          {(openZone || showRewardConditions) && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4" role="presentation" onClick={() => { setOpenZone(null); setShowRewardConditions(false); }}><div className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-white p-5 shadow-2xl sm:p-7" role="dialog" aria-modal="true" aria-label={openZone ? `รายการบูธ ${locationNames[openZone]}` : "เงื่อนไขรับรางวัล"} onClick={(event) => event.stopPropagation()}><div className="sticky top-[-1.25rem] z-10 -mx-5 -mt-5 mb-5 flex items-start justify-between gap-4 bg-white px-5 pb-4 pt-5 sm:top-[-1.75rem] sm:-mx-7 sm:-mt-7 sm:px-7 sm:pb-4 sm:pt-7">{openZone ? <div><p className="eyebrow">BOOTH LIST</p><h3 className="mt-1 text-2xl font-black">{locationNames[openZone]}</h3><p className="mt-1 text-sm text-slate-500">เข้าร่วมแล้ว {zoneCounts[openZone]}/{clubs.filter((club) => club.location === openZone).length} บูธ</p></div> : <div><p className="eyebrow">REWARD STATUS</p><h3 className="mt-1 text-2xl font-black">เงื่อนไขรับรางวัล</h3></div>}<button type="button" className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-slate-100 text-xl font-bold text-slate-600" aria-label="ปิดหน้าต่าง" onClick={() => { setOpenZone(null); setShowRewardConditions(false); }}>×</button></div>{openZone ? <div className="mt-5 space-y-2">{clubs.filter((club) => club.location === openZone).map((club) => { const checkedIn = visited.has(club.id); return <div key={club.id} className={`flex items-center gap-3 rounded-xl border p-3 ${checkedIn ? "border-green-200 bg-green-50" : "border-slate-200 bg-white"}`}><span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl text-sm font-black ${checkedIn ? "bg-green-600 text-white" : "bg-slate-100 text-slate-500"}`}>{checkedIn ? "✓" : club.boothNumber}</span><span className="min-w-0"><b className="block truncate text-sm">{club.name}</b><small className={checkedIn ? "text-green-700" : "text-slate-500"}>{checkedIn ? "เข้าร่วมแล้ว" : `บูธ ${club.boothNumber} · ยังไม่ได้เข้าร่วม`}</small></span></div>; })}</div> : <div className={`mt-5 rounded-2xl border p-4 ${rewardReady ? "border-green-200 bg-green-50" : "border-amber-200 bg-amber-50"}`}><ul className="space-y-1 text-sm leading-6 text-slate-700"><li>{zoneCounts.front >= 5 ? "✓" : "○"} {locationNames.front} อย่างน้อย 5 บูธ ({zoneCounts.front}/5)</li><li>{zoneCounts.back >= 5 ? "✓" : "○"} {locationNames.back} อย่างน้อย 5 บูธ ({zoneCounts.back}/5)</li><li>{visitedClubIds.length >= 10 ? "✓" : "○"} รวมอย่างน้อย 10 บูธ ({visitedClubIds.length}/10)</li></ul><p className={`mt-3 font-bold ${rewardReady ? "text-green-700" : "text-amber-800"}`}>{rewardReady ? "คุณมีสิทธิ์รับรางวัลแล้ว กรุณานำ QR ไปที่บูธรับรางวัล" : "สะสมบูธให้ครบตามเงื่อนไขก่อน แล้วนำ QR ไปที่บูธรับรางวัล"}</p></div>}</div></div>}
        </section>
      </div>
    </div>;
  }

  return <div className="mx-auto grid min-h-[calc(100vh-5rem)] max-w-md place-items-center py-10"><section className="card w-full"><p className="eyebrow">PARTICIPANT LOGIN</p><h1 className="mt-2 text-3xl font-black">เข้าสู่ระบบผู้เข้าร่วม</h1><p className="mt-2 text-sm leading-6 text-slate-600">ใช้ชื่อและรหัสนักศึกษาที่ลงทะเบียนไว้ เพื่อดู QR และความคืบหน้าของคุณ</p><form className="mt-7 space-y-4" onSubmit={submit}><div><label className="block font-bold" htmlFor="name">ชื่อ–นามสกุล</label><input id="name" autoComplete="name" maxLength={120} required value={name} onChange={(e) => setName(e.target.value)} className="field" placeholder="เช่น สมชาย ใจดี" /></div><div><label className="block font-bold" htmlFor="studentCode">รหัสนักศึกษา</label><input id="studentCode" inputMode="numeric" autoComplete="off" maxLength={13} required value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} className="field font-mono tracking-wider" placeholder="6901234567890" /></div>{error && <p role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-4 font-semibold text-red-800">{error}</p>}<button disabled={loading} className="primary w-full" type="submit">{loading ? "กำลังตรวจสอบ…" : "เข้าสู่ระบบ"}</button></form><p className="mt-5 text-center text-sm text-slate-500">ลืมรหัส? กรุณาติดต่อที่บูธรับรางวัล</p><p className="mt-3 text-center text-sm text-slate-600">ยังไม่มีบัญชี? <Link className="font-bold text-red-800 underline" href="/register">ลงทะเบียน</Link></p></section></div>;
}

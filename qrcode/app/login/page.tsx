"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { PARTICIPANT_SESSION_KEY, notifyParticipantSessionChange } from "@/components/AuthNav";
import { QrImage } from "@/components/QrImage";
import { TurnstileChallenge } from "@/components/TurnstileChallenge";
import { TURNSTILE_THRESHOLD, useTurnstileGate } from "@/components/useTurnstileGate";
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
  const [clubsLoaded, setClubsLoaded] = useState(false);
  const [openZone, setOpenZone] = useState<Zone | null>(null);
  const [showRewardConditions, setShowRewardConditions] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [progressConnection, setProgressConnection] = useState<"connecting" | "live" | "fallback" | "offline">("connecting");
  const progressRefreshInFlight = useRef(false);
  const progressRefreshTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const turnstile = useTurnstileGate("participant_login_failed_attempts", "participant_login");

  useEffect(() => {
    getAllClubs().then(setClubs).catch(() => setClubs([])).finally(() => setClubsLoaded(true));
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

  const detailOpen = openZone !== null || showRewardConditions;
  const closeDetail = useCallback(() => { setOpenZone(null); setShowRewardConditions(false); }, []);

  useEffect(() => {
    if (!detailOpen) return;
    const previousOverflow = document.body.style.overflow;
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === "Escape") closeDetail(); };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [closeDetail, detailOpen]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (name.trim().length < 2) return setError("กรุณากรอกชื่อ–นามสกุล");
    if (!/^\d{13}$/.test(code)) return setError("รหัสนักศึกษาต้องเป็นตัวเลข 13 หลัก");
    if (!turnstile.ready) return setError("กำลังเตรียมระบบความปลอดภัย กรุณารอสักครู่");
    setLoading(true); setError("");
    try {
      const verification = await turnstile.verifyChallenge();
      if (!verification.ok) {
        setError(verification.message);
        return;
      }
      const result = await loginStudent(code, name);
      if (!result) {
        const nextFailedAttempts = turnstile.markFailedAttempt();
        setError(nextFailedAttempts === TURNSTILE_THRESHOLD
          ? "ไม่พบผู้ใช้ครบ 3 ครั้ง กรุณายืนยัน Turnstile ก่อนลองใหม่"
          : nextFailedAttempts < TURNSTILE_THRESHOLD
            ? `ไม่พบผู้ใช้ เหลืออีก ${TURNSTILE_THRESHOLD - nextFailedAttempts} ครั้งก่อนต้องยืนยัน Turnstile`
            : "ไม่พบผู้ใช้นี้ กรุณาตรวจสอบชื่อและรหัสนักศึกษา");
        return;
      }
      turnstile.clearFailedAttempts();
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
    const zoneTotals = Object.fromEntries(zones.map((zone) => [zone, clubs.filter((club) => club.location === zone).length])) as Record<Zone, number>;
    const rewardReady = zoneCounts.front >= 5 && zoneCounts.back >= 5 && visitedClubIds.length >= 10;
    const overallPercent = clubs.length ? Math.round((visitedClubIds.length / clubs.length) * 100) : 0;

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
        <section className="card"><div className="flex items-end justify-between gap-3"><div><p className="eyebrow">BOOTH PROGRESS</p><h2 className="mt-1 text-2xl font-black">ความคืบหน้าของคุณ</h2></div><span className={`shrink-0 rounded-full px-3 py-1 text-sm font-bold ${!clubsLoaded ? "bg-slate-100 text-slate-500" : visitedClubIds.length ? "bg-green-100 text-green-800" : "bg-slate-100 text-slate-600"}`}>{clubsLoaded ? `${visitedClubIds.length}/${clubs.length} แห่ง` : "กำลังโหลด…"}</span></div>
          <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-slate-100" role="progressbar" aria-valuemin={0} aria-valuemax={clubs.length} aria-valuenow={visitedClubIds.length} aria-label={`สะสมแล้ว ${visitedClubIds.length} จาก ${clubs.length} บูธ`}><div className="h-full rounded-full bg-green-600 transition-[width] duration-500" style={{ width: `${overallPercent}%` }} /></div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {zones.map((zone) => <button key={zone} type="button" className="rounded-2xl border border-slate-200 bg-white p-4 text-left transition hover:border-red-300 hover:shadow-md active:scale-[.99]" onClick={() => { setOpenZone(zone); setShowRewardConditions(false); }}><div className="flex items-center justify-between gap-2"><span className="font-black">{locationNames[zone]}</span><span className="text-xl text-slate-400">→</span></div><p className="mt-2 text-sm text-slate-500">{clubsLoaded ? `เข้าร่วมแล้ว ${zoneCounts[zone]}/${zoneTotals[zone]} บูธ` : "กำลังโหลดรายการบูธ…"}</p><span className="mt-3 block h-2 overflow-hidden rounded-full bg-slate-100"><span className="block h-full rounded-full transition-[width] duration-500" style={{ width: `${zoneTotals[zone] ? Math.round((zoneCounts[zone] / zoneTotals[zone]) * 100) : 0}%`, background: zoneCounts[zone] >= 5 ? "#16a34a" : "var(--brand)" }} /></span><span className="mt-3 inline-block text-sm font-bold text-red-800">กดเพื่อดูบูธ</span></button>)}
            <button type="button" className={`rounded-2xl border p-4 text-left transition hover:shadow-md active:scale-[.99] ${!clubsLoaded ? "border-slate-200 bg-white" : rewardReady ? "border-green-200 bg-green-50" : "border-amber-200 bg-amber-50"}`} onClick={() => { setShowRewardConditions(true); setOpenZone(null); }}><div className="flex items-center justify-between gap-2"><span className="font-black">เงื่อนไขรับรางวัล</span><span className="text-xl">→</span></div><p className={`mt-2 text-sm font-bold ${!clubsLoaded ? "text-slate-500" : rewardReady ? "text-green-700" : "text-amber-800"}`}>{!clubsLoaded ? "กำลังตรวจสอบ…" : rewardReady ? "✓ ตรงเงื่อนไขแล้ว" : "ยังไม่ครบเงื่อนไข"}</p><span className="mt-3 inline-block text-sm font-bold text-slate-700">กดเพื่อดูเงื่อนไข</span></button>
          </div>
          {detailOpen && <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/60 sm:items-center sm:p-4" role="presentation" onClick={closeDetail}>
            <div className="flex max-h-[88dvh] w-full max-w-lg flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:max-h-[85dvh] sm:rounded-3xl" role="dialog" aria-modal="true" aria-label={openZone ? `รายการบูธ ${locationNames[openZone]}` : "เงื่อนไขรับรางวัล"} onClick={(event) => event.stopPropagation()}>
              <div className="flex shrink-0 items-start justify-between gap-4 border-b border-slate-100 p-5 sm:p-7">
                {openZone
                  ? <div className="min-w-0"><p className="eyebrow">BOOTH LIST</p><h3 className="mt-1 text-2xl font-black">{locationNames[openZone]}</h3><p className="mt-1 text-sm text-slate-500">เข้าร่วมแล้ว {zoneCounts[openZone]}/{zoneTotals[openZone]} บูธ</p></div>
                  : <div className="min-w-0"><p className="eyebrow">REWARD STATUS</p><h3 className="mt-1 text-2xl font-black">เงื่อนไขรับรางวัล</h3></div>}
                <button type="button" className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-slate-100 text-2xl font-bold leading-none text-slate-600 transition hover:bg-slate-200" aria-label="ปิดหน้าต่าง" onClick={closeDetail}>×</button>
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-5 sm:p-7">
                {openZone
                  ? <div className="space-y-2">{clubs.filter((club) => club.location === openZone).map((club) => { const checkedIn = visited.has(club.id); return <div key={club.id} className={`flex items-center gap-3 rounded-xl border p-3 ${checkedIn ? "border-green-200 bg-green-50" : "border-slate-200 bg-white"}`}><span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl text-sm font-black ${checkedIn ? "bg-green-600 text-white" : "bg-slate-100 text-slate-500"}`}>{checkedIn ? "✓" : club.boothNumber}</span><span className="min-w-0"><b className="block truncate text-sm">{club.name}</b><small className={checkedIn ? "text-green-700" : "text-slate-500"}>{checkedIn ? "เข้าร่วมแล้ว" : `บูธ ${club.boothNumber} · ยังไม่ได้เข้าร่วม`}</small></span></div>; })}</div>
                  : <div className={`rounded-2xl border p-4 ${rewardReady ? "border-green-200 bg-green-50" : "border-amber-200 bg-amber-50"}`}><ul className="space-y-1 text-sm leading-6 text-slate-700"><li>{zoneCounts.front >= 5 ? "✓" : "○"} {locationNames.front} อย่างน้อย 5 บูธ ({zoneCounts.front}/5)</li><li>{zoneCounts.back >= 5 ? "✓" : "○"} {locationNames.back} อย่างน้อย 5 บูธ ({zoneCounts.back}/5)</li><li>{visitedClubIds.length >= 10 ? "✓" : "○"} รวมอย่างน้อย 10 บูธ ({visitedClubIds.length}/10)</li></ul><p className={`mt-3 font-bold ${rewardReady ? "text-green-700" : "text-amber-800"}`}>{rewardReady ? "คุณมีสิทธิ์รับรางวัลแล้ว กรุณานำ QR ไปที่บูธรับรางวัล" : "สะสมบูธให้ครบตามเงื่อนไขก่อน แล้วนำ QR ไปที่บูธรับรางวัล"}</p></div>}
              </div>
              <div className="shrink-0 border-t border-slate-100 p-4"><button type="button" className="secondary w-full !min-h-12 !text-base" onClick={closeDetail}>ปิด</button></div>
            </div>
          </div>}
        </section>
      </div>
    </div>;
  }

  return <div className="mx-auto grid min-h-[calc(100vh-5rem)] max-w-md place-items-center py-10">
    <section className="card w-full">
      <p className="eyebrow">PARTICIPANT LOGIN</p>
      <h1 className="mt-2 text-3xl font-black">เข้าสู่ระบบผู้เข้าร่วม</h1>
      <p className="mt-2 text-sm leading-6 text-slate-600">ใช้ชื่อและรหัสนักศึกษาที่ลงทะเบียนไว้ เพื่อดู QR และความคืบหน้าของคุณ</p>
      <form className="mt-7 space-y-4" onSubmit={submit}>
        <div>
          <label className="block font-bold" htmlFor="name">ชื่อ–นามสกุล</label>
          <input id="name" autoComplete="name" maxLength={120} required value={name} onChange={(e) => { setName(e.target.value); if (error) setError(""); }} className="field" placeholder="เช่น สมชาย ใจดี" />
        </div>
        <div>
          <div className="flex items-end justify-between"><label className="block font-bold" htmlFor="studentCode">รหัสนักศึกษา</label><span className={`text-xs ${code.length === 13 ? "text-green-700" : "text-slate-500"}`}>{code.length}/13</span></div>
          <input id="studentCode" inputMode="numeric" autoComplete="off" maxLength={13} required value={code} onChange={(e) => { setCode(e.target.value.replace(/\D/g, "")); if (error) setError(""); }} className="field font-mono tracking-wider" placeholder="6901234567890" />
        </div>
        {turnstile.required && <TurnstileChallenge key={turnstile.widgetKey} action="participant_login" onTokenChange={turnstile.setToken} />}
        {error && <p role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-4 font-semibold text-red-800">{error}</p>}
        <button disabled={loading || !turnstile.ready || (turnstile.required && !turnstile.token)} className="primary w-full" type="submit">{loading ? "กำลังตรวจสอบ…" : "เข้าสู่ระบบ"}</button>
      </form>
      <p className="mt-5 text-center text-sm text-slate-500">ลืมรหัส? กรุณาติดต่อที่บูธรับรางวัล</p>
      <p className="mt-3 text-center text-sm text-slate-600">ยังไม่มีบัญชี? <Link className="font-bold text-red-800 underline" href="/register">ลงทะเบียน</Link></p>
    </section>
  </div>;
}

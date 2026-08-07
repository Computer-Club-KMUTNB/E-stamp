"use client";

import { FormEvent, useState } from "react";
import { TurnstileChallenge } from "@/components/TurnstileChallenge";
import { useTurnstileGate } from "@/components/useTurnstileGate";
import { registerStudent } from "@/lib/dataClient";
import { PARTICIPANT_FACULTIES, PARTICIPANT_LOGIN_PREFILL_KEY, PARTICIPANT_TITLES } from "@/lib/participantRegistration";

export default function RegisterPage() {
  const [code, setCode] = useState("");
  const [title, setTitle] = useState("");
  const [name, setName] = useState("");
  const [faculty, setFaculty] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const turnstile = useTurnstileGate("participant_register_challenge", true);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!title) return setError("กรุณาเลือกคำนำหน้า");
    if (name.trim().length < 2) return setError("กรุณากรอกชื่อ–นามสกุล");
    if (!/^\d{13}$/.test(code)) return setError("รหัสนักศึกษาต้องเป็นตัวเลข 13 หลัก");
    if (!faculty) return setError("กรุณาเลือกคณะ/วิทยาลัย");
    if (!turnstile.ready) return setError("กำลังเตรียมระบบความปลอดภัย กรุณารอสักครู่");
    if (!turnstile.token) return setError("กรุณายืนยันความปลอดภัยก่อนลงทะเบียน");
    setLoading(true); setError("");
    try {
      await registerStudent(code, title, name, faculty, turnstile.token);
      window.sessionStorage.setItem(PARTICIPANT_LOGIN_PREFILL_KEY, JSON.stringify({ code, name: name.trim() }));
      window.location.replace("/login?registered=1");
    }
    catch (caught) {
      turnstile.resetChallenge();
      setError(caught instanceof Error ? caught.message : "เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง");
    }
    finally { setLoading(false); }
  }

  return <div className="mx-auto max-w-5xl py-8 sm:py-14">
    <div className="mb-8">
      <p className="eyebrow">ATTENDEE REGISTRATION</p>
      <h1 className="mt-2 text-4xl font-black tracking-tight sm:text-5xl">ลงทะเบียนเข้าร่วมงาน</h1>
      <p className="mt-3 text-slate-600">ใช้เวลาไม่ถึง 1 นาที และลงทะเบียนเพียงครั้งเดียว</p>
    </div>
    <div className="grid gap-6 lg:grid-cols-[1fr_.58fr]">
      <form className="card" onSubmit={submit}>
        <div className="space-y-5">
          <div className="grid grid-cols-[100px_1fr] gap-3 sm:grid-cols-[120px_1fr]">
            <div>
              <label className="block font-bold" htmlFor="title">คำนำหน้า <span className="text-red-700">*</span></label>
              <select id="title" required value={title} data-placeholder={title ? "false" : "true"} onChange={(event) => { setTitle(event.target.value); if (error) setError(""); }} className="field cursor-pointer appearance-none px-2">
                <option value="" disabled>เลือก</option>
                {PARTICIPANT_TITLES.map((value) => <option key={value} value={value}>{value}</option>)}
              </select>
            </div>
            <div>
              <label className="block font-bold" htmlFor="name">ชื่อ–นามสกุล <span className="text-red-700">*</span></label>
              <input id="name" autoComplete="name" maxLength={120} required value={name} onChange={(event) => { setName(event.target.value); if (error) setError(""); }} className="field" placeholder="เช่น สมชาย ใจดี" />
            </div>
          </div>
          <div>
            <div className="flex items-end justify-between">
              <label className="block font-bold" htmlFor="studentCode">รหัสนักศึกษา <span className="text-red-700">*</span></label>
              <span className={`text-xs ${code.length === 13 ? "text-green-700" : "text-slate-500"}`}>{code.length}/13</span>
            </div>
            <input id="studentCode" inputMode="numeric" autoComplete="off" maxLength={13} required value={code} onChange={(event) => { setCode(event.target.value.replace(/\D/g, "")); if (error) setError(""); }} className="field font-mono tracking-wider" placeholder="6901234567890" />
          </div>
          <div>
            <label className="block font-bold" htmlFor="faculty">คณะ/วิทยาลัย <span className="text-red-700">*</span></label>
            <select id="faculty" required value={faculty} data-placeholder={faculty ? "false" : "true"} onChange={(event) => { setFaculty(event.target.value); if (error) setError(""); }} className="field cursor-pointer appearance-none">
              <option value="" disabled>— เลือกคณะ/วิทยาลัย —</option>
              {PARTICIPANT_FACULTIES.map((value) => <option key={value} value={value}>{value}</option>)}
            </select>
          </div>
          <TurnstileChallenge key={turnstile.widgetKey} action="participant_register" onTokenChange={turnstile.setToken} />
        </div>
        {error && <p role="alert" className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4 font-semibold text-red-800">{error}</p>}
        <button disabled={loading || !turnstile.ready || !turnstile.token} className="primary mt-7 w-full" type="submit">{loading ? "กำลังรับข้อมูล…" : "ยืนยันข้อมูล"}</button>
        <p className="mt-4 text-center text-xs leading-5 text-slate-500">หลังรับข้อมูล ระบบจะพาไปเข้าสู่ระบบเพื่อดู QR ของคุณ</p>
      </form>
      <aside className="soft-panel h-fit">
        <p className="eyebrow">เตรียมตัวก่อนเริ่ม</p>
        <ul className="mt-4 space-y-4 text-sm leading-6 text-slate-600">
          <li><b className="text-slate-900">1.</b> ตรวจสอบชื่อและรหัสให้ถูกต้อง</li>
          <li><b className="text-slate-900">2.</b> หลังลงทะเบียน ให้เข้าสู่ระบบและบันทึกภาพ QR</li>
          <li><b className="text-slate-900">3.</b> ใช้ QR เดิมได้กับทุกบูธ</li>
        </ul>
      </aside>
    </div>
  </div>;
}

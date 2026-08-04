"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { PARTICIPANT_SESSION_KEY } from "@/components/AuthNav";
import { QrImage } from "@/components/QrImage";
import { createStudent } from "@/lib/dataClient";
import type { Student } from "@/lib/types";

const FACULTIES = [
  "คณะครุศาสตร์อุตสาหกรรม",
  "คณะเทคโนโลยีสารสนเทศและนวัตกรรมดิจิทัล",
  "คณะพัฒนาธุรกิจและอุตสาหกรรม",
  "คณะวิทยาศาสตร์ประยุกต์",
  "คณะวิศวกรรมศาสตร์",
  "คณะสถาปัตยกรรมและการออกแบบ",
  "วิทยาลัยเทคโนโลยีอุตสาหกรรม",
  "วิทยาลัยนานาชาติ",
  "บัณฑิตวิทยาลัยวิศวกรรมศาสตร์นานาชาติฯ",
];

export default function RegisterPage() {
  const [code, setCode] = useState("");
  const [title, setTitle] = useState("");
  const [name, setName] = useState("");
  const [faculty, setFaculty] = useState("");
  const [student, setStudent] = useState<Student | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!title) return setError("กรุณาเลือกคำนำหน้า");
    if (name.trim().length < 2) return setError("กรุณากรอกชื่อ–นามสกุล");
    if (!/^\d{13}$/.test(code)) return setError("รหัสนักศึกษาต้องเป็นตัวเลข 13 หลัก");
    if (!faculty) return setError("กรุณาเลือกคณะ/วิทยาลัย");
    setLoading(true); setError("");
    try {
      const createdStudent = await createStudent(code, title, name, faculty);
      window.sessionStorage.setItem(PARTICIPANT_SESSION_KEY, JSON.stringify({ student: createdStudent, visitedClubIds: [] }));
      window.location.replace("/login");
    }
    catch (caught) { setError(caught instanceof Error ? caught.message : "เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง"); }
    finally { setLoading(false); }
  }

  return <div className="mx-auto max-w-5xl py-8 sm:py-14">
    <div className="mb-8"><p className="eyebrow">ATTENDEE REGISTRATION</p><h1 className="mt-2 text-4xl font-black tracking-tight sm:text-5xl">{student ? "QR ของคุณพร้อมแล้ว" : "ลงทะเบียนเข้าร่วมงาน"}</h1><p className="mt-3 text-slate-600">{student ? "บันทึก QR นี้ไว้ใช้สะสมแสตมป์ตลอดงาน" : "ใช้เวลาไม่ถึง 1 นาที และลงทะเบียนเพียงครั้งเดียว"}</p></div>
    {!student ? <div className="grid gap-6 lg:grid-cols-[1fr_.58fr]"><form className="card" onSubmit={submit}><div className="space-y-5"><div className="grid grid-cols-[100px_1fr] sm:grid-cols-[120px_1fr] gap-3"><div><label className="block font-bold" htmlFor="title">คำนำหน้า <span className="text-red-700">*</span></label><select id="title" value={title} data-placeholder={title ? "false" : "true"} onChange={(e) => { setTitle(e.target.value); if (error) setError(""); }} className="field cursor-pointer appearance-none px-2"><option value="" disabled>เลือก</option><option value="นาย">นาย</option><option value="นาง">นาง</option><option value="นางสาว">นางสาว</option></select></div><div><label className="block font-bold" htmlFor="name">ชื่อ–นามสกุล <span className="text-red-700">*</span></label><input id="name" autoComplete="name" maxLength={120} value={name} onChange={(e) => { setName(e.target.value); if (error) setError(""); }} className="field" placeholder="เช่น สมชาย ใจดี" /></div></div><div><div className="flex items-end justify-between"><label className="block font-bold" htmlFor="studentCode">รหัสนักศึกษา <span className="text-red-700">*</span></label><span className={`text-xs ${code.length === 13 ? "text-green-700" : "text-slate-500"}`}>{code.length}/13</span></div><input id="studentCode" inputMode="numeric" autoComplete="off" maxLength={13} value={code} onChange={(e) => { setCode(e.target.value.replace(/\D/g, "")); if (error) setError(""); }} className="field font-mono tracking-wider" placeholder="6901234567890" /></div><div><label className="block font-bold" htmlFor="faculty">คณะ/วิทยาลัย <span className="text-red-700">*</span></label><select id="faculty" value={faculty} data-placeholder={faculty ? "false" : "true"} onChange={(e) => { setFaculty(e.target.value); if (error) setError(""); }} className="field cursor-pointer appearance-none"><option value="" disabled>— เลือกคณะ/วิทยาลัย —</option>{FACULTIES.map((f) => <option key={f} value={f}>{f}</option>)}</select></div></div>{error && <p role="alert" className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4 font-semibold text-red-800">{error}</p>}<button disabled={loading} className="primary mt-7 w-full" type="submit">{loading ? "กำลังสร้าง QR…" : "ยืนยันและรับ QR"}</button><p className="mt-4 text-center text-xs leading-5 text-slate-500">ระบบใช้รหัสแบบเข้ารหัสใน QR และไม่แสดงรหัสนักศึกษาบน QR โดยตรง</p></form><aside className="soft-panel h-fit"><p className="eyebrow">เตรียมตัวก่อนเริ่ม</p><ul className="mt-4 space-y-4 text-sm leading-6 text-slate-600"><li><b className="text-slate-900">1.</b> ตรวจสอบชื่อและรหัสให้ถูกต้อง</li><li><b className="text-slate-900">2.</b> หลังลงทะเบียน ให้บันทึกภาพ QR</li><li><b className="text-slate-900">3.</b> ใช้ QR เดิมได้กับทุกบูธ</li></ul></aside></div> : <section className="card mx-auto max-w-xl text-center"><div className="mb-5 inline-flex rounded-full bg-green-100 px-4 py-2 font-bold text-green-800">✓ ลงทะเบียนสำเร็จ</div><h2 className="text-2xl font-black">{student.title}{student.name}</h2><p className="mt-1 font-mono text-slate-500">{"•".repeat(Math.max(student.studentCode.length - 4, 0)) + student.studentCode.slice(-4)}</p><div className="my-7"><QrImage value={student.qrToken} downloadName={`e-stamp-${student.studentCode}.png`} /></div><div className="soft-panel text-left"><p className="font-bold">ขั้นตอนต่อไป</p><p className="mt-1 text-sm leading-6 text-slate-600">บันทึก QR ลงโทรศัพท์ แล้วแสดงให้เจ้าหน้าที่แต่ละบูธสแกน ไม่ต้องลงทะเบียนซ้ำ</p></div><Link href="/" className="secondary mt-5 w-full">กลับหน้าหลัก</Link></section>}
  </div>;
}

"use client";
import { FormEvent, useState } from "react";
import { QrImage } from "@/components/QrImage";
import { createStudent } from "@/lib/dataClient";
import type { Student } from "@/lib/types";

export default function RegisterPage() {
  const [code, setCode] = useState(""); const [student, setStudent] = useState<Student | null>(null); const [error, setError] = useState(""); const [loading, setLoading] = useState(false);
  async function submit(event: FormEvent) { event.preventDefault(); if (!/^\d{13}$/.test(code)) { setError("กรุณากรอกรหัสนักศึกษาเป็นตัวเลข 13 หลัก"); return; } setLoading(true); setError(""); try { setStudent(await createStudent(code)); } catch { setError("เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง"); } finally { setLoading(false); } }
  return <div className="mx-auto max-w-2xl py-6 sm:py-12"><section className="card">
    <p className="text-sm font-bold uppercase tracking-widest text-brand">Open House E-Stamp</p><h1 className="mt-2 text-3xl font-black sm:text-4xl">ลงทะเบียนผู้เข้าร่วมงาน</h1>
    {!student ? <form className="mt-8" onSubmit={submit}><label className="block text-lg font-bold" htmlFor="studentCode">รหัสนักศึกษา 13 หลัก</label><input id="studentCode" inputMode="numeric" autoComplete="off" maxLength={13} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} className="mt-3 min-h-16 w-full rounded-2xl border-2 border-slate-300 px-5 text-xl outline-none focus:border-brand focus:ring-4 focus:ring-indigo-100" placeholder="เช่น 6601234567890" />
      {error && <p role="alert" className="mt-3 rounded-xl bg-red-50 p-3 font-semibold text-red-700">❌ {error}</p>}<button disabled={loading} className="primary mt-6 w-full" type="submit">{loading ? "กำลังลงทะเบียน…" : "รับ QR Code ของฉัน"}</button></form> : <div className="mt-7 text-center"><div className="mb-5 rounded-2xl bg-green-50 p-4 font-bold text-green-800">✅ ลงทะเบียนสำเร็จ — รหัส {student.studentCode}</div><QrImage value={student.qrToken} downloadName={`e-stamp-${student.studentCode}.png`} /><p className="mt-6 rounded-2xl bg-indigo-50 p-4 text-lg font-bold text-indigo-900">บันทึกภาพหน้าจอนี้ไว้ แล้วแสดงให้เจ้าหน้าที่ชมรม/จุดบริการสแกน</p></div>}
  </section></div>;
}

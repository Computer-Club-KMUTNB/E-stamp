"use client";

import { FormEvent, useState } from "react";
import { adminLogin } from "@/lib/adminSession";
import { supabase } from "@/lib/supabase";

export default function AdminLoginPage({ searchParams }: { searchParams?: { next?: string } }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const isDashboardLogin = searchParams?.next === "/dashboard";

  async function submit(event: FormEvent) {
    event.preventDefault();
    setLoading(true); setError("");
    try {
      const { data: ok, error: rpcError } = await supabase
        .rpc("login_admin", { p_email: email.trim(), p_password: password })
        .single<boolean>();
      if (rpcError || !ok) {
        setError("อีเมลหรือรหัสผ่านไม่ถูกต้อง");
        return;
      }
      adminLogin(email.trim(), password);
      const requested = new URLSearchParams(window.location.search).get("next") ?? "/dev";
      const destination = requested.startsWith("/") && !requested.startsWith("//") ? requested : "/dev";
      window.location.replace(destination);
    } catch {
      setError(isDashboardLogin ? "ไม่สามารถเข้าสู่ Dashboard ได้ กรุณาลองใหม่อีกครั้ง" : "เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง");
    } finally {
      setLoading(false);
    }
  }

  return <div className="mx-auto grid min-h-[calc(100vh-5rem)] max-w-md place-items-center py-10">
    <section className="card w-full">
      <div className="mb-6 grid h-14 w-14 place-items-center rounded-2xl bg-slate-950 text-2xl text-white">⚙</div>
      <p className="eyebrow">{isDashboardLogin ? "DASHBOARD ACCESS" : "ADMIN ACCESS"}</p>
      <h1 className="mt-2 text-3xl font-black">{isDashboardLogin ? "เข้าสู่ Event Dashboard" : "เข้าสู่ระบบ Admin"}</h1>
      <p className="mt-2 text-sm leading-6 text-slate-600">{isDashboardLogin ? "เข้าสู่ระบบเพื่อดูภาพรวมและติดตามการเข้าร่วมกิจกรรมแบบเรียลไทม์" : "เฉพาะผู้ดูแลระบบที่ได้รับบัญชีจากผู้จัดงานเท่านั้น"}</p>
      <form className="mt-7 space-y-4" onSubmit={submit}>
        <div>
          <label className="font-bold" htmlFor="email">อีเมล</label>
          <input className="field" id="email" type="email" autoComplete="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="admin@example.com" />
        </div>
        <div>
          <label className="font-bold" htmlFor="password">รหัสผ่าน</label>
          <input className="field" id="password" type="password" autoComplete="current-password" required value={password} onChange={e => setPassword(e.target.value)} />
        </div>
        {error && <p role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-3 font-bold text-red-800">{error}</p>}
        <button className="primary w-full" disabled={loading}>{loading ? (isDashboardLogin ? "กำลังเข้าสู่ Dashboard…" : "กำลังตรวจสอบ…") : (isDashboardLogin ? "เข้าสู่ Dashboard" : "เข้าสู่ระบบ")}</button>
      </form>
      <p className="mt-5 text-center text-xs text-slate-500">เจ้าหน้าที่บูธ? <a href="/staff-login" className="font-bold text-slate-700 underline">เข้าสู่ระบบด้วย PIN</a></p>
    </section>
  </div>;
}

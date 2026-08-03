"use client";

import { FormEvent, useState } from "react";
import { adminLogin } from "@/lib/adminSession";
import { supabase } from "@/lib/supabase";

export default function AdminLoginPage({ searchParams }: { searchParams?: { next?: string } }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const isDashboardLogin = searchParams?.next === "/dashboard";

  async function submit(event: FormEvent) {
    event.preventDefault();
    setLoading(true); setError("");
    try {
      if (isDashboardLogin) {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (signInError) {
          setError("อีเมลหรือรหัสผ่านไม่ถูกต้อง");
          return;
        }
        window.location.replace("/dashboard");
        return;
      }

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
          <label className="block font-bold" htmlFor="email">อีเมล</label>
          <input className="field" id="email" type="email" inputMode="email" autoComplete="email" required aria-invalid={error ? true : undefined} value={email} onChange={e => { setEmail(e.target.value); if (error) setError(""); }} placeholder="admin@example.com" />
        </div>
        <div>
          <label className="block font-bold" htmlFor="password">รหัสผ่าน</label>
          <div className="relative mt-2">
            <input className="field !mt-0 pr-20" id="password" type={showPassword ? "text" : "password"} autoComplete="current-password" required aria-invalid={error ? true : undefined} value={password} onChange={e => { setPassword(e.target.value); if (error) setError(""); }} />
            <button type="button" onClick={() => setShowPassword(v => !v)} aria-pressed={showPassword} className="absolute right-2 top-1/2 -translate-y-1/2 rounded-xl px-3 py-2 text-sm font-bold text-slate-600 hover:bg-slate-100">{showPassword ? "ซ่อน" : "แสดง"}</button>
          </div>
        </div>
        {error && <p role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-3 font-bold text-red-800">{error}</p>}
        <button className="primary w-full" disabled={loading}>{loading ? (isDashboardLogin ? "กำลังเข้าสู่ Dashboard…" : "กำลังตรวจสอบ…") : (isDashboardLogin ? "เข้าสู่ Dashboard" : "เข้าสู่ระบบ")}</button>
      </form>
      <p className="mt-5 text-center text-xs text-slate-500">เจ้าหน้าที่บูธ? <a href="/staff-login" className="font-bold text-slate-700 underline">เข้าสู่ระบบด้วย PIN</a></p>
    </section>
  </div>;
}

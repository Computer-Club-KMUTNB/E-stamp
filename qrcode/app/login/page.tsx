"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function StaffLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault(); setLoading(true); setError("");
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    if (signInError) { setError("อีเมลหรือรหัสผ่านไม่ถูกต้อง"); setLoading(false); return; }
    const requested = new URLSearchParams(window.location.search).get("next") ?? "/dev";
    router.replace(requested.startsWith("/") && !requested.startsWith("//") ? requested : "/dev");
    router.refresh();
  }

  return <div className="mx-auto grid min-h-[calc(100vh-5rem)] max-w-md place-items-center py-10"><section className="card w-full"><div className="mb-6 grid h-14 w-14 place-items-center rounded-2xl bg-slate-950 text-2xl text-white">⌗</div><p className="eyebrow">STAFF ACCESS</p><h1 className="mt-2 text-3xl font-black">เข้าสู่ระบบเจ้าหน้าที่</h1><p className="mt-2 text-sm leading-6 text-slate-600">เฉพาะเจ้าหน้าที่ที่ได้รับบัญชีจากผู้จัดงานเท่านั้น</p><form className="mt-7 space-y-4" onSubmit={submit}><div><label className="font-bold" htmlFor="email">อีเมล</label><input className="field" id="email" type="email" autoComplete="email" required value={email} onChange={e=>setEmail(e.target.value)} placeholder="staff@example.com" /></div><div><label className="font-bold" htmlFor="password">รหัสผ่าน</label><input className="field" id="password" type="password" autoComplete="current-password" required value={password} onChange={e=>setPassword(e.target.value)} /></div>{error && <p role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-3 font-bold text-red-800">{error}</p>}<button className="primary w-full" disabled={loading}>{loading ? "กำลังตรวจสอบ…" : "เข้าสู่ระบบ"}</button></form><p className="mt-5 text-center text-xs text-slate-500">หากเข้าไม่ได้ กรุณาติดต่อผู้ดูแลระบบ</p></section></div>;
}

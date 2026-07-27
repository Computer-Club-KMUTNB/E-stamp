"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";

const PIN_LENGTH = 6;

export default function StaffLoginPage() {
  const [pin, setPin] = useState<string[]>(Array(PIN_LENGTH).fill(""));
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => { inputs.current[0]?.focus(); }, []);

  function handleChange(index: number, value: string) {
    const digit = value.replace(/\D/g, "").slice(-1);
    const next = [...pin];
    next[index] = digit;
    setPin(next);
    if (digit && index < PIN_LENGTH - 1) inputs.current[index + 1]?.focus();
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !pin[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    const digits = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, PIN_LENGTH);
    if (!digits) return;
    e.preventDefault();
    const next = [...pin];
    digits.split("").forEach((d, i) => { next[i] = d; });
    setPin(next);
    inputs.current[Math.min(digits.length, PIN_LENGTH - 1)]?.focus();
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    const pinValue = pin.join("");
    if (pinValue.length < PIN_LENGTH) return setError("กรุณากรอก PIN ให้ครบ 6 หลัก");
    setLoading(true); setError("");
    try {
      const { data, error: rpcError } = await supabase
        .rpc("lookup_booth_pin", { p_pin: pinValue })
        .single<string>();
      if (rpcError || !data) {
        setError("PIN ไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง");
        setPin(Array(PIN_LENGTH).fill(""));
        inputs.current[0]?.focus();
        return;
      }
      // Store PIN session in sessionStorage
      window.sessionStorage.setItem("staff_pin_booth", data);
      if (data === "reward") {
        window.location.replace(`/reward/reward`);
      } else {
        window.location.replace(`/scan/${encodeURIComponent(data)}`);
      }
    } catch {
      setError("เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง");
    } finally {
      setLoading(false);
    }
  }

  const pinFilled = pin.every(Boolean);

  return <div className="mx-auto grid min-h-[calc(100vh-5rem)] max-w-md place-items-center py-10">
    <section className="card w-full">
      <div className="mb-6 grid h-14 w-14 place-items-center rounded-2xl bg-slate-950 text-2xl text-white">⌗</div>
      <p className="eyebrow">BOOTH STAFF ACCESS</p>
      <h1 className="mt-2 text-3xl font-black">เข้าสู่ระบบด้วย PIN</h1>
      <p className="mt-2 text-sm leading-6 text-slate-600">กรอก PIN 6 หลักที่ได้รับจากผู้จัดงาน</p>
      <form className="mt-7" onSubmit={submit}>
        <div className="flex justify-center gap-2" onPaste={handlePaste}>
          {pin.map((digit, i) => (
            <input
              key={i}
              ref={(el) => { inputs.current[i] = el; }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              className="h-14 w-12 rounded-2xl border-2 bg-white text-center text-2xl font-black outline-none transition"
              style={{
                borderColor: digit ? "var(--brand)" : "var(--line)",
                boxShadow: digit ? "0 0 0 4px rgba(173,59,39,.1)" : undefined,
              }}
              autoComplete="off"
            />
          ))}
        </div>
        {error && <p role="alert" className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-3 text-center font-bold text-red-800">{error}</p>}
        <button className="primary mt-7 w-full" disabled={loading || !pinFilled}>
          {loading ? "กำลังตรวจสอบ…" : "เข้าสู่ระบบ"}
        </button>
      </form>
      <p className="mt-5 text-center text-xs text-slate-500">
        ผู้ดูแลระบบ? <a href="/admin-login" className="font-bold text-slate-700 underline">เข้าสู่ระบบแบบ Admin</a>
      </p>
    </section>
  </div>;
}

"use client";

import { useEffect, useRef, useState } from "react";

export const TURNSTILE_THRESHOLD = 3;

export type TurnstileAction = "staff_login" | "participant_login" | "dashboard_login";

type VerificationResult = { ok: true } | { ok: false; message: string };

export function useTurnstileGate(storageKey: string, action: TurnstileAction) {
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [token, setToken] = useState("");
  const [widgetKey, setWidgetKey] = useState(0);
  const [ready, setReady] = useState(false);
  const failedAttemptsRef = useRef(0);

  useEffect(() => {
    const storedAttempts = Number.parseInt(window.sessionStorage.getItem(storageKey) ?? "0", 10);
    if (Number.isFinite(storedAttempts) && storedAttempts > 0) {
      failedAttemptsRef.current = storedAttempts;
      setFailedAttempts(storedAttempts);
    }
    setReady(true);
  }, [storageKey]);

  function resetChallenge() {
    setToken("");
    setWidgetKey((current) => current + 1);
  }

  function markFailedAttempt() {
    const nextFailedAttempts = failedAttemptsRef.current + 1;
    failedAttemptsRef.current = nextFailedAttempts;
    setFailedAttempts(nextFailedAttempts);
    window.sessionStorage.setItem(storageKey, String(nextFailedAttempts));
    if (nextFailedAttempts >= TURNSTILE_THRESHOLD) resetChallenge();
    return nextFailedAttempts;
  }

  function clearFailedAttempts() {
    failedAttemptsRef.current = 0;
    setFailedAttempts(0);
    setToken("");
    window.sessionStorage.removeItem(storageKey);
  }

  async function verifyChallenge(): Promise<VerificationResult> {
    if (failedAttempts < TURNSTILE_THRESHOLD) return { ok: true };
    if (!token) return { ok: false, message: "กรุณายืนยัน Cloudflare Turnstile ก่อนเข้าสู่ระบบ" };

    const currentToken = token;
    resetChallenge();
    try {
      const response = await fetch("/api/turnstile/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: currentToken, action }),
      });
      const result = await response.json().catch(() => null) as { success?: boolean; message?: string } | null;
      if (!response.ok || !result?.success) {
        return { ok: false, message: result?.message ?? "ไม่สามารถยืนยัน Turnstile ได้ กรุณาลองใหม่" };
      }
      return { ok: true };
    } catch {
      return { ok: false, message: "ไม่สามารถเชื่อมต่อระบบยืนยัน Turnstile ได้ กรุณาลองใหม่" };
    }
  }

  return {
    failedAttempts,
    required: failedAttempts >= TURNSTILE_THRESHOLD,
    ready,
    token,
    widgetKey,
    setToken,
    markFailedAttempt,
    clearFailedAttempts,
    resetChallenge,
    verifyChallenge,
  };
}

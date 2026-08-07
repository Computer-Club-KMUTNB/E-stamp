"use client";

import Script from "next/script";
import { useEffect, useRef, useState } from "react";
import type { TurnstileAction } from "./useTurnstileGate";

const TURNSTILE_SCRIPT_URL = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
const DEVELOPMENT_SITE_KEY = "1x00000000000000000000AA";

type TurnstileOptions = {
  sitekey: string;
  action: TurnstileAction;
  theme: "light";
  size: "flexible";
  appearance: "interaction-only";
  callback: (token: string) => void;
  "expired-callback": () => void;
  "timeout-callback": () => void;
  "error-callback": () => boolean;
};

declare global {
  interface Window {
    turnstile?: {
      render: (container: HTMLElement, options: TurnstileOptions) => string;
      remove: (widgetId: string) => void;
    };
  }
}

type TurnstileChallengeProps = {
  action: TurnstileAction;
  onTokenChange: (token: string) => void;
};

export function TurnstileChallenge({ action, onTokenChange }: TurnstileChallengeProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const tokenChangeRef = useRef(onTokenChange);
  const [scriptReady, setScriptReady] = useState(false);
  const [widgetError, setWidgetError] = useState(false);
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY
    || (process.env.NODE_ENV === "development" ? DEVELOPMENT_SITE_KEY : "");

  tokenChangeRef.current = onTokenChange;

  useEffect(() => {
    if (!scriptReady || !siteKey || !containerRef.current || !window.turnstile) return;
    const widgetId = window.turnstile.render(containerRef.current, {
      sitekey: siteKey,
      action,
      theme: "light",
      size: "flexible",
      appearance: "interaction-only",
      callback: (token) => {
        setWidgetError(false);
        tokenChangeRef.current(token);
      },
      "expired-callback": () => tokenChangeRef.current(""),
      "timeout-callback": () => tokenChangeRef.current(""),
      "error-callback": () => {
        setWidgetError(true);
        tokenChangeRef.current("");
        return true;
      },
    });
    return () => window.turnstile?.remove(widgetId);
  }, [action, scriptReady, siteKey]);

  return <>
    <Script id="cloudflare-turnstile" src={TURNSTILE_SCRIPT_URL} strategy="afterInteractive" onReady={() => setScriptReady(true)} onError={() => setWidgetError(true)} />
    {siteKey
      ? <div ref={containerRef} className="w-full overflow-hidden" />
      : <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm font-bold text-red-700">ยังไม่ได้ตั้งค่า NEXT_PUBLIC_TURNSTILE_SITE_KEY</p>}
    {widgetError && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm font-bold text-red-700">โหลด Turnstile ไม่สำเร็จ กรุณาตรวจสอบอินเทอร์เน็ตแล้วลองใหม่</p>}
  </>;
}

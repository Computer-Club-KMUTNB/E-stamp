"use client";

import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from "react";
import type { CameraDevice, Html5QrcodeCameraScanConfig } from "html5-qrcode";

type ScannerState = "idle" | "starting" | "scanning" | "processing" | "error";

export type ScannerHandle = { start: () => Promise<void> };

function cameraErrorMessage(error: unknown) {
  if (!window.isSecureContext) {
    return `หน้านี้ไม่ใช่ Secure Context (${window.location.origin}) กรุณาเปิดผ่าน HTTPS หรือเปิด localhost บนอุปกรณ์เครื่องเดียวกับที่รันเว็บ`;
  }
  if (!navigator.mediaDevices?.getUserMedia) {
    return "เบราว์เซอร์นี้ไม่รองรับการเปิดกล้อง กรุณาใช้ Safari หรือ Chrome เวอร์ชันล่าสุด";
  }

  const detail = error instanceof Error ? `${error.name} ${error.message}` : String(error);
  if (/NotAllowed|Permission|denied/i.test(detail)) {
    return "ไม่ได้รับสิทธิ์ใช้กล้อง กรุณาอนุญาต Camera ในการตั้งค่าเว็บไซต์ แล้วโหลดหน้าใหม่";
  }
  if (/NotFound|DevicesNotFound|no camera/i.test(detail)) {
    return "ไม่พบกล้องบนอุปกรณ์นี้ กรุณาตรวจว่ากล้องไม่ได้ถูกปิดหรือใช้งานโดยแอปอื่น";
  }
  if (/NotReadable|TrackStart|Could not start/i.test(detail)) {
    return "กล้องกำลังถูกใช้งานโดยแอปหรือแท็บอื่น กรุณาปิดแอปกล้อง/วิดีโอแล้วลองใหม่";
  }
  return `เปิดกล้องไม่สำเร็จ (${detail || "ไม่ทราบสาเหตุ"})`;
}

export const Scanner = forwardRef<ScannerHandle, { onScan: (text: string) => Promise<void>; resetKey: number }>(function Scanner({ onScan, resetKey }, ref) {
  const scannerRef = useRef<import("html5-qrcode").Html5Qrcode | null>(null);
  const locked = useRef(false);
  const [state, setState] = useState<ScannerState>("idle");
  const [error, setError] = useState("");

  const stop = useCallback(async () => {
    const scanner = scannerRef.current;
    scannerRef.current = null;
    if (!scanner) return;
    try { if (scanner.isScanning) await scanner.stop(); } catch {}
    try { scanner.clear(); } catch {}
  }, []);

  const start = useCallback(async () => {
    setState("starting");
    setError("");
    locked.current = false;
    await stop();

    try {
      if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
        throw new Error("InsecureContext");
      }

      const { Html5Qrcode } = await import("html5-qrcode");
      const config: Html5QrcodeCameraScanConfig = {
        fps: 10,
        qrbox: (width, height) => {
          const size = Math.floor(Math.min(width, height) * 0.72);
          return { width: size, height: size };
        },
        aspectRatio: 1,
      };
      const success = async (text: string) => {
        if (locked.current) return;
        locked.current = true;
        setState("processing");
        await stop();
        await onScan(text.trim());
      };

      let scanner = new Html5Qrcode("qr-reader", { verbose: false });
      scannerRef.current = scanner;
      try {
        await scanner.start({ facingMode: "environment" }, config, success, () => {});
      } catch (rearCameraError) {
        // Desktop และอุปกรณ์บางรุ่นไม่มี camera ที่ระบุ environment:
        // ขอรายการกล้องแล้วเลือกกล้องหลัง หรือกล้องตัวแรกเป็น fallback
        try { scanner.clear(); } catch {}
        const cameras: CameraDevice[] = await Html5Qrcode.getCameras();
        if (!cameras.length) throw rearCameraError;
        const preferred = cameras.find((camera) => /back|rear|environment|หลัง/i.test(camera.label)) ?? cameras[0];
        scanner = new Html5Qrcode("qr-reader", { verbose: false });
        scannerRef.current = scanner;
        await scanner.start(preferred.id, config, success, () => {});
      }
      setState("scanning");
    } catch (caught) {
      await stop();
      setError(cameraErrorMessage(caught));
      setState("error");
    }
  }, [onScan, stop]);

  useImperativeHandle(ref, () => ({ start }), [start]);

  useEffect(() => {
    locked.current = false;
    setState("idle");
    setError("");
    void stop();
  }, [resetKey, stop]);
  useEffect(() => () => { void stop(); }, [stop]);

  return <div className="space-y-4">
    <div className="scanner-viewport relative min-h-72 overflow-hidden rounded-2xl border border-slate-700 bg-slate-950 shadow-inner sm:min-h-96 sm:rounded-3xl">
      <div id="qr-reader" className="min-h-72 w-full sm:min-h-96" />
      {(state === "idle" || state === "error") && <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center text-white"><span className="grid h-20 w-20 place-items-center rounded-3xl border border-white/20 bg-white/10 text-5xl">⌗</span><p className="mt-5 text-xl font-bold">พร้อมสแกน QR</p><p className="mt-1 text-sm text-slate-400">กดปุ่มด้านล่าง แล้วจัด QR ให้อยู่กลางกรอบ</p></div>}
      {state === "processing" && <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/95 px-6 text-center text-white"><span className="h-12 w-12 animate-spin rounded-full border-4 border-white/20 border-t-red-400"/><p className="mt-5 text-xl font-bold">กำลังบันทึกข้อมูล…</p><p className="mt-1 text-sm text-slate-400">รับ QR แล้ว กรุณารอสักครู่</p></div>}
    </div>
    {error && <p role="alert" className="rounded-2xl bg-red-50 p-4 font-bold text-red-700">❌ {error}</p>}
    {(state === "idle" || state === "starting" || state === "error") && <button className="primary w-full" disabled={state === "starting"} onClick={start}>{state === "starting" ? "กำลังเปิดกล้อง…" : state === "error" ? "ลองเปิดกล้องอีกครั้ง" : "เริ่มสแกน"}</button>}
    {state === "scanning" && <p className="rounded-2xl border border-green-200 bg-green-50 p-4 text-center font-bold text-green-800"><span className="mr-2 inline-block h-2 w-2 animate-pulse rounded-full bg-green-600"/>กล้องพร้อม — กำลังค้นหา QR</p>}
    {state === "processing" && <p className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-center font-bold text-amber-900"><span className="mr-2 inline-block h-2 w-2 animate-pulse rounded-full bg-amber-600"/>กำลังบันทึกข้อมูล…</p>}
  </div>;
});

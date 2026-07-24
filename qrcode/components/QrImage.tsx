"use client";
import QRCode from "qrcode";
import { useEffect, useState } from "react";

export function QrImage({ value, label, downloadName = "e-stamp-qr.png", compact = false }: { value: string; label?: string; downloadName?: string; compact?: boolean }) {
  const [src, setSrc] = useState("");
  useEffect(() => { QRCode.toDataURL(value, { width: 640, margin: 3, errorCorrectionLevel: "H" }).then(setSrc); }, [value]);
  const imageClass = compact ? "w-full max-w-48 rounded-2xl border bg-white p-2 shadow-sm" : "w-full max-w-64 rounded-3xl border bg-white p-4 shadow-sm";
  const placeholderClass = compact ? "h-48 w-48 animate-pulse rounded-2xl bg-slate-100" : "h-64 w-64 animate-pulse rounded-3xl bg-slate-100";
  const downloadClass = compact ? "secondary w-full max-w-48" : "secondary w-full max-w-64";
  return <div className="flex flex-col items-center gap-4">{label && <p className="font-bold text-slate-700">{label}</p>}{src ? <img className={imageClass} src={src} alt={`QR Code ${label ?? ""}`} /> : <div className={placeholderClass} />}
    <a className={downloadClass} href={src} download={downloadName} aria-disabled={!src}>บันทึก QR ลงเครื่อง</a></div>;
}

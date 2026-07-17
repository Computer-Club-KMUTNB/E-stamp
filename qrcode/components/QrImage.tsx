"use client";
import QRCode from "qrcode";
import { useEffect, useState } from "react";

export function QrImage({ value, label, downloadName = "e-stamp-qr.png" }: { value: string; label?: string; downloadName?: string }) {
  const [src, setSrc] = useState("");
  useEffect(() => { QRCode.toDataURL(value, { width: 640, margin: 3, errorCorrectionLevel: "H" }).then(setSrc); }, [value]);
  return <div className="flex flex-col items-center gap-4">{label && <p className="font-bold text-slate-700">{label}</p>}{src ? <img className="w-full max-w-64 rounded-3xl border bg-white p-4 shadow-sm" src={src} alt={`QR Code ${label ?? ""}`} /> : <div className="h-64 w-64 animate-pulse rounded-3xl bg-slate-100" />}
    <a className="secondary w-full max-w-64" href={src} download={downloadName} aria-disabled={!src}>บันทึก QR ลงเครื่อง</a></div>;
}

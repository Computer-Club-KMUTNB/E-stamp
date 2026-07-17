"use client";
import QRCode from "qrcode";
import { useEffect, useState } from "react";

export function QrImage({ value, label, downloadName = "e-stamp-qr.png" }: { value: string; label?: string; downloadName?: string }) {
  const [src, setSrc] = useState("");
  useEffect(() => { QRCode.toDataURL(value, { width: 640, margin: 3, errorCorrectionLevel: "H" }).then(setSrc); }, [value]);
  return <div className="flex flex-col items-center gap-4">{label && <p className="font-bold">{label}</p>}{src ? <img className="w-full max-w-72 rounded-2xl border bg-white p-3" src={src} alt={`QR Code ${label ?? ""}`} /> : <div className="h-72 w-72 animate-pulse rounded-2xl bg-slate-100" />}
    <a className="secondary w-full max-w-72" href={src} download={downloadName}>ดาวน์โหลด QR</a></div>;
}

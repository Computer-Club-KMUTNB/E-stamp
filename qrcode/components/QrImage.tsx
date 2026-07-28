"use client";
import QRCode from "qrcode";
import { useEffect, useState } from "react";

export function QrImage({ value, label, downloadName = "e-stamp-qr.png", compact = false }: { value: string; label?: string; downloadName?: string; compact?: boolean }) {
  const [src, setSrc] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => { QRCode.toDataURL(value, { width: 640, margin: 3, errorCorrectionLevel: "H" }).then(setSrc); }, [value]);

  useEffect(() => {
    if (!isExpanded) return;

    const previousOverflow = document.body.style.overflow;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsExpanded(false);
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [isExpanded]);

  const imageClass = compact ? "w-full max-w-48 rounded-2xl border bg-white p-2 shadow-sm" : "w-full max-w-64 rounded-3xl border bg-white p-4 shadow-sm";
  const placeholderClass = compact ? "h-48 w-48 animate-pulse rounded-2xl bg-slate-100" : "h-64 w-64 animate-pulse rounded-3xl bg-slate-100";
  const downloadClass = compact ? "secondary w-full max-w-48" : "secondary w-full max-w-64";

  return <div className="flex flex-col items-center gap-4">
    {label && <p className="font-bold text-slate-700">{label}</p>}
    {src ? <button type="button" className="group relative rounded-3xl" onClick={() => setIsExpanded(true)} aria-label="ขยาย QR Code">
      <img className={`${imageClass} transition group-hover:border-red-300 group-hover:shadow-md`} src={src} alt={`QR Code ${label ?? ""}`} />
      <span className="absolute bottom-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-slate-950/75 px-3 py-1 text-xs font-bold text-white shadow-sm">แตะเพื่อขยาย</span>
    </button> : <div className={placeholderClass} />}
    <a className={downloadClass} href={src} download={downloadName} aria-disabled={!src}>บันทึก QR ลงเครื่อง</a>

    {isExpanded && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 p-4 backdrop-blur-sm sm:p-8" role="dialog" aria-modal="true" aria-label="QR Code แบบขยาย" onClick={() => setIsExpanded(false)}>
      <div className="flex max-h-full w-full max-w-2xl flex-col items-center gap-4" onClick={(event) => event.stopPropagation()}>
        <div className="flex w-full justify-end">
          <button type="button" className="grid h-12 w-12 place-items-center rounded-full bg-white text-2xl font-bold text-slate-900 shadow-lg" onClick={() => setIsExpanded(false)} aria-label="ปิด QR Code แบบขยาย">×</button>
        </div>
        <img className="max-h-[calc(100dvh-9rem)] w-auto max-w-full rounded-3xl bg-white p-3 shadow-2xl sm:p-5" src={src} alt={`QR Code ${label ?? ""} แบบขยาย`} />
        <p className="rounded-full bg-slate-950/60 px-4 py-2 text-center text-sm font-semibold text-white">แสดงหน้าจอนี้ให้เจ้าหน้าที่สแกน</p>
      </div>
    </div>}
  </div>;
}

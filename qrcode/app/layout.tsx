import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { AuthNav } from "@/components/AuthNav";
import "./globals.css";

export const metadata: Metadata = { title: "OPENWORLD KMUTNB", description: "ระบบสะสมแสตมป์ด้วย QR Code สำหรับงาน OPENWORLD KMUTNB" };
export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover", themeColor: "#f6f2ea" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="th"><body><div className="site-shell"><nav className="site-nav" aria-label="เมนูหลัก"><Link href="/" className="site-brand"><span className="site-brand-mark">O</span><span>OPENWORLD KMUTNB</span></Link><div className="site-nav-links"><AuthNav /></div></nav><main>{children}</main></div></body></html>;
}

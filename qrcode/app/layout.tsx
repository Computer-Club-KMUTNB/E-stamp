import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { AuthNav } from "@/components/AuthNav";
import "./globals.css";

export const metadata: Metadata = { title: "E-Stamp Open World", description: "ระบบสะสมแสตมป์ด้วย QR Code" };
export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover", themeColor: "#f6f2ea" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="th"><body><div className="site-shell"><nav className="site-nav" aria-label="เมนูหลัก"><Link href="/" className="site-brand"><span className="site-brand-mark">E</span><span>E-STAMP</span></Link><div className="site-nav-links"><Link className="site-nav-link" href="/register">ลงทะเบียน</Link><AuthNav /></div></nav><main>{children}</main></div></body></html>;
}

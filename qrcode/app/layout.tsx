import type { Metadata, Viewport } from "next";
import { AuthNav } from "@/components/AuthNav";
import { SiteBrand } from "@/components/SiteBrand";
import "./globals.css";

export const metadata: Metadata = { title: "OPENWORLD KMUTNB", description: "ระบบสะสมแสตมป์ด้วย QR Code สำหรับงาน OPENWORLD KMUTNB" };
export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover", themeColor: "#f6f2ea" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="th"><body><div className="site-shell"><nav className="site-nav" aria-label="เมนูหลัก"><SiteBrand /><div className="site-nav-links"><AuthNav /></div></nav><main>{children}</main><footer className="site-footer"><img src="/cck_logo-black.png" alt="โลโก้ชมรมคอมพิวเตอร์ มจพ." /><span>พัฒนาโดย ชมรมคอมพิวเตอร์ มจพ.</span></footer></div></body></html>;
}

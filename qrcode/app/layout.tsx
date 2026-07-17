import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = { title: "E-Stamp Open House", description: "ระบบสะสมแสตมป์ด้วย QR Code" };
export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="th"><body><main className="mx-auto min-h-screen w-full max-w-6xl p-4 sm:p-8">{children}</main></body></html>;
}

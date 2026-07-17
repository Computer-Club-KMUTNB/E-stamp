import Link from "next/link";

export default function Home() {
  return <div className="flex min-h-[85vh] items-center justify-center"><section className="card w-full max-w-2xl text-center">
    <div className="mb-5 text-6xl">🎟️</div><h1 className="text-4xl font-black sm:text-5xl">E-Stamp Open House</h1>
    <p className="mx-auto mt-4 max-w-lg text-lg text-slate-600">ลงทะเบียนเพื่อรับ QR Code ส่วนตัว แล้วนำไปให้เจ้าหน้าที่ชมรมสแกนเพื่อสะสมแสตมป์</p>
    <div className="mt-8 grid gap-3 sm:grid-cols-2"><Link className="primary" href="/register">ลงทะเบียนรับ QR</Link><Link className="secondary" href="/dev">หน้าทดสอบเจ้าหน้าที่</Link></div>
  </section></div>;
}

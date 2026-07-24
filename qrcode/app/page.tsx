import Link from "next/link";

export default function Home() {
  return <div className="mx-auto max-w-4xl py-14 sm:py-24"><section className="text-center"><p className="eyebrow">OPENWORLD KMUTNB</p><h1 className="mt-3 text-5xl font-black tracking-tight sm:text-7xl">สะสมทุกกิจกรรม<br /><span className="text-red-800">จบใน QR เดียว</span></h1><p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-slate-600">ระบบ E-Stamp สำหรับผู้เข้าร่วมงาน</p><div className="mx-auto mt-10 grid max-w-xl gap-3 sm:grid-cols-2"><Link className="primary" href="/register">ลงทะเบียน</Link><Link className="secondary" href="/login">เข้าสู่ระบบ</Link></div></section></div>;
}

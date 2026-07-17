import Link from "next/link";

export default function Home() {
  return <div className="grid min-h-[calc(100vh-7rem)] items-center gap-10 py-12 lg:grid-cols-[1.15fr_.85fr] lg:py-20">
    <section><p className="eyebrow">KMUTNB OPEN WORLD</p><h1 className="mt-5 max-w-3xl text-5xl font-black leading-[1.02] tracking-[-.055em] sm:text-7xl">หนึ่ง QR<br/><span style={{color:"var(--brand)"}}>ครบทุกกิจกรรม</span></h1><p className="mt-7 max-w-xl text-lg leading-8 text-slate-600">ลงทะเบียนครั้งเดียว รับ QR ส่วนตัว แล้วนำไปให้เจ้าหน้าที่สแกนเพื่อสะสมแสตมป์จากทุกบูธ</p><div className="mt-9 flex flex-col gap-3 sm:flex-row"><Link className="primary" href="/register">เริ่มลงทะเบียน <span className="ml-2">→</span></Link><Link className="secondary" href="/dev">เปิดหน้าสำหรับเจ้าหน้าที่</Link></div></section>
    <section className="card relative overflow-hidden"><div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-red-100"/><p className="eyebrow relative">HOW IT WORKS</p><ol className="relative mt-7 space-y-6">{[["01","ลงทะเบียน","กรอกชื่อและรหัสนักศึกษาเพื่อรับ QR ส่วนตัว"],["02","เที่ยวชมบูธ","แสดง QR ให้เจ้าหน้าที่ประจำบูธสแกน"],["03","รับรางวัล","เมื่อครบทุกบูธ นำ QR ไปตรวจที่จุดรับรางวัล"]].map(([no,title,detail])=><li className="flex gap-4" key={no}><span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-slate-900 font-bold text-white">{no}</span><div><h2 className="text-lg font-black">{title}</h2><p className="mt-1 leading-6 text-slate-600">{detail}</p></div></li>)}</ol></section>
  </div>;
}

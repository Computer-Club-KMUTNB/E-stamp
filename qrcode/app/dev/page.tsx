"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { getAllClubs } from "@/lib/dataClient";
import { adminLogout, getAdminCredentials } from "@/lib/adminSession";
import { locationNames } from "@/lib/mockData";
import { supabase } from "@/lib/supabase";
import type { Club, Zone } from "@/lib/types";

const zones: Zone[] = ["front", "back"];

export default function DevPage() {
  const [clubs, setClubs] = useState<Club[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    const creds = getAdminCredentials();
    if (!creds || !creds.email || !creds.pass) {
      adminLogout();
      window.location.replace("/admin-login?next=/dev");
      return;
    }

    supabase.rpc("login_admin", { p_email: creds.email, p_password: creds.pass })
      .single<boolean>()
      .then(({ data, error }) => {
        if (error || !data) {
          adminLogout();
          window.location.replace("/admin-login?next=/dev");
          return;
        }
        setAuthed(true);
        getAllClubs().then(setClubs).catch((caught) => {
          setError(caught instanceof Error ? caught.message : "โหลดรายการบูธไม่สำเร็จ");
        }).finally(() => setLoading(false));
      });
  }, []);

  const normalizedQuery = query.trim().toLowerCase();
  const filteredClubs = useMemo(() => {
    if (!normalizedQuery) return clubs;
    return clubs.filter((club) => {
      const name = (club.name || "").toLowerCase();
      const boothNumber = (club.boothNumber || "").toLowerCase();
      return name.includes(normalizedQuery) || boothNumber.includes(normalizedQuery);
    });
  }, [clubs, normalizedQuery]);

  if (!authed) return <div className="py-8 sm:py-12" aria-busy="true">
    <div className="h-4 w-32 animate-pulse rounded-full bg-white/70" />
    <div className="mt-4 h-10 w-3/4 max-w-md animate-pulse rounded-2xl bg-white/70" />
    <div className="mt-3 h-4 w-full max-w-2xl animate-pulse rounded-full bg-white/70" />
    <p className="mt-8 text-slate-500">กำลังตรวจสอบสิทธิ์…</p>
    <div className="mt-4 grid gap-4 sm:grid-cols-2">{[1, 2, 3, 4].map((n) => <div key={n} className="h-20 animate-pulse rounded-2xl bg-white/70" />)}</div>
  </div>;

  return <div className="py-8 sm:py-12">
    <header className="border-b pb-8" style={{borderColor:"var(--line)"}}>
      <div className="flex items-center justify-between gap-4">
        <p className="eyebrow">STAFF CONSOLE</p>
        <button onClick={() => { adminLogout(); window.location.replace("/admin-login"); }} className="secondary !min-h-10 !px-4 !text-sm">ออกจากระบบ</button>
      </div>
      <h1 className="mt-2 text-4xl font-black tracking-tight sm:text-5xl">เลือกจุดปฏิบัติงาน</h1>
      <p className="mt-3 max-w-2xl leading-7 text-slate-600">เลือกบูธเพื่อเปิดกล้องสแกน หรือเปิดตรวจรับรางวัล ข้อมูลทุกครั้งจะส่งไปยัง Dashboard อัตโนมัติ</p>
      {!loading && clubs.length > 0 && (
        <div className="mt-6 max-w-xl">
          <label className="block font-bold" htmlFor="booth-search">ค้นหาบูธ</label>
          <input
            id="booth-search"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="field"
            placeholder="พิมพ์ชื่อบูธหรือเลขบูธ เช่น A01"
            autoComplete="off"
            enterKeyHint="search"
          />
          {normalizedQuery && (
            <p className="mt-2 text-sm text-slate-500">พบ {filteredClubs.length} บูธจากทั้งหมด {clubs.length} บูธ</p>
          )}
        </div>
      )}
    </header>
    {error && <div role="alert" className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 font-bold text-red-800">{error}</div>}
    {loading ? (
      <div className="grid gap-4 py-10 sm:grid-cols-2">{[1,2,3,4].map((n) => <div key={n} className="h-28 animate-pulse rounded-3xl bg-white/70" />)}</div>
    ) : clubs.length === 0 ? (
      <section className="card mt-8 text-center">
        <div className="text-5xl">⌁</div>
        <h2 className="mt-4 text-2xl font-black">ยังไม่มีข้อมูลบูธ</h2>
        <p className="mt-2 text-slate-600">เพิ่มข้อมูลในตาราง booths ของ Supabase แล้วรีเฟรชหน้านี้</p>
      </section>
    ) : filteredClubs.length === 0 ? (
      <section className="card mt-8 text-center">
        <h2 className="text-2xl font-black">ไม่พบบูธที่ตรงกับคำค้นหา</h2>
        <p className="mt-2 text-slate-600">ลองเปลี่ยนชื่อหรือเลขบูธ แล้วค้นหาอีกครั้ง</p>
        <button type="button" className="secondary mt-5 !min-h-12 !px-4 !text-base" onClick={() => setQuery("")}>ล้างคำค้นหา</button>
      </section>
    ) : (
      zones.map((zone) => {
        const zoneClubs = filteredClubs.filter((club) => club.location === zone);
        if (zoneClubs.length === 0) return null;
        return (
          <section className="min-w-0 mt-10" key={zone}>
            <div className="mb-4 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="eyebrow">{zone === "front" ? "ZONE 1" : "ZONE 2"}</p>
                <h2 className="mt-1 break-words text-2xl font-black">{locationNames[zone]}</h2>
              </div>
              <span className="shrink-0 rounded-full border bg-white px-3 py-1 text-sm font-bold text-slate-600" style={{borderColor:"var(--line)"}}>{zoneClubs.length} บูธ</span>
            </div>
            <div className="grid min-w-0 gap-3 md:grid-cols-2">
              {zoneClubs.map((club) => (
                <Link
                  href={`/club/${encodeURIComponent(club.id)}`}
                  className="group flex min-w-0 max-w-full items-center gap-3 overflow-hidden rounded-2xl border bg-white/80 p-4 no-underline transition hover:-translate-y-0.5 hover:shadow-lg sm:gap-4"
                  style={{borderColor:"var(--line)"}}
                  key={club.id}
                >
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-red-50 font-black text-red-800">{club.boothNumber}</span>
                  <span className="min-w-0 flex-1 overflow-hidden">
                    <b className="block overflow-hidden text-ellipsis whitespace-nowrap text-base text-slate-950 sm:text-lg" title={club.name}>{club.name}</b>
                    <small className="block overflow-hidden text-ellipsis whitespace-nowrap text-slate-500">เลขบูธ {club.boothNumber}</small>
                  </span>
                  <span className="shrink-0 text-xl text-slate-400 transition group-hover:translate-x-1 group-hover:text-red-800">→</span>
                </Link>
              ))}
            </div>
          </section>
        );
      })
    )}
    <section className="mt-12 rounded-3xl bg-slate-950 p-6 text-white sm:p-8">
      <p className="eyebrow !text-red-300">REWARD DESK</p>
      <div className="mt-2 flex flex-col justify-between gap-5 md:flex-row md:items-center">
        <div>
          <h2 className="text-2xl font-black">ตรวจรับรางวัล</h2>
          <p className="mt-1 text-slate-400">ตรวจแสตมป์อย่างน้อยสถานที่ละ 5 ชมรม รวม 10 ชมรม</p>
        </div>
        <Link className="inline-flex min-h-12 items-center justify-center rounded-xl bg-white px-5 font-bold text-slate-950 no-underline hover:bg-red-100" href="/reward/reward">เปิดจุดสแกนรับรางวัล →</Link>
      </div>
    </section>
  </div>;
}

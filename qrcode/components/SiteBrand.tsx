"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function SiteBrand() {
  const pathname = usePathname();
  const isStaffPage = pathname === "/staff-login" || pathname === "/dev" || pathname.startsWith("/club/") || pathname.startsWith("/reward/");

  return <Link href={isStaffPage ? "/dev" : "/"} className="site-brand"><span className="site-brand-mark"><img src="/site-logo.png" alt="" /></span><span className="site-brand-copy"><span>OPENWORLD KMUTNB</span><small>{isStaffPage ? "FOR STAFF" : "FOR PARTICIPANTS"}</small></span></Link>;
}

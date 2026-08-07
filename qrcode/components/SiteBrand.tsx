"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function SiteBrand() {
  const pathname = usePathname();
  const isStaffPage = pathname === "/staff-login" || pathname === "/dev" || pathname.startsWith("/club/") || pathname.startsWith("/reward/");
  const isDashboardPage = pathname === "/dashboard";
  const isAdminPage = isDashboardPage || pathname === "/admin-login";
  const isBrandDisabled = pathname === "/staff-login"
    || pathname.startsWith("/scan/")
    || pathname === "/admin-login"
    || isDashboardPage;
  const brandContent = <><span className="site-brand-mark"><img src="/site-logo.png" alt="" /></span><span className="site-brand-copy"><span>OPENWORLD KMUTNB</span><small>{isAdminPage ? "FOR ADMIN" : isStaffPage ? "FOR STAFF" : "FOR PARTICIPANTS"}</small></span></>;

  if (isBrandDisabled) return <div className="site-brand">{brandContent}</div>;

  return <Link href={isStaffPage ? "/dev" : "/"} className="site-brand">{brandContent}</Link>;
}

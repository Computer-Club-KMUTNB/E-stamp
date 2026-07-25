"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export const PARTICIPANT_SESSION_KEY = "participant_session";
const PARTICIPANT_SESSION_EVENT = "participant-session-change";

export function notifyParticipantSessionChange() {
  window.dispatchEvent(new Event(PARTICIPANT_SESSION_EVENT));
}

function hasParticipantSession() {
  try {
    const raw = window.sessionStorage.getItem(PARTICIPANT_SESSION_KEY);
    if (!raw) return false;
    const parsed = JSON.parse(raw) as { student?: { id?: string; qrToken?: string } };
    return Boolean(parsed.student?.id && parsed.student.qrToken);
  } catch {
    return false;
  }
}

export function AuthNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [staffSignedIn, setStaffSignedIn] = useState(false);
  const [participantSignedIn, setParticipantSignedIn] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setStaffSignedIn(Boolean(data.session)));
    const { data } = supabase.auth.onAuthStateChange((_event, session) => setStaffSignedIn(Boolean(session)));
    return () => data.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const sync = () => setParticipantSignedIn(hasParticipantSession());
    sync();
    window.addEventListener(PARTICIPANT_SESSION_EVENT, sync);
    return () => window.removeEventListener(PARTICIPANT_SESSION_EVENT, sync);
  }, [pathname]);

  if (staffSignedIn && pathname !== "/register" && pathname !== "/login") {
    return (
      <button
        className="site-nav-link staff"
        onClick={async () => {
          await supabase.auth.signOut();
          router.replace("/staff-login");
          router.refresh();
        }}
      >
        ออกจากระบบ
      </button>
    );
  }

  if (participantSignedIn && pathname === "/login") {
    return (
      <button
        className="site-nav-link staff"
        onClick={() => {
          window.sessionStorage.removeItem(PARTICIPANT_SESSION_KEY);
          notifyParticipantSessionChange();
          window.location.replace("/login");
        }}
      >
        ออกจากระบบ
      </button>
    );
  }

  return null;
}

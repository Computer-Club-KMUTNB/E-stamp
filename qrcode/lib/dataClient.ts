"use client";

import { supabase } from "./supabase";
import type { Club, Location, RewardBooth, RewardClaim, Stamp, Student, Zone } from "./types";

type UserInfoRow = {
  hashed_user_id: string;
  student_id: string | null;
  title: string | null;
  name: string;
  faculty: string;
  created_at: string;
};

type UserStampsRow = {
  hashed_user_id: string;
  front_booths_visited: string[];
  back_booths_visited: string[];
  is_collect_reward: boolean;
  updated_at: string;
};

export type ParticipantLoginAttempt = {
  result: { student: Student; visitedClubIds: string[] } | null;
  challengeRequired: boolean;
  message?: string;
};

const boothNumberCollator = new Intl.Collator("th", {
  numeric: true,
  sensitivity: "base",
});

function sortClubsByBoothNumber(clubs: Club[]): Club[] {
  return clubs.sort(
    (left, right) =>
      boothNumberCollator.compare(left.boothNumber, right.boothNumber) ||
      left.name.localeCompare(right.name, "th"),
  );
}

function fail(message: string, error: { message: string } | null): never {
  throw new Error(error ? `${message}: ${error.message}` : message);
}

async function notifyParticipantProgressChanged(hashedUserId: string): Promise<void> {
  const channel = supabase.channel(`participant:${hashedUserId}`, {
    config: { private: false, broadcast: { ack: true, self: false } },
  });

  await new Promise<void>((resolve) => {
    let finished = false;
    const finish = () => {
      if (finished) return;
      finished = true;
      window.clearTimeout(timeout);
      void supabase.removeChannel(channel);
      resolve();
    };
    const timeout = window.setTimeout(finish, 5_000);

    channel.subscribe((status) => {
      if (status === "SUBSCRIBED") {
        void channel
          .send({
            type: "broadcast",
            event: "progress_changed",
            payload: { updatedAt: new Date().toISOString() },
          })
          .finally(finish);
      } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT" || status === "CLOSED") {
        finish();
      }
    });
  });
}

function toStudent(row: UserInfoRow): Student {
  return {
    id: row.hashed_user_id,
    studentCode: row.student_id ?? "",
    title: row.title ?? "",
    name: row.name,
    faculty: row.faculty,
    qrToken: row.hashed_user_id,
    createdAt: row.created_at,
  };
}

async function hashStudentCode(studentCode: string): Promise<string> {
  const bytes = new TextEncoder().encode(studentCode.trim());
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function getStudentByToken(qrToken: string): Promise<Student | null> {
  if (!/^[a-f0-9]{64}$/i.test(qrToken)) return null;
  const { data, error } = await supabase.rpc("get_student_by_token", { p_token: qrToken.toLowerCase() }).maybeSingle<{ hashed_user_id: string; student_id: string; title: string; name: string; faculty: string; created_at: string }>();
  if (error) fail("ค้นหาผู้เข้าร่วมไม่สำเร็จ", error);
  if (!data) return null;
  return {
    id: data.hashed_user_id,
    studentCode: data.student_id,
    title: data.title,
    name: data.name,
    faculty: data.faculty,
    qrToken: data.hashed_user_id,
    createdAt: data.created_at,
  };
}

export async function createStudent(studentCode: string, title: string, name: string, faculty: string): Promise<Student> {
  const hashedUserId = await hashStudentCode(studentCode);
  const createdAt = new Date().toISOString();
  const { error } = await supabase.rpc("register_attendee", {
    p_hashed_user_id: hashedUserId,
    p_student_id: studentCode,
    p_title: title,
    p_name: name.trim(),
    p_faculty: faculty,
  });
  if (error) {
    if (/attendee already exists|duplicate|มีผู้ใช้นี้อยู่แล้ว/i.test(error.message)) {
      throw new Error("มีผู้ใช้นี้อยู่แล้ว กรุณาเข้าสู่ระบบ");
    }
    fail("ลงทะเบียนผู้เข้าร่วมไม่สำเร็จ", error);
  }
  return { id: hashedUserId, studentCode, title, name: name.trim(), faculty, qrToken: hashedUserId, createdAt };
}

export async function loginStudent(studentCode: string, name: string, token = ""): Promise<ParticipantLoginAttempt> {
  const response = await fetch("/api/login/participant", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ studentCode, name: name.trim(), token }),
  });
  const body = await response.json().catch(() => null) as {
    success?: boolean;
    challengeRequired?: boolean;
    message?: string;
    result?: { student: Student; visitedClubIds: string[] };
  } | null;

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      return {
        result: null,
        challengeRequired: Boolean(body?.challengeRequired),
        message: body?.message,
      };
    }
    throw new Error(body?.message ?? "เข้าสู่ระบบไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
  }
  if (!body?.success || !body.result) throw new Error("รูปแบบข้อมูลเข้าสู่ระบบไม่ถูกต้อง");
  return { result: body.result, challengeRequired: false };
}

export async function getClubByToken(token: string): Promise<Club | null> {
  const { data, error } = await supabase
    .from("booths")
    .select("id, booth_number, name, zone")
    .eq("id", token)
    .maybeSingle<{ id: string; booth_number: string; name: string; zone: Zone }>();
  if (error) fail("โหลดข้อมูลบูธไม่สำเร็จ", error);
  return data ? { id: data.id, boothNumber: data.booth_number, name: data.name, location: data.zone, token: data.id } : null;
}

export async function getClubsByLocation(location: Location): Promise<Club[]> {
  const { data, error } = await supabase
    .from("booths")
    .select("id, booth_number, name, zone")
    .eq("zone", location)
    .order("booth_number");
  if (error) fail("โหลดรายการบูธไม่สำเร็จ", error);
  return sortClubsByBoothNumber((data ?? []).map((row) => ({
    id: row.id,
    boothNumber: row.booth_number,
    name: row.name,
    location: row.zone as Zone,
    token: row.id,
  })));
}

export async function getAllClubs(): Promise<Club[]> {
  const { data, error } = await supabase.from("booths").select("id, booth_number, name, zone").order("zone").order("booth_number");
  if (error) fail("โหลดรายการบูธไม่สำเร็จ", error);
  return sortClubsByBoothNumber((data ?? []).map((row) => ({
    id: row.id,
    boothNumber: row.booth_number,
    name: row.name,
    location: row.zone as Zone,
    token: row.id,
  })));
}



export async function recordStamp(studentId: string, clubId: string): Promise<{ stamp: Stamp; created: boolean }> {
  const { data, error } = await supabase.rpc("record_stamp", { p_token: studentId, p_booth_id: clubId }).single<any>();
  if (error) fail("บันทึกแสตมป์ไม่สำเร็จ", error);
  if (data.created) {
    void notifyParticipantProgressChanged(studentId).catch((caught) => {
      console.error("Participant progress notification failed:", caught);
    });
  }
  
  return {
    stamp: { id: `${studentId}:${clubId}`, studentId, clubId, scannedAt: data.scanned_at },
    created: data.created,
  };
}

export async function getStampsForStudent(studentId: string): Promise<Stamp[]> {
  const { data: row, error } = await supabase.rpc("get_stamps_for_student", { p_token: studentId }).maybeSingle<{ front_booths_visited: string[]; back_booths_visited: string[]; updated_at: string }>();
  if (error) fail("โหลดแสตมป์ไม่สำเร็จ", error);
  if (!row) return [];
  return [...row.front_booths_visited, ...row.back_booths_visited].map((clubId) => ({
    id: `${studentId}:${clubId}`,
    studentId,
    clubId,
    scannedAt: row.updated_at,
  }));
}

export async function getRewardBoothByToken(token: string): Promise<RewardBooth | null> {
  return token === "reward" ? { id: "reward", token: "reward" } : null;
}

export async function getRewardClaim(studentId: string): Promise<RewardClaim | null> {
  const { data: row, error } = await supabase.rpc("get_stamps_for_student", { p_token: studentId }).maybeSingle<{ is_collect_reward: boolean; updated_at: string }>();
  if (error) fail("ตรวจสอบรางวัลไม่สำเร็จ", error);
  if (!row) return null;
  return row.is_collect_reward
    ? { id: `reward:${studentId}`, studentId, claimedAt: row.updated_at }
    : null;
}

export async function createRewardClaim(studentId: string): Promise<{ claim: RewardClaim; created: boolean }> {
  const claimedAt = new Date().toISOString();
  const { data: result, error } = await supabase
    .rpc("redeem_reward", { p_hashed_user_id: studentId })
    .single<string>();
  if (error) fail("บันทึกการรับรางวัลไม่สำเร็จ", error);
  if (result === "already_claimed") {
    return { claim: { id: `reward:${studentId}`, studentId, claimedAt }, created: false };
  }
  if (result === "not_eligible") {
    throw new Error("ยังสะสมแสตมป์ไม่ครบเงื่อนไข (ต้องการอย่างน้อย 5 บูธหน้า + 5 บูธหลัง)");
  }
  void notifyParticipantProgressChanged(studentId).catch((caught) => {
    console.error("Participant progress notification failed:", caught);
  });
  return {
    claim: { id: `reward:${studentId}`, studentId, claimedAt },
    created: true,
  };
}

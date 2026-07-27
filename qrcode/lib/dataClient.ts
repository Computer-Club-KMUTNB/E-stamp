"use client";

import { supabase } from "./supabase";
import type { Club, Location, RewardBooth, RewardClaim, Stamp, Student, Zone } from "./types";

type UserInfoRow = {
  hashed_user_id: string;
  student_id: string | null;
  name: string;
  created_at: string;
};

type UserStampsRow = {
  hashed_user_id: string;
  front_booths_visited: string[];
  back_booths_visited: string[];
  is_collect_reward: boolean;
  updated_at: string;
};

type ParticipantLoginRow = {
  hashed_user_id: string;
  student_id: string;
  name: string;
  created_at: string;
  front_booths_visited: string[];
  back_booths_visited: string[];
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

function toStudent(row: UserInfoRow): Student {
  return {
    id: row.hashed_user_id,
    studentCode: row.student_id ?? "",
    name: row.name,
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
  const { data, error } = await supabase
    .from("user_info")
    .select("hashed_user_id, student_id, name, created_at")
    .eq("hashed_user_id", qrToken.toLowerCase())
    .maybeSingle<UserInfoRow>();
  if (error) fail("ค้นหาผู้เข้าร่วมไม่สำเร็จ", error);
  return data ? toStudent(data) : null;
}

export async function createStudent(studentCode: string, name: string): Promise<Student> {
  const hashedUserId = await hashStudentCode(studentCode);
  const createdAt = new Date().toISOString();
  const { error } = await supabase.rpc("register_attendee", {
    p_hashed_user_id: hashedUserId,
    p_student_id: studentCode,
    p_name: name.trim(),
  });
  if (error) {
    if (/attendee already exists|duplicate|มีผู้ใช้นี้อยู่แล้ว/i.test(error.message)) {
      throw new Error("มีผู้ใช้นี้อยู่แล้ว กรุณาเข้าสู่ระบบ");
    }
    fail("ลงทะเบียนผู้เข้าร่วมไม่สำเร็จ", error);
  }
  return { id: hashedUserId, studentCode, name: name.trim(), qrToken: hashedUserId, createdAt };
}

export async function loginStudent(studentCode: string, name: string): Promise<{ student: Student; visitedClubIds: string[] } | null> {
  const hashedUserId = await hashStudentCode(studentCode);
  const { data, error } = await supabase.rpc("login_attendee", {
    p_hashed_user_id: hashedUserId,
    p_name: name.trim(),
  }).maybeSingle<ParticipantLoginRow>();
  if (error) fail("เข้าสู่ระบบไม่สำเร็จ", error);
  if (!data) return null;
  return {
    student: {
      id: data.hashed_user_id,
      studentCode: data.student_id,
      name: data.name,
      qrToken: data.hashed_user_id,
      createdAt: data.created_at,
    },
    visitedClubIds: [...data.front_booths_visited, ...data.back_booths_visited],
  };
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

async function getStampRow(studentId: string): Promise<UserStampsRow | null> {
  const { data, error } = await supabase
    .from("user_stamps")
    .select("hashed_user_id, front_booths_visited, back_booths_visited, is_collect_reward, updated_at")
    .eq("hashed_user_id", studentId)
    .maybeSingle<UserStampsRow>();
  if (error) fail("โหลดแสตมป์ไม่สำเร็จ", error);
  return data;
}

export async function recordStamp(studentId: string, clubId: string): Promise<{ stamp: Stamp; created: boolean }> {
  const club = await getClubByToken(clubId);
  if (!club) fail("ไม่พบบูธ", null);
  const row = await getStampRow(studentId);
  if (!row) fail("ไม่พบสมุดสะสมแสตมป์", null);

  const column = club.location === "front" ? "front_booths_visited" : "back_booths_visited";
  const visited = row[column];
  const stamp: Stamp = { id: `${studentId}:${clubId}`, studentId, clubId, scannedAt: row.updated_at };
  if (visited.includes(clubId)) return { stamp, created: false };

  const scannedAt = new Date().toISOString();
  const { error } = await supabase
    .from("user_stamps")
    .update({ [column]: [...visited, clubId], updated_at: scannedAt })
    .eq("hashed_user_id", studentId);
  if (error) fail("บันทึกแสตมป์ไม่สำเร็จ", error);

  const { error: logError } = await supabase.from("activity_log").insert({
    hashed_user_id: studentId,
    action_type: "check_in",
    booth_id: clubId,
  });
  if (logError) fail("บันทึกกิจกรรมไม่สำเร็จ", logError);
  return { stamp: { ...stamp, scannedAt }, created: true };
}

export async function getStampsForStudent(studentId: string): Promise<Stamp[]> {
  const row = await getStampRow(studentId);
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
  const row = await getStampRow(studentId);
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
  return {
    claim: { id: `reward:${studentId}`, studentId, claimedAt },
    created: true,
  };
}

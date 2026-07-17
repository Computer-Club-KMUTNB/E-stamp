"use client";

import { clubs, rewardBooths } from "./mockData";
import type { Club, Location, RewardBooth, RewardClaim, Stamp, Student } from "./types";

const KEYS = { students: "estamp.students", stamps: "estamp.stamps", claims: "estamp.claims" } as const;

function read<T>(key: string): T[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(key) ?? "[]") as T[]; } catch { return []; }
}
function write<T>(key: string, value: T[]) { localStorage.setItem(key, JSON.stringify(value)); }
function id(prefix: string) { return `${prefix}-${Date.now()}-${crypto.randomUUID?.() ?? Math.random().toString(36).slice(2)}`; }

export async function getStudentByToken(qrToken: string): Promise<Student | null> {
  return read<Student>(KEYS.students).find((item) => item.qrToken === qrToken) ?? null;
}
export async function createStudent(studentCode: string): Promise<Student> {
  const students = read<Student>(KEYS.students);
  const existing = students.find((item) => item.studentCode === studentCode);
  if (existing) return existing;
  const student: Student = { id: id("student"), studentCode, qrToken: id("attendee"), createdAt: new Date().toISOString() };
  write(KEYS.students, [...students, student]);
  return student;
}
export async function getClubByToken(token: string): Promise<Club | null> { return clubs.find((club) => club.token === token) ?? null; }
export async function getClubsByLocation(location: Location): Promise<Club[]> { return clubs.filter((club) => club.location === location); }
export async function recordStamp(studentId: string, clubId: string): Promise<{ stamp: Stamp; created: boolean }> {
  const stamps = read<Stamp>(KEYS.stamps);
  const existing = stamps.find((item) => item.studentId === studentId && item.clubId === clubId);
  if (existing) return { stamp: existing, created: false };
  const stamp: Stamp = { id: id("stamp"), studentId, clubId, scannedAt: new Date().toISOString() };
  write(KEYS.stamps, [...stamps, stamp]);
  return { stamp, created: true };
}
export async function getStampsForStudent(studentId: string): Promise<Stamp[]> { return read<Stamp>(KEYS.stamps).filter((item) => item.studentId === studentId); }
export async function getRewardBoothByToken(token: string): Promise<RewardBooth | null> { return rewardBooths.find((booth) => booth.token === token) ?? null; }
export async function getRewardClaim(studentId: string, location: Location): Promise<RewardClaim | null> {
  return read<RewardClaim>(KEYS.claims).find((item) => item.studentId === studentId && item.location === location) ?? null;
}
export async function createRewardClaim(studentId: string, location: Location): Promise<{ claim: RewardClaim; created: boolean }> {
  const claims = read<RewardClaim>(KEYS.claims);
  const existing = claims.find((item) => item.studentId === studentId && item.location === location);
  if (existing) return { claim: existing, created: false };
  const claim: RewardClaim = { id: id("claim"), studentId, location, claimedAt: new Date().toISOString() };
  write(KEYS.claims, [...claims, claim]);
  return { claim, created: true };
}
export async function clearLocalData(): Promise<void> { Object.values(KEYS).forEach((key) => localStorage.removeItem(key)); }

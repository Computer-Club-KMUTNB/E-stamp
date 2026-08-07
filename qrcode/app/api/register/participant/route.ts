import { createHash } from "node:crypto";
import { PARTICIPANT_FACULTIES, PARTICIPANT_TITLES } from "@/lib/participantRegistration";
import { createClientKey, reserveAttempt } from "@/lib/server/loginProtection";
import { getSupabaseAdmin } from "@/lib/server/supabaseAdmin";
import { verifyTurnstileToken } from "@/lib/server/turnstile";

const MINIMUM_ACCEPTED_RESPONSE_MS = 750;
const responseHeaders = { "Cache-Control": "no-store" };
const acceptedBody = {
  accepted: true,
  message: "รับข้อมูลแล้ว กรุณาเข้าสู่ระบบด้วยชื่อและรหัสนักศึกษา",
};

async function acceptedResponse(startedAt: number): Promise<Response> {
  const remainingDelay = MINIMUM_ACCEPTED_RESPONSE_MS - (Date.now() - startedAt);
  if (remainingDelay > 0) {
    await new Promise((resolve) => setTimeout(resolve, remainingDelay));
  }
  return Response.json(acceptedBody, { status: 202, headers: responseHeaders });
}

function isExistingParticipantError(error: { code?: string; message: string }): boolean {
  return error.code === "23505" || /attendee already exists|duplicate/i.test(error.message);
}

export async function POST(request: Request) {
  let body: { studentCode?: unknown; title?: unknown; name?: unknown; faculty?: unknown; token?: unknown };
  try {
    body = await request.json();
  } catch {
    return Response.json({ accepted: false, message: "ข้อมูลลงทะเบียนไม่ถูกต้อง" }, { status: 400, headers: responseHeaders });
  }

  const studentCode = typeof body.studentCode === "string" ? body.studentCode.trim() : "";
  const title = typeof body.title === "string" ? body.title : "";
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const faculty = typeof body.faculty === "string" ? body.faculty : "";
  const token = typeof body.token === "string" ? body.token : "";
  if (
    !/^\d{13}$/.test(studentCode)
    || !(PARTICIPANT_TITLES as readonly string[]).includes(title)
    || name.length < 2
    || name.length > 120
    || !(PARTICIPANT_FACULTIES as readonly string[]).includes(faculty)
    || token.length > 2048
  ) {
    return Response.json({ accepted: false, message: "ข้อมูลลงทะเบียนไม่ถูกต้อง" }, { status: 400, headers: responseHeaders });
  }

  try {
    const challengeVerified = await verifyTurnstileToken(request, token, "participant_register");
    if (!challengeVerified) {
      return Response.json({ accepted: false, message: "การยืนยันความปลอดภัยไม่ผ่าน กรุณาลองใหม่" }, { status: 403, headers: responseHeaders });
    }

    const hashedUserId = createHash("sha256").update(studentCode).digest("hex");
    const clientKey = createClientKey(request, "participant_register", hashedUserId);
    const reservation = await reserveAttempt(clientKey);
    if (!reservation.allowed) {
      return Response.json({ accepted: false, message: "ดำเนินการหลายครั้งเกินไป กรุณารอ 15 นาทีแล้วลองใหม่" }, { status: 429, headers: responseHeaders });
    }

    const registrationStartedAt = Date.now();
    const { error } = await getSupabaseAdmin().rpc("register_attendee", {
      p_hashed_user_id: hashedUserId,
      p_student_id: studentCode,
      p_title: title,
      p_name: name,
      p_faculty: faculty,
    });

    if (error && !isExistingParticipantError(error)) {
      throw new Error(`Participant registration RPC failed: ${error.message}`);
    }

    return acceptedResponse(registrationStartedAt);
  } catch (caught) {
    console.error("Participant registration failed:", caught);
    return Response.json({ accepted: false, message: "ลงทะเบียนไม่สำเร็จ กรุณาลองใหม่อีกครั้ง" }, { status: 503, headers: responseHeaders });
  }
}

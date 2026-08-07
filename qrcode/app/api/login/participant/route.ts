import { createHash } from "node:crypto";
import { clearLoginAttempts, protectLogin } from "@/lib/server/loginProtection";
import { getSupabaseAdmin } from "@/lib/server/supabaseAdmin";

type ParticipantLoginRow = {
  hashed_user_id: string;
  student_id: string;
  title: string | null;
  name: string;
  faculty: string | null;
  created_at: string;
  front_booths_visited: string[] | null;
  back_booths_visited: string[] | null;
};

const responseHeaders = { "Cache-Control": "no-store" };

export async function POST(request: Request) {
  let body: { studentCode?: unknown; name?: unknown; token?: unknown };
  try {
    body = await request.json();
  } catch {
    return Response.json({ success: false, message: "ข้อมูลเข้าสู่ระบบไม่ถูกต้อง" }, { status: 400, headers: responseHeaders });
  }

  const studentCode = typeof body.studentCode === "string" ? body.studentCode.trim() : "";
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const token = typeof body.token === "string" ? body.token : "";
  if (!/^\d{13}$/.test(studentCode) || name.length < 2 || name.length > 120 || token.length > 2048) {
    return Response.json({ success: false, message: "ข้อมูลเข้าสู่ระบบไม่ถูกต้อง" }, { status: 400, headers: responseHeaders });
  }

  try {
    const protection = await protectLogin(request, "participant_login", token);
    if (!protection.allowed) {
      return Response.json({
        success: false,
        challengeRequired: true,
        message: protection.challengeFailed
          ? "การยืนยันความปลอดภัยไม่ผ่าน กรุณาลองใหม่"
          : "กรุณายืนยันความปลอดภัยก่อนลองใหม่",
      }, { status: 403, headers: responseHeaders });
    }

    const hashedUserId = createHash("sha256").update(studentCode).digest("hex");
    const { data, error } = await getSupabaseAdmin()
      .rpc("login_attendee", {
        p_hashed_user_id: hashedUserId,
        p_name: name,
      })
      .maybeSingle<ParticipantLoginRow>();

    if (error) throw new Error(`Participant login RPC failed: ${error.message}`);
    if (!data) {
      return Response.json({
        success: false,
        challengeRequired: protection.challengeRequired,
        message: "ไม่พบผู้ใช้นี้ กรุณาตรวจสอบชื่อและรหัสนักศึกษา",
      }, { status: 401, headers: responseHeaders });
    }

    await clearLoginAttempts(protection.clientKey);
    return Response.json({
      success: true,
      challengeRequired: false,
      result: {
        student: {
          id: data.hashed_user_id,
          studentCode: data.student_id,
          title: data.title ?? "",
          name: data.name,
          faculty: data.faculty ?? "",
          qrToken: data.hashed_user_id,
          createdAt: data.created_at,
        },
        visitedClubIds: [
          ...(data.front_booths_visited ?? []),
          ...(data.back_booths_visited ?? []),
        ],
      },
    }, { headers: responseHeaders });
  } catch (caught) {
    console.error("Participant login failed:", caught);
    return Response.json({ success: false, message: "เข้าสู่ระบบไม่สำเร็จ กรุณาลองใหม่อีกครั้ง" }, { status: 503, headers: responseHeaders });
  }
}

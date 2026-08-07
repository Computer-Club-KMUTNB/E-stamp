import { clearLoginAttempts, protectLogin } from "@/lib/server/loginProtection";
import { getSupabaseAdmin } from "@/lib/server/supabaseAdmin";

const responseHeaders = { "Cache-Control": "no-store" };

export async function POST(request: Request) {
  let body: { pin?: unknown; token?: unknown };
  try {
    body = await request.json();
  } catch {
    return Response.json({ success: false, message: "ข้อมูลเข้าสู่ระบบไม่ถูกต้อง" }, { status: 400, headers: responseHeaders });
  }

  const pin = typeof body.pin === "string" ? body.pin : "";
  const token = typeof body.token === "string" ? body.token : "";
  if (!/^\d{6}$/.test(pin) || token.length > 2048) {
    return Response.json({ success: false, message: "ข้อมูลเข้าสู่ระบบไม่ถูกต้อง" }, { status: 400, headers: responseHeaders });
  }

  try {
    const protection = await protectLogin(request, "staff_login", token);
    if (!protection.allowed) {
      return Response.json({
        success: false,
        challengeRequired: true,
        message: protection.challengeFailed
          ? "การยืนยันความปลอดภัยไม่ผ่าน กรุณาลองใหม่"
          : "กรุณายืนยันความปลอดภัยก่อนลองใหม่",
      }, { status: 403, headers: responseHeaders });
    }

    const { data, error } = await getSupabaseAdmin()
      .rpc("lookup_booth_pin", { p_pin: pin })
      .maybeSingle<string>();

    if (error) throw new Error(`Staff login RPC failed: ${error.message}`);
    if (!data) {
      return Response.json({
        success: false,
        challengeRequired: protection.challengeRequired,
        message: "PIN ไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง",
      }, { status: 401, headers: responseHeaders });
    }

    await clearLoginAttempts(protection.clientKey);
    return Response.json({ success: true, challengeRequired: false, boothId: data }, { headers: responseHeaders });
  } catch (caught) {
    console.error("Staff login failed:", caught);
    return Response.json({ success: false, message: "เข้าสู่ระบบไม่สำเร็จ กรุณาลองใหม่อีกครั้ง" }, { status: 503, headers: responseHeaders });
  }
}

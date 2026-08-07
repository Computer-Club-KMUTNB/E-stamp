const SITEVERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";
const DEVELOPMENT_SECRET_KEY = "1x0000000000000000000000000000000AA";
const TEST_SECRET_KEYS = new Set([
  DEVELOPMENT_SECRET_KEY,
  "2x0000000000000000000000000000000AA",
  "3x0000000000000000000000000000000AA",
]);
const ALLOWED_ACTIONS = new Set(["staff_login", "participant_login", "dashboard_login"]);

type SiteverifyResponse = {
  success: boolean;
  action?: string;
  hostname?: string;
};

export async function POST(request: Request) {
  let body: { token?: unknown; action?: unknown };
  try {
    body = await request.json();
  } catch {
    return Response.json({ success: false, message: "ข้อมูล Turnstile ไม่ถูกต้อง" }, { status: 400 });
  }

  const token = typeof body.token === "string" ? body.token : "";
  const action = typeof body.action === "string" ? body.action : "";
  if (!token || token.length > 2048 || !ALLOWED_ACTIONS.has(action)) {
    return Response.json({ success: false, message: "ข้อมูล Turnstile ไม่ครบถ้วน" }, { status: 400 });
  }

  const configuredSecret = process.env.TURNSTILE_SECRET_KEY;
  const secret = configuredSecret
    || (process.env.NODE_ENV === "development" ? DEVELOPMENT_SECRET_KEY : "");
  if (!secret) {
    return Response.json({ success: false, message: "ระบบ Turnstile ยังไม่ได้ตั้งค่า" }, { status: 503 });
  }
  const usingTestSecret = TEST_SECRET_KEYS.has(secret);
  if (usingTestSecret && process.env.NODE_ENV === "production") {
    return Response.json({ success: false, message: "ไม่อนุญาตให้ใช้ Turnstile test key ใน production" }, { status: 503 });
  }

  const remoteIp = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const formData = new URLSearchParams({ secret, response: token });
  if (remoteIp) formData.set("remoteip", remoteIp);

  try {
    const response = await fetch(SITEVERIFY_URL, {
      method: "POST",
      body: formData,
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) throw new Error(`Siteverify returned ${response.status}`);
    const result = await response.json() as SiteverifyResponse;
    const usingDevelopmentKey = usingTestSecret && process.env.NODE_ENV === "development";
    const expectedHostname = new URL(request.url).hostname;
    const actionMatches = usingDevelopmentKey || result.action === action;
    const hostnameMatches = usingDevelopmentKey || !expectedHostname || result.hostname === expectedHostname;

    if (!result.success || !actionMatches || !hostnameMatches) {
      return Response.json({ success: false, message: "การยืนยัน Turnstile ไม่ผ่าน กรุณาลองใหม่" }, { status: 403 });
    }
    return Response.json({ success: true });
  } catch (caught) {
    console.error("Turnstile verification failed:", caught);
    return Response.json({ success: false, message: "ไม่สามารถติดต่อระบบ Turnstile ได้ กรุณาลองใหม่" }, { status: 502 });
  }
}

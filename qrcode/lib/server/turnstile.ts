import "server-only";

const SITEVERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";
const DEVELOPMENT_SECRET_KEY = "1x0000000000000000000000000000000AA";
const TEST_SECRET_KEYS = new Set([
  DEVELOPMENT_SECRET_KEY,
  "2x0000000000000000000000000000000AA",
  "3x0000000000000000000000000000000AA",
]);

type TurnstileAction = "staff_login" | "participant_login" | "participant_register" | "dashboard_login";

type SiteverifyResponse = {
  success: boolean;
  action?: string;
  hostname?: string;
};

export function getRequestIp(request: Request): string {
  const forwardedFor = request.headers.get("x-vercel-forwarded-for")
    || request.headers.get("x-forwarded-for");
  const forwardedIp = forwardedFor?.split(",").at(-1)?.trim();
  return forwardedIp
    || request.headers.get("x-real-ip")?.trim()
    || request.headers.get("cf-connecting-ip")?.trim()
    || "unknown";
}

export async function verifyTurnstileToken(
  request: Request,
  token: string,
  action: TurnstileAction,
): Promise<boolean> {
  if (!token || token.length > 2048) return false;

  const configuredSecret = process.env.TURNSTILE_SECRET_KEY;
  const secret = configuredSecret
    || (process.env.NODE_ENV === "development" ? DEVELOPMENT_SECRET_KEY : "");
  if (!secret) throw new Error("Missing TURNSTILE_SECRET_KEY");

  const usingTestSecret = TEST_SECRET_KEYS.has(secret);
  if (usingTestSecret && process.env.NODE_ENV === "production") {
    throw new Error("Turnstile test keys are not allowed in production");
  }

  const formData = new URLSearchParams({ secret, response: token });
  const remoteIp = getRequestIp(request);
  if (remoteIp !== "unknown") formData.set("remoteip", remoteIp);
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
  const hostnameMatches = usingDevelopmentKey || result.hostname === expectedHostname;
  return result.success && actionMatches && hostnameMatches;
}

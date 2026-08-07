import "server-only";

import { createHmac } from "node:crypto";
import { getSupabaseAdmin, getSupabaseSecretKey } from "./supabaseAdmin";
import { getRequestIp, verifyTurnstileToken } from "./turnstile";

export type ProtectedLoginAction = "staff_login" | "participant_login";

type AttemptReservation = {
  allowed: boolean;
  challengeRequired: boolean;
};

export type LoginProtectionResult = AttemptReservation & {
  clientKey: string;
  challengeFailed?: boolean;
};

function createClientKey(request: Request, action: ProtectedLoginAction): string {
  const secret = process.env.LOGIN_RATE_LIMIT_SECRET || getSupabaseSecretKey();
  const digest = createHmac("sha256", secret).update(getRequestIp(request)).digest("hex");
  return `${action}:${digest}`;
}

async function reserveAttempt(clientKey: string, challengeVerified: boolean): Promise<AttemptReservation> {
  const { data, error } = await getSupabaseAdmin()
    .rpc("reserve_login_attempt", {
      p_client_key: clientKey,
      p_challenge_verified: challengeVerified,
    })
    .single<{ allowed: boolean; challenge_required: boolean }>();

  if (error || !data) {
    throw new Error(`Unable to reserve login attempt: ${error?.message ?? "missing result"}`);
  }
  return { allowed: data.allowed, challengeRequired: data.challenge_required };
}

export async function protectLogin(
  request: Request,
  action: ProtectedLoginAction,
  token: string,
): Promise<LoginProtectionResult> {
  const clientKey = createClientKey(request, action);
  const initialReservation = await reserveAttempt(clientKey, false);
  if (initialReservation.allowed) return { ...initialReservation, clientKey };

  if (!token) {
    return { allowed: false, challengeRequired: true, clientKey };
  }

  const challengeVerified = await verifyTurnstileToken(request, token, action);
  if (!challengeVerified) {
    return { allowed: false, challengeRequired: true, challengeFailed: true, clientKey };
  }

  const verifiedReservation = await reserveAttempt(clientKey, true);
  return { ...verifiedReservation, clientKey };
}

export async function clearLoginAttempts(clientKey: string): Promise<void> {
  const { error } = await getSupabaseAdmin().rpc("clear_login_attempts", {
    p_client_key: clientKey,
  });
  if (error) throw new Error(`Unable to clear login attempts: ${error.message}`);
}

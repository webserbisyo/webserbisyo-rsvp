import { cookies } from "next/headers";
import { createHmac } from "node:crypto";

const RECOVERY_COOKIE_NAME = "rsvp_recovery_intent";
const RECOVERY_MAX_AGE_SECONDS = 15 * 60; // 15 minutes

function getSecretKey() {
  return (
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    "webserbisyo-recovery-secret-key"
  );
}

function signUserId(userId: string): string {
  const secret = getSecretKey();
  const timestamp = Math.floor(Date.now() / 1000);
  const data = `${userId}.${timestamp}`;
  const hmac = createHmac("sha256", secret).update(data).digest("hex");
  return `${data}.${hmac}`;
}

function verifyUserId(token: string, expectedUserId: string): boolean {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return false;

    const [userId, timestampStr, hmac] = parts;
    if (userId !== expectedUserId) return false;

    const timestamp = parseInt(timestampStr, 10);
    if (isNaN(timestamp)) return false;

    const now = Math.floor(Date.now() / 1000);
    if (now - timestamp > RECOVERY_MAX_AGE_SECONDS) return false;

    const secret = getSecretKey();
    const data = `${userId}.${timestampStr}`;
    const expectedHmac = createHmac("sha256", secret).update(data).digest("hex");

    return hmac === expectedHmac;
  } catch {
    return false;
  }
}

export async function setRecoveryIntentMarker(userId: string) {
  const cookieStore = await cookies();
  const signedToken = signUserId(userId);

  cookieStore.set(RECOVERY_COOKIE_NAME, signedToken, {
    httpOnly: true,
    maxAge: RECOVERY_MAX_AGE_SECONDS,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
}

export async function clearRecoveryIntentMarker() {
  const cookieStore = await cookies();
  cookieStore.delete(RECOVERY_COOKIE_NAME);
}

export async function verifyRecoveryIntentMarker(userId: string): Promise<boolean> {
  const cookieStore = await cookies();
  const cookie = cookieStore.get(RECOVERY_COOKIE_NAME);

  if (!cookie?.value) {
    return false;
  }

  return verifyUserId(cookie.value, userId);
}

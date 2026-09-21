import "server-only";

import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "node:crypto";

export const IMPERSONATION_COOKIE_NAME = "ws_impersonate_client";
const IMPERSONATION_MAX_AGE_SECONDS = 3600; // 1 hour session

function getSigningSecret(): string {
  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!secret) {
    throw new Error("Missing signing secret for impersonation token verification.");
  }

  return secret;
}

export function generateImpersonationToken(adminUserId: string, targetClientId: string): string {
  const timestamp = Math.floor(Date.now() / 1000);
  const data = `${adminUserId}.${targetClientId}.${timestamp}`;
  const hmac = createHmac("sha256", getSigningSecret()).update(data).digest("hex");
  return `${data}.${hmac}`;
}

export function verifyImpersonationToken(
  token: string,
  expectedAdminUserId: string,
): { isValid: boolean; targetClientId: string | null } {
  try {
    const parts = token.split(".");

    if (parts.length !== 4) {
      return { isValid: false, targetClientId: null };
    }

    const [adminUserId, targetClientId, timestampStr, hmac] = parts;

    if (adminUserId !== expectedAdminUserId || !targetClientId || !timestampStr || !hmac) {
      return { isValid: false, targetClientId: null };
    }

    const timestamp = parseInt(timestampStr, 10);
    const now = Math.floor(Date.now() / 1000);

    if (isNaN(timestamp) || now - timestamp > IMPERSONATION_MAX_AGE_SECONDS || now < timestamp) {
      return { isValid: false, targetClientId: null };
    }

    const expectedData = `${adminUserId}.${targetClientId}.${timestampStr}`;
    const expectedHmac = createHmac("sha256", getSigningSecret())
      .update(expectedData)
      .digest("hex");

    const hmacBuffer = Buffer.from(hmac, "hex");
    const expectedBuffer = Buffer.from(expectedHmac, "hex");

    if (hmacBuffer.length !== expectedBuffer.length) {
      return { isValid: false, targetClientId: null };
    }

    if (!timingSafeEqual(hmacBuffer, expectedBuffer)) {
      return { isValid: false, targetClientId: null };
    }

    return { isValid: true, targetClientId };
  } catch {
    return { isValid: false, targetClientId: null };
  }
}

export async function getActiveImpersonatedClientId(
  adminUserId: string,
): Promise<string | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(IMPERSONATION_COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  const result = verifyImpersonationToken(token, adminUserId);
  return result.isValid ? result.targetClientId : null;
}

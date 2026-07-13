import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";
import { getSupabaseSecretEnv } from "@/lib/supabase/secret-env";

const PREVIEW_TOKEN_LIFETIME_SECONDS = 10 * 60;

type EventWebsitePreviewClaims = {
  clientId: string;
  eventId: string;
  eventSlug: string;
  expiresAt: number;
  purpose: "event-website-draft-preview";
};

export function issueEventWebsitePreviewToken(input: {
  clientId: string;
  eventId: string;
  eventSlug: string;
}) {
  const claims: EventWebsitePreviewClaims = {
    ...input,
    expiresAt: Math.floor(Date.now() / 1000) + PREVIEW_TOKEN_LIFETIME_SECONDS,
    purpose: "event-website-draft-preview",
  };
  const payload = Buffer.from(JSON.stringify(claims)).toString("base64url");
  return `${payload}.${signPreviewPayload(payload)}`;
}

export function verifyEventWebsitePreviewToken(token: string): EventWebsitePreviewClaims | null {
  const [payload, signature, extra] = token.split(".");

  if (!payload || !signature || extra) {
    return null;
  }

  const expected = Buffer.from(signPreviewPayload(payload));
  const received = Buffer.from(signature);

  if (expected.length !== received.length || !timingSafeEqual(expected, received)) {
    return null;
  }

  try {
    const claims = JSON.parse(
      Buffer.from(payload, "base64url").toString("utf8"),
    ) as Partial<EventWebsitePreviewClaims>;

    if (
      claims.purpose !== "event-website-draft-preview" ||
      typeof claims.clientId !== "string" ||
      typeof claims.eventId !== "string" ||
      typeof claims.eventSlug !== "string" ||
      typeof claims.expiresAt !== "number" ||
      claims.expiresAt <= Math.floor(Date.now() / 1000)
    ) {
      return null;
    }

    return claims as EventWebsitePreviewClaims;
  } catch {
    return null;
  }
}

function signPreviewPayload(payload: string) {
  return createHmac("sha256", getSupabaseSecretEnv().serviceRoleKey)
    .update(payload)
    .digest("base64url");
}

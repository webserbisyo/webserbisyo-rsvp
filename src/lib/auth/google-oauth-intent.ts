import "server-only";

import type { NextRequest, NextResponse } from "next/server";

export const GOOGLE_OAUTH_INTENT_COOKIE = "webserbisyo_google_oauth_intent";

const GOOGLE_OAUTH_INTENT_MAX_AGE_SECONDS = 10 * 60;

function getGoogleOAuthIntentCookieOptions() {
  return {
    httpOnly: true,
    maxAge: GOOGLE_OAUTH_INTENT_MAX_AGE_SECONDS,
    path: "/callback",
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
  };
}

/**
 * The cookie records only that the browser started the server-approved OAuth
 * path. It contains no identity, authorization code, token, or PII and is
 * never an authorization decision by itself.
 */
export function setGoogleOAuthIntent(response: NextResponse) {
  response.cookies.set(GOOGLE_OAUTH_INTENT_COOKIE, "initiated", getGoogleOAuthIntentCookieOptions());
}

export function hasGoogleOAuthIntent(request: NextRequest): boolean {
  return request.cookies.get(GOOGLE_OAUTH_INTENT_COOKIE)?.value === "initiated";
}

export function clearGoogleOAuthIntent(response: NextResponse) {
  response.cookies.set(GOOGLE_OAUTH_INTENT_COOKIE, "", {
    ...getGoogleOAuthIntentCookieOptions(),
    maxAge: 0,
  });
}

import { NextResponse } from "next/server";
import { GOOGLE_AUTH_ENABLED } from "@/lib/auth/google-oauth";
import { setGoogleOAuthIntent } from "@/lib/auth/google-oauth-intent";

export async function POST() {
  if (!GOOGLE_AUTH_ENABLED) {
    return new NextResponse(null, {
      headers: {
        "Cache-Control": "no-store",
      },
      status: 404,
    });
  }

  const response = NextResponse.json(
    { ok: true },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );

  setGoogleOAuthIntent(response);

  return response;
}

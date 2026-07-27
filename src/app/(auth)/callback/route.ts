import { NextResponse, type NextRequest } from "next/server";
import {
  GOOGLE_AUTH_ENABLED,
  getTrustedGoogleOAuthOrigin,
  hasGoogleOAuthIdentity,
} from "@/lib/auth/google-oauth";
import {
  clearGoogleOAuthIntent,
  hasGoogleOAuthIntent,
} from "@/lib/auth/google-oauth-intent";
import { resolveGoogleOAuthAuthorization } from "@/lib/auth/google-oauth-authorization";
import {
  getProfileLookupResult,
  getSafeNextPath,
  resolvePostLoginPath,
} from "@/lib/auth/redirects";
import { createRouteHandlerClient } from "@/lib/supabase/route";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const nextPath = getSafeNextPath(requestUrl.searchParams.get("next"));
  const trustedOrigin = getTrustedGoogleOAuthOrigin();
  const response = NextResponse.redirect(new URL("/dashboard", trustedOrigin));
  const startedByTrustedGoogleFlow = hasGoogleOAuthIntent(request);

  function redirectToLogin(errorCode: string) {
    clearGoogleOAuthIntent(response);
    response.headers.set(
      "Location",
      new URL(`/login?error=${errorCode}`, trustedOrigin).toString(),
    );

    return response;
  }

  if (!GOOGLE_AUTH_ENABLED) {
    return redirectToLogin("oauth_configuration_error");
  }

  const supabase = createRouteHandlerClient(request, response);

  if (requestUrl.searchParams.has("error")) {
    await supabase.auth.signOut();
    return redirectToLogin("oauth_provider_error");
  }

  if (!code) {
    await supabase.auth.signOut();
    return redirectToLogin("oauth_callback_failed");
  }

  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    await supabase.auth.signOut();
    return redirectToLogin("oauth_callback_failed");
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    await supabase.auth.signOut();
    return redirectToLogin("oauth_session_invalid");
  }

  const hasGoogleIdentity = hasGoogleOAuthIdentity(user);

  if (!startedByTrustedGoogleFlow || !hasGoogleIdentity) {
    await supabase.auth.signOut();
    return redirectToLogin("oauth_not_authorized");
  }

  const profileLookup = await getProfileLookupResult(supabase, user.id);
  const authorization = resolveGoogleOAuthAuthorization({
    hasGoogleIdentity,
    hasTrustedIntent: startedByTrustedGoogleFlow,
    profileLookup,
  });

  if (!authorization.allowed) {
    await supabase.auth.signOut();
    return redirectToLogin(authorization.errorCode);
  }

  if (profileLookup.status !== "ok") {
    await supabase.auth.signOut();
    return redirectToLogin("oauth_not_authorized");
  }

  clearGoogleOAuthIntent(response);
  response.headers.set(
    "Location",
    new URL(resolvePostLoginPath(profileLookup.profile, nextPath), trustedOrigin).toString(),
  );

  return response;
}

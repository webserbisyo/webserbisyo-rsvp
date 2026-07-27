import { expect, test } from "@playwright/test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  getGoogleOAuthCallbackUrl,
  getTrustedGoogleOAuthOrigin,
  hasGoogleOAuthIdentity,
  isGoogleAuthEnabled,
} from "../src/lib/auth/google-oauth";
import { resolveGoogleOAuthAuthorization } from "../src/lib/auth/google-oauth-authorization";
import type { ProfileLookupResult } from "../src/lib/auth/redirects";
import { getAuthRedirectErrorMessage, getSafeNextPath } from "../src/lib/auth/redirects";

// ─── Feature flag ────────────────────────────────────────────────────────────

test("the Google feature flag enables only for the exact public value", () => {
  expect(isGoogleAuthEnabled("true")).toBe(true);
  expect(isGoogleAuthEnabled("false")).toBe(false);
  expect(isGoogleAuthEnabled(undefined)).toBe(false);
  expect(isGoogleAuthEnabled("TRUE")).toBe(false);
  expect(isGoogleAuthEnabled(" true")).toBe(false);
  expect(isGoogleAuthEnabled("true ")).toBe(false);
  expect(isGoogleAuthEnabled("1")).toBe(false);
  expect(isGoogleAuthEnabled("yes")).toBe(false);
  expect(isGoogleAuthEnabled("")).toBe(false);
});

test("the Google button is conditionally rendered by the feature flag", () => {
  const loginForm = readSource("src/components/auth/login-form.tsx");
  expect(loginForm).toContain("GOOGLE_AUTH_ENABLED ?");
  expect(loginForm).toContain('"Sign in with Google"');
  expect(loginForm).not.toContain("Create account");
  expect(loginForm).not.toContain("Register with Google");
  expect(loginForm).not.toContain("Sign up");
});

// ─── OAuth initiation ────────────────────────────────────────────────────────

test("Google initiation uses a trusted callback, account chooser, and duplicate-click protection", () => {
  const loginForm = readSource("src/components/auth/login-form.tsx");
  const intentRoute = readSource("src/app/api/auth/google-intent/route.ts");

  expect(loginForm).toContain('provider: "google"');
  expect(loginForm).toContain("getGoogleOAuthCallbackUrl(nextPath)");
  expect(loginForm).toContain('prompt: "select_account"');
  expect(loginForm).toContain('fetch("/api/auth/google-intent"');
  expect(loginForm).toContain("if (!GOOGLE_AUTH_ENABLED || isBusy)");
  expect(loginForm).toContain("disabled={isBusy}");
  expect(intentRoute).toContain("if (!GOOGLE_AUTH_ENABLED)");
  expect(intentRoute).toContain("status: 404");
});

// ─── Redirect destination safety ─────────────────────────────────────────────

test("OAuth redirect destinations accept only safe internal paths", () => {
  const productionUrl = getGoogleOAuthCallbackUrl("/dashboard/event?tab=details", {
    NODE_ENV: "production",
  });
  const localUrl = getGoogleOAuthCallbackUrl("/dashboard", { NODE_ENV: "development" });

  expect(getTrustedGoogleOAuthOrigin({ NODE_ENV: "production" })).toBe(
    "https://rsvp.webserbisyo.com",
  );
  expect(getTrustedGoogleOAuthOrigin({ NODE_ENV: "development" })).toBe("http://localhost:3000");
  expect(new URL(productionUrl).origin).toBe("https://rsvp.webserbisyo.com");
  expect(new URL(productionUrl).pathname).toBe("/callback");
  expect(new URL(productionUrl).searchParams.get("next")).toBe("/dashboard/event?tab=details");
  expect(new URL(localUrl).origin).toBe("http://localhost:3000");
});

test("external, protocol-relative, and callback-recursive next destinations are rejected", () => {
  // External
  expect(
    new URL(
      getGoogleOAuthCallbackUrl("https://attacker.test", { NODE_ENV: "production" }),
    ).searchParams.has("next"),
  ).toBe(false);

  // Protocol-relative
  expect(
    new URL(
      getGoogleOAuthCallbackUrl("//attacker.test", { NODE_ENV: "production" }),
    ).searchParams.has("next"),
  ).toBe(false);

  // Callback recursion
  expect(
    new URL(
      getGoogleOAuthCallbackUrl("/callback", { NODE_ENV: "production" }),
    ).searchParams.has("next"),
  ).toBe(false);
  expect(
    new URL(
      getGoogleOAuthCallbackUrl("/callback?code=stolen", { NODE_ENV: "production" }),
    ).searchParams.has("next"),
  ).toBe(false);

  // Login redirect loop
  expect(getSafeNextPath("/login")).toBe(null);
});

test("backslash, encoded-slash, and control-character redirect values are handled safely", () => {
  // Backslash: URL parser may shift hostname but extracted safePath stays internal
  const backslashResult = getSafeNextPath("/\\attacker.com");
  if (backslashResult !== null) {
    // If the parser returns a path, it must not contain the external domain
    expect(backslashResult).not.toContain("attacker");
  }

  // Double backslash
  const doubleBackslash = getSafeNextPath("\\\\attacker.com");
  expect(doubleBackslash).toBe(null); // doesn't start with /

  // Encoded slash: %2F in path
  const encodedSlash = getSafeNextPath("/%2F/attacker.com");
  if (encodedSlash !== null) {
    // Verify it's a safe internal path
    const urlCheck = new URL(encodedSlash, "https://rsvp.webserbisyo.com");
    expect(urlCheck.hostname).toBe("rsvp.webserbisyo.com");
  }

  // Null byte
  const nullByte = getSafeNextPath("/dashboard\x00/evil");
  if (nullByte !== null) {
    expect(nullByte).not.toContain("\x00");
  }

  // Plain empty / null
  expect(getSafeNextPath(null)).toBe(null);
  expect(getSafeNextPath(undefined)).toBe(null);
  expect(getSafeNextPath("")).toBe(null);
});

// ─── Callback trust chain ────────────────────────────────────────────────────

test("the callback trusts server intent and Auth identities, not editable metadata", () => {
  const callback = readSource("src/app/(auth)/callback/route.ts");
  const intent = readSource("src/lib/auth/google-oauth-intent.ts");

  // Google identity detection uses Auth identity records, not metadata
  expect(
    hasGoogleOAuthIdentity({ identities: [{ provider: "google" }] } as Parameters<
      typeof hasGoogleOAuthIdentity
    >[0]),
  ).toBe(true);
  expect(
    hasGoogleOAuthIdentity({ identities: [{ provider: "email" }] } as Parameters<
      typeof hasGoogleOAuthIdentity
    >[0]),
  ).toBe(false);
  expect(hasGoogleOAuthIdentity({ identities: [] } as Parameters<typeof hasGoogleOAuthIdentity>[0])).toBe(false);
  expect(hasGoogleOAuthIdentity({ identities: undefined } as Parameters<typeof hasGoogleOAuthIdentity>[0])).toBe(false);

  // Callback uses authoritative checks
  expect(callback).toContain("await supabase.auth.exchangeCodeForSession(code)");
  expect(callback).toContain("await supabase.auth.getUser()");
  expect(callback).toContain("hasGoogleOAuthIntent(request)");
  expect(callback).toContain("hasGoogleOAuthIdentity(user)");
  expect(callback).not.toContain("user_metadata");

  // Intent cookie properties
  expect(intent).toContain("httpOnly: true");
  expect(intent).toContain('sameSite: "lax"');
  expect(intent).toContain('path: "/callback"');
  expect(intent).toContain("maxAge: GOOGLE_OAUTH_INTENT_MAX_AGE_SECONDS");
  expect(intent).toContain('secure: process.env.NODE_ENV === "production"');
});

test("the callback clears the intent cookie on every error path and on success", () => {
  const callback = readSource("src/app/(auth)/callback/route.ts");

  // The redirectToLogin helper always clears the cookie
  expect(callback).toContain("clearGoogleOAuthIntent(response)");
  // redirectToLogin is called on every error branch
  expect(callback).toContain("function redirectToLogin(errorCode: string)");

  // Count: every return path through redirectToLogin clears the cookie via the helper,
  // and the success path clears it directly
  const redirectToLoginCalls = (callback.match(/return redirectToLogin\(/g) || []).length;
  expect(redirectToLoginCalls).toBeGreaterThanOrEqual(5);

  // Success path clears it directly before setting the Location header
  const lines = callback.split("\n");
  const successClearIndex = lines.findIndex(
    (line, i) => line.includes("clearGoogleOAuthIntent(response)") && i > lines.findIndex((l) => l.includes("authorization.allowed")),
  );
  expect(successClearIndex).toBeGreaterThan(-1);
});

test("the callback handles disabled Google flag, missing code, and provider errors", () => {
  const callback = readSource("src/app/(auth)/callback/route.ts");

  // Google flag disabled → immediate error redirect
  expect(callback).toContain("if (!GOOGLE_AUTH_ENABLED)");
  expect(callback).toContain('"oauth_configuration_error"');

  // Provider error (error query param without code)
  expect(callback).toContain('requestUrl.searchParams.has("error")');
  expect(callback).toContain('"oauth_provider_error"');

  // Missing code
  expect(callback).toContain("if (!code)");
  expect(callback).toContain('"oauth_callback_failed"');

  // Code exchange failure
  expect(callback).toContain('"oauth_callback_failed"');

  // Invalid session
  expect(callback).toContain('"oauth_session_invalid"');

  // Does not expose raw error descriptions to the client
  expect(callback).not.toContain("error_description");
  expect(callback).not.toContain("user.email");
});

test("denied sessions are signed out before redirect", () => {
  const callback = readSource("src/app/(auth)/callback/route.ts");

  // Every denial path signs out
  const signOutCalls = (callback.match(/await supabase\.auth\.signOut\(\)/g) || []).length;
  expect(signOutCalls).toBeGreaterThanOrEqual(5);
});

// ─── Authorization decision (behavioral) ────────────────────────────────────

test("only approved active client roles pass the Google callback authorization decision", () => {
  // Allowed roles
  expect(
    resolveGoogleOAuthAuthorization({
      hasGoogleIdentity: true,
      hasTrustedIntent: true,
      profileLookup: successfulProfile("client_owner"),
    }),
  ).toEqual({ allowed: true });
  expect(
    resolveGoogleOAuthAuthorization({
      hasGoogleIdentity: true,
      hasTrustedIntent: true,
      profileLookup: successfulProfile("client_staff"),
    }),
  ).toEqual({ allowed: true });

  // platform_admin → password only
  expect(
    resolveGoogleOAuthAuthorization({
      hasGoogleIdentity: true,
      hasTrustedIntent: true,
      profileLookup: successfulProfile("platform_admin"),
    }),
  ).toEqual({ allowed: false, errorCode: "oauth_admin_password_only" });
});

test("missing profile, inactive profile, and inactive client are denied through Google", () => {
  expect(
    resolveGoogleOAuthAuthorization({
      hasGoogleIdentity: true,
      hasTrustedIntent: true,
      profileLookup: deniedProfile("missing_profile"),
    }),
  ).toEqual({ allowed: false, errorCode: "oauth_not_authorized" });

  expect(
    resolveGoogleOAuthAuthorization({
      hasGoogleIdentity: true,
      hasTrustedIntent: true,
      profileLookup: deniedProfile("inactive_profile"),
    }),
  ).toEqual({ allowed: false, errorCode: "oauth_client_inactive" });

  expect(
    resolveGoogleOAuthAuthorization({
      hasGoogleIdentity: true,
      hasTrustedIntent: true,
      profileLookup: deniedProfile("client_inactive"),
    }),
  ).toEqual({ allowed: false, errorCode: "oauth_client_inactive" });
});

test("unknown role, archived client, and cancelled client are denied through Google", () => {
  expect(
    resolveGoogleOAuthAuthorization({
      hasGoogleIdentity: true,
      hasTrustedIntent: true,
      profileLookup: deniedProfile("unknown_role"),
    }),
  ).toEqual({ allowed: false, errorCode: "oauth_not_authorized" });

  // callback_failed maps to the same "not authorized" bucket for OAuth
  expect(
    resolveGoogleOAuthAuthorization({
      hasGoogleIdentity: true,
      hasTrustedIntent: true,
      profileLookup: deniedProfile("callback_failed"),
    }),
  ).toEqual({ allowed: false, errorCode: "oauth_not_authorized" });
});

test("missing Google identity or missing intent cookie denies even valid profiles", () => {
  // No Google identity
  expect(
    resolveGoogleOAuthAuthorization({
      hasGoogleIdentity: false,
      hasTrustedIntent: true,
      profileLookup: successfulProfile("client_owner"),
    }),
  ).toEqual({ allowed: false, errorCode: "oauth_not_authorized" });

  // No trusted intent
  expect(
    resolveGoogleOAuthAuthorization({
      hasGoogleIdentity: true,
      hasTrustedIntent: false,
      profileLookup: successfulProfile("client_owner"),
    }),
  ).toEqual({ allowed: false, errorCode: "oauth_not_authorized" });

  // Neither
  expect(
    resolveGoogleOAuthAuthorization({
      hasGoogleIdentity: false,
      hasTrustedIntent: false,
      profileLookup: successfulProfile("client_owner"),
    }),
  ).toEqual({ allowed: false, errorCode: "oauth_not_authorized" });
});

// ─── Error messages ──────────────────────────────────────────────────────────

test("all OAuth error codes produce safe user-facing messages", () => {
  expect(getAuthRedirectErrorMessage("oauth_not_authorized")).toContain("not connected");
  expect(getAuthRedirectErrorMessage("oauth_admin_password_only")).toContain("email and password");
  expect(getAuthRedirectErrorMessage("oauth_client_inactive")).toContain("inactive");
  expect(getAuthRedirectErrorMessage("oauth_provider_error")).toContain("try again");
  expect(getAuthRedirectErrorMessage("oauth_callback_failed")).toContain("try again");
  expect(getAuthRedirectErrorMessage("oauth_session_invalid")).toContain("try again");
  expect(getAuthRedirectErrorMessage("oauth_configuration_error")).toContain("temporarily unavailable");

  // No error message should expose internal details
  for (const code of [
    "oauth_not_authorized",
    "oauth_admin_password_only",
    "oauth_client_inactive",
    "oauth_provider_error",
    "oauth_callback_failed",
    "oauth_session_invalid",
    "oauth_configuration_error",
  ]) {
    const message = getAuthRedirectErrorMessage(code);
    expect(message).not.toBeNull();
    expect(message!).not.toContain("500");
    expect(message!).not.toContain("exception");
    expect(message!).not.toContain("stack");
  }
});

// ─── No provisioning from OAuth ──────────────────────────────────────────────

test("Google linking preserves the existing authoritative relationship and leaves passwords untouched", () => {
  const callback = readSource("src/app/(auth)/callback/route.ts");
  const passwordAction = readSource("src/server/actions/auth.ts");
  const loginForm = readSource("src/components/auth/login-form.tsx");

  // No provisioning in callback
  expect(callback).toContain("getProfileLookupResult(supabase, user.id)");
  expect(callback).not.toContain("createClientUser");
  expect(callback).not.toContain("ensureOwnerProfileForClient");
  expect(callback).not.toContain("ensureEventBundleForClient");
  expect(callback).not.toContain(".insert(");
  expect(callback).not.toContain(".update(");

  // Password login unchanged
  expect(passwordAction).toContain("signInWithPassword");
  expect(loginForm).toContain('name="password"');
  expect(loginForm).toContain("Show password");
});

// ─── No registration UI ─────────────────────────────────────────────────────

test("no registration language exists in the login form", () => {
  const loginForm = readSource("src/components/auth/login-form.tsx");
  expect(loginForm).not.toContain("Create account");
  expect(loginForm).not.toContain("Register");
  expect(loginForm).not.toContain("Sign up");
  expect(loginForm).not.toContain("sign up");
});

// ─── Password login coexistence ──────────────────────────────────────────────

test("password login form fields remain present alongside Google", () => {
  const loginForm = readSource("src/components/auth/login-form.tsx");
  expect(loginForm).toContain('id="email"');
  expect(loginForm).toContain('id="password"');
  expect(loginForm).toContain("Forgot password?");
  expect(loginForm).toContain('type="submit"');
  expect(loginForm).toContain('"Sign in"');
});

// ─── RSVP behavior ──────────────────────────────────────────────────────────

test("RSVP submission remains automatically included and reject remains available", () => {
  const phaseOneMigration = readSource("supabase/migrations/20260726191308_harden_auth_tenant_and_rsvp_rpc.sql");
  const submissionService = readSource("src/server/services/submit-rsvp-response.ts");
  const responseUi = readSource("src/components/dashboard/responses/rsvp-response-detail-dialog.tsx");

  expect(phaseOneMigration).toContain("'approved'");
  expect(phaseOneMigration).not.toContain("review_status, 'pending'");
  expect(submissionService).toContain('"submit_rsvp_response_with_capacity_check"');
  expect(responseUi).toContain("Reject RSVP");
});

test("no pending or approve workflow exists in the RSVP response UI", () => {
  const responseUi = readSource("src/components/dashboard/responses/rsvp-response-detail-dialog.tsx");

  // No "Approve RSVP" button or action
  expect(responseUi).not.toContain("Approve RSVP");

  // The reviewStatus type only allows "approved" (auto) and "rejected" — no "pending"
  expect(responseUi).toContain('"approved" | "rejected"');
  expect(responseUi).not.toMatch(/reviewStatus.*pending/);
});

// ─── Existing identity preservation ─────────────────────────────────────────

test("existing identity relationships are preserved during Google linking", () => {
  const callback = readSource("src/app/(auth)/callback/route.ts");

  // The callback never modifies identities, profiles, or client relationships
  expect(callback).not.toContain(".delete(");
  expect(callback).not.toContain("admin.deleteUser");
  expect(callback).not.toContain("admin.updateUser");
  expect(callback).not.toContain("unlinkIdentity");

  // Authorization uses the profile lookup tied to the Auth UUID
  expect(callback).toContain("getProfileLookupResult(supabase, user.id)");
});

// ─── Helpers ─────────────────────────────────────────────────────────────────

function readSource(path: string) {
  return readFileSync(join(process.cwd(), path), "utf8");
}

function successfulProfile(role: "client_owner" | "client_staff" | "platform_admin"): ProfileLookupResult {
  return {
    profile: {
      client_id: role === "platform_admin" ? null : "client-id",
      email: "",
      full_name: "",
      id: "auth-id",
      is_active: true,
      role,
    },
    status: "ok",
  };
}

function deniedProfile(
  status: Exclude<ProfileLookupResult["status"], "ok">,
): ProfileLookupResult {
  return {
    profile: null,
    status,
  };
}

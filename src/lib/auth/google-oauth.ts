import type { User } from "@supabase/supabase-js";
import { DEFAULT_PUBLIC_APP_URL } from "@/lib/public-rsvp-url";
import { getSafeNextPath } from "./redirects";

export const GOOGLE_CLIENT_ID =
  process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ??
  "1018608771984-a1m86bvpejrh9f8mmpgc91kotih0mukh.apps.googleusercontent.com";

export const GOOGLE_AUTH_ENABLED =
  Boolean(process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID) ||
  isGoogleAuthEnabled(process.env.NEXT_PUBLIC_GOOGLE_AUTH_ENABLED);

export const GOOGLE_OAUTH_CALLBACK_PATH = "/callback";

type GoogleOAuthEnvironment = {
  NEXT_PUBLIC_GOOGLE_AUTH_ENABLED?: string;
  NODE_ENV?: string;
};

export function isGoogleAuthEnabled(value: string | undefined): boolean {
  return value === "true";
}

/**
 * OAuth redirects are deliberately pinned to trusted application origins rather
 * than request headers. Preview deployments do not enable the public flag.
 */
export function getTrustedGoogleOAuthOrigin(
  environment: GoogleOAuthEnvironment = process.env,
): string {
  return environment.NODE_ENV === "development" ? "http://localhost:3000" : DEFAULT_PUBLIC_APP_URL;
}

export function getGoogleOAuthCallbackUrl(
  nextPath?: string | null,
  environment: GoogleOAuthEnvironment = process.env,
): string {
  const callbackUrl = new URL(GOOGLE_OAUTH_CALLBACK_PATH, getTrustedGoogleOAuthOrigin(environment));
  const safeNextPath = getSafeNextPath(nextPath);

  if (safeNextPath) {
    callbackUrl.searchParams.set("next", safeNextPath);
  }

  return callbackUrl.toString();
}

/**
 * Supabase returns identities from Auth's authoritative user record. This is
 * intentionally not derived from user_metadata, which a user may edit.
 */
export function hasGoogleOAuthIdentity(user: Pick<User, "identities">): boolean {
  return user.identities?.some((identity) => identity.provider === "google") ?? false;
}

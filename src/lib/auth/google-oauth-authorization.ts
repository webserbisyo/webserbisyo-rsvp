import type { ProfileLookupResult } from "./redirects";

export type GoogleOAuthAuthorizationDecision =
  | { allowed: true }
  | {
      allowed: false;
      errorCode: "oauth_admin_password_only" | "oauth_client_inactive" | "oauth_not_authorized";
    };

/**
 * This makes no authorization decision from provider claims or metadata. The
 * caller supplies the profile lookup that was resolved from Auth's UUID and
 * the database-backed client lifecycle check.
 */
export function resolveGoogleOAuthAuthorization(input: {
  hasGoogleIdentity: boolean;
  hasTrustedIntent: boolean;
  profileLookup: ProfileLookupResult;
}): GoogleOAuthAuthorizationDecision {
  if (!input.hasTrustedIntent || !input.hasGoogleIdentity) {
    return { allowed: false, errorCode: "oauth_not_authorized" };
  }

  if (input.profileLookup.status !== "ok") {
    return {
      allowed: false,
      errorCode:
        input.profileLookup.status === "client_inactive" ||
        input.profileLookup.status === "inactive_profile"
          ? "oauth_client_inactive"
          : "oauth_not_authorized",
    };
  }

  if (input.profileLookup.profile.role === "platform_admin") {
    return { allowed: false, errorCode: "oauth_admin_password_only" };
  }

  if (
    input.profileLookup.profile.role === "client_owner" ||
    input.profileLookup.profile.role === "client_staff"
  ) {
    return { allowed: true };
  }

  return { allowed: false, errorCode: "oauth_not_authorized" };
}

import type { SupabaseClient } from "@supabase/supabase-js";
import { clientStatusAllowsDashboardAccess } from "@/lib/auth/client-access";
import type { Database, Tables } from "@/lib/supabase/types";

export type AuthenticatedProfile = Pick<
  Tables<"profiles">,
  "client_id" | "email" | "full_name" | "id" | "is_active" | "role"
>;

export type AuthRedirectErrorCode =
  | "callback_failed"
  | "client_inactive"
  | "inactive_profile"
  | "missing_profile"
  | "unknown_role";

export type ProfileLookupResult =
  | {
      profile: AuthenticatedProfile;
      status: "ok";
    }
  | {
      profile: AuthenticatedProfile | null;
      status: AuthRedirectErrorCode;
    };

const CLIENT_ROLES = new Set(["client_owner", "client_staff"]);

export async function getProfileLookupResult(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<ProfileLookupResult> {
  const { data, error } = await supabase
    .from("profiles")
    .select("client_id, email, full_name, id, is_active, role")
    .eq("id", userId)
    .maybeSingle();

  if (error || !data) {
    return {
      profile: null,
      status: "missing_profile",
    };
  }

  if (!data.is_active) {
    return {
      profile: data,
      status: "inactive_profile",
    };
  }

  if (!isKnownRole(data.role)) {
    return {
      profile: data,
      status: "unknown_role",
    };
  }

  if (CLIENT_ROLES.has(data.role)) {
    if (!data.client_id) {
      return {
        profile: data,
        status: "missing_profile",
      };
    }

    const { data: client, error: clientError } = await supabase
      .from("clients")
      .select("status")
      .eq("id", data.client_id)
      .maybeSingle();

    if (clientError || !clientStatusAllowsDashboardAccess(client?.status)) {
      return {
        profile: data,
        status: "client_inactive",
      };
    }
  }

  return {
    profile: data,
    status: "ok",
  };
}

export function getSafeNextPath(value: string | null | undefined): string | null {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return null;
  }

  try {
    const parsed = new URL(value, "http://localhost");
    const safePath = `${parsed.pathname}${parsed.search}${parsed.hash}`;

    if (safePath === "/login" || safePath.startsWith("/callback")) {
      return null;
    }

    return safePath;
  } catch {
    return null;
  }
}

export function resolvePostLoginPath(
  profile: Pick<AuthenticatedProfile, "role">,
  nextPath: string | null | undefined,
): string {
  const safeNextPath = getSafeNextPath(nextPath);

  if (safeNextPath && isPathAllowedForRole(profile.role, safeNextPath)) {
    return safeNextPath;
  }

  return getDefaultPathForRole(profile.role);
}

export function getAuthRedirectErrorMessage(code: string | null | undefined): string | null {
  switch (code) {
    case "callback_failed":
      return "The sign-in callback could not be completed. Please try again.";
    case "client_inactive":
      return "This client dashboard is not currently active. Contact support if you need access.";
    case "inactive_profile":
      return "Your account is inactive. Contact support if you need access.";
    case "missing_profile":
      return "Your account is missing a valid profile. Contact support before signing in.";
    case "unknown_role":
      return "Your account role is not supported yet. Contact support before signing in.";
    default:
      return null;
  }
}

export function mapSignInErrorMessage(message: string | undefined): string {
  if (!message) {
    return "Unable to sign in right now. Please try again.";
  }

  const normalized = message.toLowerCase();

  if (normalized.includes("invalid login credentials")) {
    return "Invalid email or password.";
  }

  if (normalized.includes("email not confirmed")) {
    return "Confirm your email address before signing in.";
  }

  if (normalized.includes("too many requests")) {
    return "Too many sign-in attempts. Please wait a moment and try again.";
  }

  return "Unable to sign in right now. Please try again.";
}

function getDefaultPathForRole(role: string): string {
  if (role === "platform_admin") {
    return "/admin";
  }

  if (CLIENT_ROLES.has(role)) {
    return "/dashboard";
  }

  return "/login";
}

function isKnownRole(role: string): boolean {
  return role === "platform_admin" || CLIENT_ROLES.has(role);
}

function isPathAllowedForRole(role: string, path: string): boolean {
  if (role === "platform_admin") {
    return !path.startsWith("/dashboard");
  }

  if (CLIENT_ROLES.has(role)) {
    return !path.startsWith("/admin");
  }

  return false;
}

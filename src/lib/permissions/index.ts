import "server-only";

import { cache } from "react";
import { clientStatusAllowsDashboardAccess } from "@/lib/auth/client-access";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { Tables } from "@/lib/supabase/types";

export type AuthenticatedProfile = Tables<"profiles">;

export class PermissionError extends Error {
  readonly code: "client_inactive" | "missing_client" | "wrong_client" | "wrong_role";

  constructor(
    message = "You do not have permission to perform this action.",
    code: PermissionError["code"] = "wrong_role",
  ) {
    super(message);
    this.name = "PermissionError";
    this.code = code;
  }
}

export class AuthenticationError extends Error {
  constructor(message = "You must be signed in to perform this action.") {
    super(message);
    this.name = "AuthenticationError";
  }
}

const loadAuthenticatedProfile = cache(async (): Promise<AuthenticatedProfile> => {
  const supabase = await createServerSupabaseClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();

  if (userError || !userData.user) {
    throw new AuthenticationError();
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userData.user.id)
    .eq("is_active", true)
    .single();

  if (profileError || !profile) {
    throw new PermissionError("No active profile exists for the signed-in user.");
  }

  return profile;
});

async function requireProfile(): Promise<AuthenticatedProfile> {
  return loadAuthenticatedProfile();
}

export async function requireAdmin(): Promise<AuthenticatedProfile> {
  const profile = await requireProfile();

  if (profile.role !== "platform_admin") {
    throw new PermissionError("Platform admin access is required.", "wrong_role");
  }

  return profile;
}

export async function requireTenantMember(clientId?: string): Promise<AuthenticatedProfile> {
  const profile = await requireProfile();

  if (!["client_owner", "client_staff"].includes(profile.role)) {
    throw new PermissionError("Client tenant access is required.", "wrong_role");
  }

  if (!profile.client_id) {
    throw new PermissionError("Client tenant access is required.", "missing_client");
  }

  if (clientId && profile.client_id !== clientId) {
    throw new PermissionError(
      "Client tenant access does not match the requested client.",
      "wrong_client",
    );
  }

  const supabase = await createServerSupabaseClient();
  const { data: client, error: clientError } = await supabase
    .from("clients")
    .select("status")
    .eq("id", profile.client_id)
    .maybeSingle();

  if (clientError || !clientStatusAllowsDashboardAccess(client?.status)) {
    throw new PermissionError("This client dashboard is not currently active.", "client_inactive");
  }

  return profile;
}

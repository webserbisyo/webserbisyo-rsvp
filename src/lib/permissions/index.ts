import "server-only";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { Tables } from "@/lib/supabase/types";

export type AuthenticatedProfile = Tables<"profiles">;

export class PermissionError extends Error {
  constructor(message = "You do not have permission to perform this action.") {
    super(message);
    this.name = "PermissionError";
  }
}

export class AuthenticationError extends Error {
  constructor(message = "You must be signed in to perform this action.") {
    super(message);
    this.name = "AuthenticationError";
  }
}

async function requireProfile(): Promise<AuthenticatedProfile> {
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
}

export async function requireAdmin(): Promise<AuthenticatedProfile> {
  const profile = await requireProfile();

  if (profile.role !== "platform_admin") {
    throw new PermissionError("Platform admin access is required.");
  }

  return profile;
}

export async function requireTenantMember(clientId?: string): Promise<AuthenticatedProfile> {
  const profile = await requireProfile();

  if (!["client_owner", "client_staff"].includes(profile.role) || !profile.client_id) {
    throw new PermissionError("Client tenant access is required.");
  }

  if (clientId && profile.client_id !== clientId) {
    throw new PermissionError("Client tenant access does not match the requested client.");
  }

  return profile;
}

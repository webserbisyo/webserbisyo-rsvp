import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { assertServiceData, assertServiceSuccess, ServiceError } from "./service-error";

export type CreateClientUserInput = {
  clientId: string;
  email: string;
  fullName?: string | null;
};

export async function createClientUser(input: CreateClientUserInput) {
  const supabase = createAdminClient();
  const normalizedEmail = input.email.trim().toLowerCase();

  const { data: existingProfile, error: existingProfileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("email", normalizedEmail)
    .maybeSingle();

  assertServiceSuccess(existingProfileError, "Failed to check existing client profile.");

  if (existingProfile) {
    if (existingProfile.client_id !== input.clientId || existingProfile.role !== "client_owner") {
      throw new ServiceError("Email is already attached to a different profile scope.");
    }

    return existingProfile;
  }

  const redirectTo = process.env.NEXT_PUBLIC_APP_URL
    ? `${process.env.NEXT_PUBLIC_APP_URL}/callback?next=/dashboard`
    : undefined;

  const { data: invitedUser, error: inviteError } = await supabase.auth.admin.inviteUserByEmail(
    normalizedEmail,
    {
      data: {
        client_id: input.clientId,
        full_name: input.fullName ?? null,
        role: "client_owner",
      },
      redirectTo,
    },
  );

  assertServiceSuccess(inviteError, "Failed to invite client owner.");

  if (!invitedUser.user) {
    throw new ServiceError("Supabase Auth invite did not return a user.");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .insert({
      client_id: input.clientId,
      email: normalizedEmail,
      full_name: input.fullName ?? null,
      id: invitedUser.user.id,
      is_active: true,
      role: "client_owner",
    })
    .select("*")
    .single();

  assertServiceSuccess(profileError, "Failed to create client owner profile.");
  assertServiceData(profile, "Client owner profile insert returned no row.");

  return profile;
}

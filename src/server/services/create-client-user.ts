import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { assertServiceData } from "./service-error";

export type CreateClientUserInput = {
  clientId: string;
  email: string;
  fullName?: string | null;
};

export type CreateClientUserResult = {
  profileId?: string;
  warning?: string;
};

export async function createClientUser(
  input: CreateClientUserInput,
): Promise<CreateClientUserResult> {
  const supabase = await createServerSupabaseClient();
  const adminSupabase = createAdminClient();
  const normalizedEmail = input.email.trim().toLowerCase();

  const { data: existingProfile, error: existingProfileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("email", normalizedEmail)
    .maybeSingle();

  if (existingProfileError) {
    return {
      warning: "Client owner setup was skipped because the existing profile could not be checked.",
    };
  }

  if (existingProfile) {
    if (existingProfile.client_id === input.clientId && existingProfile.role === "client_owner") {
      return { profileId: existingProfile.id };
    }

    return {
      warning:
        "Client owner setup was skipped because this email is already linked to a different profile.",
    };
  }

  const authUser = await findAuthUserByEmail(adminSupabase, normalizedEmail);

  if (authUser) {
    return createProfileForAuthUser(supabase, {
      authUserId: authUser.id,
      clientId: input.clientId,
      email: normalizedEmail,
      fullName: input.fullName,
    });
  }

  const redirectTo = process.env.NEXT_PUBLIC_APP_URL
    ? `${process.env.NEXT_PUBLIC_APP_URL}/callback?next=/dashboard`
    : undefined;
  const { data: invitedUser, error: inviteError } =
    await adminSupabase.auth.admin.inviteUserByEmail(normalizedEmail, {
      data: {
        client_id: input.clientId,
        full_name: input.fullName ?? null,
        role: "client_owner",
      },
      redirectTo,
    });

  if (inviteError) {
    return {
      warning: getInviteWarningMessage(inviteError),
    };
  }

  if (!invitedUser.user) {
    return {
      warning: "Client owner setup was skipped because the onboarding invite returned no user.",
    };
  }

  return createProfileForAuthUser(supabase, {
    authUserId: invitedUser.user.id,
    clientId: input.clientId,
    email: normalizedEmail,
    fullName: input.fullName,
  });
}

async function createProfileForAuthUser(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>,
  input: {
    authUserId: string;
    clientId: string;
    email: string;
    fullName?: string | null;
  },
): Promise<CreateClientUserResult> {
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .insert({
      client_id: input.clientId,
      email: input.email,
      full_name: input.fullName ?? null,
      id: input.authUserId,
      is_active: true,
      role: "client_owner",
    })
    .select("*")
    .single();

  if (profileError) {
    const { data: existingProfile, error: existingProfileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", input.authUserId)
      .maybeSingle();

    if (!existingProfileError && existingProfile) {
      if (existingProfile.client_id === input.clientId && existingProfile.role === "client_owner") {
        return { profileId: existingProfile.id };
      }

      return {
        warning:
          "Client owner setup was skipped because this auth user is already linked to a different profile.",
      };
    }

    return {
      warning: "Client owner setup was skipped because the owner profile could not be created.",
    };
  }

  assertServiceData(profile, "Client owner profile insert returned no row.");

  return { profileId: profile.id };
}

async function findAuthUserByEmail(
  adminSupabase: ReturnType<typeof createAdminClient>,
  email: string,
) {
  const { data, error } = await adminSupabase.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  });

  if (error) {
    return null;
  }

  return data.users.find((user) => user.email?.toLowerCase() === email) ?? null;
}

function getInviteWarningMessage(error: { code?: string | null; message?: string | null }) {
  const normalizedMessage = error.message?.toLowerCase() ?? "";

  if (normalizedMessage.includes("already been registered")) {
    return "Onboarding invite skipped because the user already exists.";
  }

  if (normalizedMessage.includes("rate limit")) {
    return "Onboarding invite skipped because email sending is rate-limited.";
  }

  if (normalizedMessage.includes("invalid")) {
    return "Onboarding invite skipped because the email address is invalid.";
  }

  return "Onboarding invite skipped because the client owner could not be invited.";
}

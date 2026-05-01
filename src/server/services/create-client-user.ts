import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { generateTemporaryPassword } from "./generate-temporary-password";
import { assertServiceData } from "./service-error";

export type CreateClientUserInput = {
  accessMode?: "invite" | "temporary_password";
  clientId: string;
  email: string;
  fullName?: string | null;
};

export type CreateClientUserResult = {
  profileId?: string;
  temporaryPassword?: string;
  userId?: string;
  warning?: string;
};

export async function createClientUser(
  input: CreateClientUserInput,
): Promise<CreateClientUserResult> {
  const supabase = await createServerSupabaseClient();
  const adminSupabase = createAdminClient();
  const normalizedEmail = input.email.trim().toLowerCase();
  const accessMode = input.accessMode ?? "invite";

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
      const authUser = await findAuthUserByEmail(adminSupabase, normalizedEmail);

      if (!authUser || authUser.id !== existingProfile.id) {
        return {
          warning:
            "Client owner access could not be refreshed because the linked auth account is missing.",
        };
      }

      if (accessMode === "temporary_password") {
        return issueTemporaryPassword(adminSupabase, authUser.id, existingProfile.id);
      }

      return { profileId: existingProfile.id, userId: authUser.id };
    }

    return {
      warning:
        "Client owner setup was skipped because this email is already linked to a different profile.",
    };
  }

  const authUser = await findAuthUserByEmail(adminSupabase, normalizedEmail);

  if (authUser) {
    const profileResult = await createProfileForAuthUser(supabase, {
      authUserId: authUser.id,
      clientId: input.clientId,
      email: normalizedEmail,
      fullName: input.fullName,
    });

    if (profileResult.warning || accessMode !== "temporary_password") {
      return {
        ...profileResult,
        userId: authUser.id,
      };
    }

    const passwordResult = await issueTemporaryPassword(adminSupabase, authUser.id, authUser.id);

    return {
      ...profileResult,
      ...passwordResult,
      warning: passwordResult.warning ?? profileResult.warning,
    };
  }

  if (accessMode === "temporary_password") {
    const temporaryPassword = generateTemporaryPassword();
    const { data: createdUser, error: createError } = await adminSupabase.auth.admin.createUser({
      email: normalizedEmail,
      email_confirm: true,
      password: temporaryPassword,
      user_metadata: {
        client_id: input.clientId,
        full_name: input.fullName ?? null,
        role: "client_owner",
      },
    });

    if (createError) {
      return {
        warning: getCreateUserWarningMessage(createError),
      };
    }

    if (!createdUser.user) {
      return {
        warning: "Client owner access could not be created because no auth user was returned.",
      };
    }

    const profileResult = await createProfileForAuthUser(supabase, {
      authUserId: createdUser.user.id,
      clientId: input.clientId,
      email: normalizedEmail,
      fullName: input.fullName,
    });

    if (profileResult.warning) {
      return {
        ...profileResult,
        userId: createdUser.user.id,
      };
    }

    return {
      ...profileResult,
      temporaryPassword,
      userId: createdUser.user.id,
    };
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

async function issueTemporaryPassword(
  adminSupabase: ReturnType<typeof createAdminClient>,
  authUserId: string,
  profileId: string,
): Promise<CreateClientUserResult> {
  const temporaryPassword = generateTemporaryPassword();
  const { error } = await adminSupabase.auth.admin.updateUserById(authUserId, {
    email_confirm: true,
    password: temporaryPassword,
  });

  if (error) {
    return {
      profileId,
      userId: authUserId,
      warning: getUpdateUserWarningMessage(error),
    };
  }

  return {
    profileId,
    temporaryPassword,
    userId: authUserId,
  };
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

function getCreateUserWarningMessage(error: { code?: string | null; message?: string | null }) {
  const normalizedMessage = error.message?.toLowerCase() ?? "";

  if (normalizedMessage.includes("already been registered")) {
    return "Client owner access could not be created because the email already exists.";
  }

  if (normalizedMessage.includes("password")) {
    return "Client owner access could not be created because the password did not meet auth requirements.";
  }

  return "Client owner access could not be created.";
}

function getUpdateUserWarningMessage(error: { code?: string | null; message?: string | null }) {
  const normalizedMessage = error.message?.toLowerCase() ?? "";

  if (normalizedMessage.includes("password")) {
    return "Client owner access could not be reset because the password did not meet auth requirements.";
  }

  return "Client owner access could not be reset.";
}

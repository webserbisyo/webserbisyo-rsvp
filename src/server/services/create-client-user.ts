import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import {
  escapePostgrestLikePattern,
  findUniqueAuthUserByEmail,
  normalizeAuthEmail,
} from "./find-auth-user-by-email";
import { generateInternalAuthPassword } from "./generate-internal-auth-password";
import { assertServiceData } from "./service-error";

export type CreateClientUserInput = {
  clientId: string;
  email: string;
  fullName?: string | null;
};

export type CreateClientUserResult = {
  profileId?: string;
  userId?: string;
  warning?: string;
};

export async function createClientUser(
  input: CreateClientUserInput,
): Promise<CreateClientUserResult> {
  const adminSupabase = createAdminClient();
  const normalizedEmail = normalizeAuthEmail(input.email);
  const { data: profiles, error: profilesError } = await adminSupabase
    .from("profiles")
    .select("*")
    .ilike("email", escapePostgrestLikePattern(normalizedEmail))
    .limit(2);

  if (profilesError) {
    return {
      warning: "Client owner setup was skipped because the existing profile could not be checked.",
    };
  }

  if ((profiles?.length ?? 0) > 1) {
    return {
      warning:
        "Client owner setup was skipped because multiple profiles use this normalized email.",
    };
  }

  const existingProfile = profiles?.[0] ?? null;

  if (existingProfile) {
    if (existingProfile.client_id !== input.clientId || existingProfile.role !== "client_owner") {
      return {
        warning:
          "Client owner setup was skipped because this email is already linked to a different profile.",
      };
    }

    if (!existingProfile.is_active) {
      return {
        warning:
          "Client owner setup requires manual review because the existing profile is inactive.",
      };
    }

    const authUser = await findUniqueAuthUserByEmail(normalizedEmail);

    if (!authUser || authUser.id !== existingProfile.id) {
      return {
        warning:
          "Client owner access could not be refreshed because the linked auth account is missing or inconsistent.",
      };
    }

    return { profileId: existingProfile.id, userId: authUser.id };
  }

  const authUser = await findUniqueAuthUserByEmail(normalizedEmail);

  if (authUser) {
    const profileResult = await createProfileForAuthUser({
      authUserId: authUser.id,
      clientId: input.clientId,
      email: normalizedEmail,
      fullName: input.fullName,
    });

    return {
      ...profileResult,
      userId: authUser.id,
    };
  }

  const internalPassword = generateInternalAuthPassword();
  const { data: createdUser, error: createError } = await adminSupabase.auth.admin.createUser({
    email: normalizedEmail,
    email_confirm: true,
    password: internalPassword,
    user_metadata: {
      full_name: input.fullName ?? null,
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

  const profileResult = await createProfileForAuthUser({
    authUserId: createdUser.user.id,
    clientId: input.clientId,
    email: normalizedEmail,
    fullName: input.fullName,
  });

  return {
    ...profileResult,
    userId: createdUser.user.id,
  };
}

async function createProfileForAuthUser(input: {
  authUserId: string;
  clientId: string;
  email: string;
  fullName?: string | null;
}): Promise<CreateClientUserResult> {
  const adminSupabase = createAdminClient();
  const { data: profile, error: profileError } = await adminSupabase
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
    const { data: existingProfile, error: existingProfileError } = await adminSupabase
      .from("profiles")
      .select("*")
      .eq("id", input.authUserId)
      .maybeSingle();

    if (!existingProfileError && existingProfile) {
      if (
        existingProfile.client_id === input.clientId &&
        existingProfile.role === "client_owner" &&
        existingProfile.is_active
      ) {
        return { profileId: existingProfile.id };
      }

      return {
        warning:
          "Client owner setup was skipped because this auth user is already linked to a different or inactive profile.",
      };
    }

    return {
      warning: "Client owner setup was skipped because the owner profile could not be created.",
    };
  }

  assertServiceData(profile, "Client owner profile insert returned no row.");

  return { profileId: profile.id };
}

function getCreateUserWarningMessage(error: { message?: string | null }) {
  const normalizedMessage = error.message?.toLowerCase() ?? "";

  if (normalizedMessage.includes("already been registered")) {
    return "Client owner access could not be created because the email already exists.";
  }

  if (normalizedMessage.includes("password")) {
    return "Client owner access could not be created because the internal password did not meet auth requirements.";
  }

  return "Client owner access could not be created.";
}

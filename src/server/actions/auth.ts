"use server";

import { redirect, unstable_rethrow } from "next/navigation";
import { z } from "zod";
import {
  getAuthRedirectErrorMessage,
  getProfileLookupResult,
  getSafeNextPath,
  mapSignInErrorMessage,
  resolvePostLoginPath,
} from "@/lib/auth/redirects";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { requestClientPasswordReset } from "@/server/services/request-client-password-reset";
import { actionFailure, actionSuccess, parseActionInput } from "./action-utils";

const LoginSchema = z.object({
  email: z.email(),
  next: z.string().optional(),
  password: z.string().min(1, "Password is required."),
});

const RequestPasswordResetSchema = z.object({
  email: z.email(),
});

export type LoginActionState = {
  error: string | null;
};

export async function loginAction(
  _previousState: LoginActionState,
  input: FormData,
): Promise<LoginActionState> {
  try {
    const payload = parseActionInput(LoginSchema, input);
    const nextPath = getSafeNextPath(payload.next);
    const supabase = await createServerSupabaseClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: payload.email.trim(),
      password: payload.password,
    });

    if (signInError) {
      return {
        error: mapSignInErrorMessage(signInError.message),
      };
    }

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return {
        error: "Your session could not be verified after sign-in. Please try again.",
      };
    }

    const profileLookup = await getProfileLookupResult(supabase, user.id);

    if (profileLookup.status !== "ok") {
      await supabase.auth.signOut();

      return {
        error:
          getAuthRedirectErrorMessage(profileLookup.status) ??
          "Your account could not be validated. Please try again.",
      };
    }

    redirect(resolvePostLoginPath(profileLookup.profile, nextPath));
  } catch (error) {
    unstable_rethrow(error);
    const result = actionFailure(error);
    return {
      error: result.ok ? "The request could not be completed." : result.error,
    };
  }
}

export async function requestPasswordResetAction(input: unknown) {
  try {
    const payload = parseActionInput(RequestPasswordResetSchema, input);
    await requestClientPasswordReset(payload.email);
  } catch (error) {
    if (error instanceof Error) {
      return actionFailure(error);
    }

    // Keep the response generic to avoid account enumeration.
    return actionSuccess({
      message: "If an active dashboard account exists for that email, a reset link has been sent.",
    });
  }

  return actionSuccess({
    message: "If an active dashboard account exists for that email, a reset link has been sent.",
  });
}

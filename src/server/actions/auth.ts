"use server";

import { z } from "zod";
import { requestClientPasswordReset } from "@/server/services/request-client-password-reset";
import { actionFailure, actionSuccess, parseActionInput } from "./action-utils";

const RequestPasswordResetSchema = z.object({
  email: z.email(),
});

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

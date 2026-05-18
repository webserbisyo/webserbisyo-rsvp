"use server";

import { PublicRsvpResponseSchema } from "@/lib/validations/rsvp-response.schema";
import { submitRsvpResponse } from "@/server/services/submit-rsvp-response";
import { actionFailure, actionSuccess, parseActionInput } from "./action-utils";

export async function submitRsvpResponseAction(input: unknown) {
  try {
    const payload = parseActionInput(PublicRsvpResponseSchema, input);
    const response = await submitRsvpResponse(payload);

    return actionSuccess({
      responseId: response.id,
      submittedAt: response.submitted_at,
    });
  } catch (error) {
    return actionFailure(error);
  }
}

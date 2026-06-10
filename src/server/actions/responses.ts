"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireTenantMember } from "@/lib/permissions";
import { moderateResponseGuestbookMessages } from "@/server/services/moderate-response-guestbook";
import { moderateRsvpResponses } from "@/server/services/moderate-rsvp-response";
import { submitRsvpResponse } from "@/server/services/submit-rsvp-response";
import { actionFailure, actionSuccess, parseActionInput, toPlainInput } from "./action-utils";

const ResponseGuestbookModerationSchema = z.object({
  responseIds: z.array(z.string().uuid()).min(1).max(100),
});

const RsvpModerationSchema = z.object({
  mode: z.enum(["approve", "reject"]),
  responseIds: z.array(z.string().uuid()).min(1).max(100),
});

export async function submitRsvpResponseAction(input: unknown) {
  try {
    const response = await submitRsvpResponse(toPlainInput(input));

    if (!response) {
      throw new Error("Failed to submit RSVP response.");
    }

    return actionSuccess({
      responseId: response.id,
      submittedAt: response.submitted_at,
    });
  } catch (error) {
    return actionFailure(error);
  }
}

export async function moderateRsvpResponsesAction(input: unknown) {
  try {
    const profile = await requireTenantMember();
    const payload = parseActionInput(RsvpModerationSchema, input);
    const result = await moderateRsvpResponses({
      actorUserId: profile.id,
      clientId: profile.client_id ?? "",
      mode: payload.mode,
      responseIds: payload.responseIds,
    });

    revalidatePath("/dashboard/responses");
    revalidatePath("/dashboard");

    return actionSuccess(result);
  } catch (error) {
    return actionFailure(error);
  }
}

export async function showResponseMessagesInGuestbookAction(input: unknown) {
  try {
    const profile = await requireTenantMember();
    const payload = parseActionInput(ResponseGuestbookModerationSchema, input);
    const result = await moderateResponseGuestbookMessages({
      actorUserId: profile.id,
      clientId: profile.client_id ?? "",
      mode: "approve",
      responseIds: payload.responseIds,
    });

    revalidatePath("/dashboard/responses");
    revalidatePath("/dashboard/event");
    revalidatePath("/dashboard");
    revalidatePath(`/r/${result.currentEventSlug}`);
    revalidatePath("/");

    return actionSuccess(result);
  } catch (error) {
    return actionFailure(error);
  }
}

export async function removeResponseMessagesFromGuestbookAction(input: unknown) {
  try {
    const profile = await requireTenantMember();
    const payload = parseActionInput(ResponseGuestbookModerationSchema, input);
    const result = await moderateResponseGuestbookMessages({
      actorUserId: profile.id,
      clientId: profile.client_id ?? "",
      mode: "remove",
      responseIds: payload.responseIds,
    });

    revalidatePath("/dashboard/responses");
    revalidatePath("/dashboard/event");
    revalidatePath("/dashboard");
    revalidatePath(`/r/${result.currentEventSlug}`);
    revalidatePath("/");

    return actionSuccess(result);
  } catch (error) {
    return actionFailure(error);
  }
}

"use server";

import { z } from "zod";
import { requireAdmin } from "@/lib/permissions";
import { sendOnboardingEmail } from "@/server/services/send-onboarding-email";
import { actionFailure, actionSuccess, parseActionInput } from "./action-utils";

const SendOnboardingEmailActionSchema = z.object({
  applicationId: z.uuid().optional(),
  clientId: z.uuid(),
  eventId: z.uuid(),
  recipientEmail: z.string().email(),
  recipientName: z.string().trim().max(200).optional(),
  temporaryPassword: z.string().min(12),
});

export async function sendEmailAction(input: unknown) {
  try {
    await requireAdmin();
    const payload = parseActionInput(SendOnboardingEmailActionSchema, input);
    const emailLog = await sendOnboardingEmail(payload);

    return actionSuccess({
      emailLogId: emailLog.id,
      status: emailLog.status,
    });
  } catch (error) {
    return actionFailure(error);
  }
}

"use server";

import { z } from "zod";
import { requireAdmin } from "@/lib/permissions";
import { sendClientPasswordSetup } from "@/server/services/send-client-password-setup";
import { actionFailure, actionSuccess, parseActionInput } from "./action-utils";

const SendOnboardingEmailActionSchema = z.object({
  applicationId: z.uuid().optional(),
  clientId: z.uuid(),
  eventId: z.uuid(),
  recipientName: z.string().trim().max(200).optional(),
});

export async function sendEmailAction(input: unknown) {
  try {
    const admin = await requireAdmin();
    const payload = parseActionInput(SendOnboardingEmailActionSchema, input);
    const emailLog = await sendClientPasswordSetup({
      ...payload,
      actorUserId: admin.id,
    });

    return actionSuccess({
      emailLogId: emailLog.id,
      status: emailLog.status,
    });
  } catch (error) {
    return actionFailure(error);
  }
}

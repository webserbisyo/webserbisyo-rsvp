"use server";

import { ApplicationSchema } from "@/lib/validations/application.schema";
import { submitApplication } from "@/server/services/submit-application";
import { actionFailure, actionSuccess, parseActionInput } from "./action-utils";

export async function submitApplicationAction(input: unknown) {
  try {
    const payload = parseActionInput(ApplicationSchema, input);
    const application = await submitApplication(payload);

    return actionSuccess({
      applicationId: application.id,
      preferredManualPaymentOption: application.preferred_manual_payment_option,
      referenceCode: application.reference_code,
      status: application.status,
    });
  } catch (error) {
    return actionFailure(error);
  }
}

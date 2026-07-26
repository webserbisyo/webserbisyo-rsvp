"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/permissions";
import { ReviewApplicationSchema } from "@/lib/validations/approval.schema";
import { reviewApplication } from "@/server/services/review-application";
import { actionFailure, actionSuccess, parseActionInput } from "./action-utils";

export async function reviewApplicationAction(input: unknown) {
  try {
    const admin = await requireAdmin();
    const payload = parseActionInput(ReviewApplicationSchema, input);
    const application = await reviewApplication(payload, admin.id);

    revalidatePath("/admin");

    return actionSuccess({
      applicationId: application.id,
      status: application.status,
    });
  } catch (error) {
    return actionFailure(error);
  }
}

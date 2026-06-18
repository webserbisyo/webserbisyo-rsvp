"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/permissions";
import { ApprovalSchema, ReviewApplicationSchema } from "@/lib/validations/approval.schema";
import { approveApplication } from "@/server/services/approve-application";
import { reviewApplication } from "@/server/services/review-application";
import { actionFailure, actionSuccess, parseActionInput } from "./action-utils";

export async function approveApplicationAction(input: unknown) {
  try {
    const admin = await requireAdmin();
    const payload = parseActionInput(ApprovalSchema, input);
    const requestHeaders = await headers();
    const clientIpAddress =
      requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      requestHeaders.get("x-real-ip") ??
      null;
    const clientUserAgent = requestHeaders.get("user-agent") ?? null;
    const result = await approveApplication(payload, admin.id, { clientIpAddress, clientUserAgent });

    revalidatePath("/admin");
    revalidatePath("/admin/clients");
    revalidatePath("/admin/sales");

    return actionSuccess({
      applicationId: result.application.id,
      clientId: result.client.id,
      eventId: result.event.id,
      paymentId: result.payment.id,
    });
  } catch (error) {
    return actionFailure(error);
  }
}

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

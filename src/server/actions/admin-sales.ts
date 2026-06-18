"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/permissions";
import {
  ConfirmManualPaymentSchema,
  TransitionPaymentStatusSchema,
} from "@/lib/validations/admin-workflow.schema";
import {
  confirmManualPayment,
  transitionPaymentStatus,
} from "@/server/services/admin-workflow/payments";
import { actionFailure, actionSuccess, parseActionInput } from "./action-utils";

export async function confirmManualPaymentAction(input: unknown) {
  try {
    const admin = await requireAdmin();
    const payload = parseActionInput(ConfirmManualPaymentSchema, input);
    const requestHeaders = await headers();
    const clientIpAddress =
      requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      requestHeaders.get("x-real-ip") ??
      null;
    const clientUserAgent = requestHeaders.get("user-agent") ?? null;
    const result = await confirmManualPayment(payload, admin.id, { clientIpAddress, clientUserAgent });

    revalidatePaymentRoutes(result.client.id);

    return actionSuccess({
      clientId: result.client.id,
      paymentId: result.payment.id,
      status: result.payment.payment_status,
    });
  } catch (error) {
    return actionFailure(error);
  }
}

export async function transitionPaymentStatusAction(input: unknown) {
  try {
    const admin = await requireAdmin();
    const payload = parseActionInput(TransitionPaymentStatusSchema, input);
    const payment = await transitionPaymentStatus(payload, admin.id);

    revalidatePaymentRoutes(payment.client_id);

    return actionSuccess({
      paymentId: payment.id,
      status: payment.payment_status,
    });
  } catch (error) {
    return actionFailure(error);
  }
}

function revalidatePaymentRoutes(clientId?: string | null) {
  revalidatePath("/admin");
  revalidatePath("/admin/applications");
  revalidatePath("/admin/clients");
  if (clientId) {
    revalidatePath(`/admin/clients/${clientId}`);
  }
  revalidatePath("/admin/sales");
}

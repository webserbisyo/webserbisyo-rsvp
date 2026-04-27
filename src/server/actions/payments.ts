"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/permissions";
import { PlanTypeSchema } from "@/lib/validations/application.schema";
import { recordOneTimePayment } from "@/server/services/record-one-time-payment";
import { actionFailure, actionSuccess, parseActionInput } from "./action-utils";

const RecordPaymentActionSchema = z.object({
  amountDue: z.coerce.number().nonnegative(),
  amountPaid: z.coerce.number().positive(),
  applicationId: z.uuid(),
  clientId: z.uuid(),
  eventId: z.uuid(),
  hostingEndsAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  hostingStartsAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  notes: z.string().trim().max(2000).optional(),
  paidAt: z.string().datetime({ offset: true }).optional(),
  paymentMethod: z.string().trim().max(100).optional(),
  planType: PlanTypeSchema,
  referenceNumber: z.string().trim().max(200).optional(),
  renewalRequiredAt: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
});

export async function recordPaymentAction(input: unknown) {
  try {
    const admin = await requireAdmin();
    const payload = parseActionInput(RecordPaymentActionSchema, input);
    const payment = await recordOneTimePayment({
      ...payload,
      actorUserId: admin.id,
    });

    revalidatePath("/admin/sales");
    revalidatePath("/admin/clients");

    return actionSuccess({
      paymentId: payment.id,
      status: payment.payment_status,
    });
  } catch (error) {
    return actionFailure(error);
  }
}

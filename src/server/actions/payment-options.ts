"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/permissions";
import { PaymentOptionsSchema } from "@/lib/validations/payment-options.schema";
import { savePlatformPaymentOptions } from "@/server/services/save-platform-payment-options";
import { actionFailure, actionSuccess, parseActionInput } from "./action-utils";

export async function savePaymentOptionsAction(input: unknown) {
  try {
    const admin = await requireAdmin();
    const payload = parseActionInput(PaymentOptionsSchema, input);
    const result = await savePlatformPaymentOptions(payload, admin.id);

    revalidatePath("/admin/payment-options");
    revalidatePath("/apply");
    revalidatePath("/apply/start");

    return actionSuccess(result);
  } catch (error) {
    return actionFailure(error);
  }
}

"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/permissions";
import { SavePackageSettingsSchema } from "@/lib/validations/admin-workflow.schema";
import { savePackageSettings } from "@/server/services/admin-workflow/package-settings";
import { actionFailure, actionSuccess, parseActionInput } from "./action-utils";

export async function savePackageSettingsAction(input: unknown) {
  try {
    const admin = await requireAdmin();
    const payload = parseActionInput(SavePackageSettingsSchema, input);
    const result = await savePackageSettings(payload, admin.id);

    revalidatePath("/admin");
    revalidatePath("/admin/applications");
    revalidatePath("/admin/sales");
    revalidatePath("/admin/settings");

    return actionSuccess(result);
  } catch (error) {
    return actionFailure(error);
  }
}

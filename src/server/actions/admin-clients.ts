"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/permissions";
import {
  ArchiveClientSchema,
  ResendOnboardingSchema,
  RestoreClientSchema,
} from "@/lib/validations/admin-workflow.schema";
import {
  archiveClient,
  resendClientOnboarding,
  restoreClient,
} from "@/server/services/admin-workflow/clients";
import { actionFailure, actionSuccess, parseActionInput } from "./action-utils";

export async function archiveClientAction(input: unknown) {
  try {
    const admin = await requireAdmin();
    const payload = parseActionInput(ArchiveClientSchema, input);
    const client = await archiveClient(payload, admin.id);

    revalidateClientRoutes(client.id);

    return actionSuccess({
      clientId: client.id,
      status: client.status,
    });
  } catch (error) {
    return actionFailure(error);
  }
}

export async function restoreClientAction(input: unknown) {
  try {
    const admin = await requireAdmin();
    const payload = parseActionInput(RestoreClientSchema, input);
    const client = await restoreClient(payload, admin.id);

    revalidateClientRoutes(client.id);

    return actionSuccess({
      clientId: client.id,
      status: client.status,
    });
  } catch (error) {
    return actionFailure(error);
  }
}

export async function resendClientOnboardingAction(input: unknown) {
  try {
    const admin = await requireAdmin();
    const payload = parseActionInput(ResendOnboardingSchema, input);
    const emailLog = await resendClientOnboarding(payload, admin.id);

    revalidateClientRoutes(payload.clientId);

    return actionSuccess({
      clientId: payload.clientId,
      emailLogId: emailLog.id,
      status: emailLog.status,
    });
  } catch (error) {
    return actionFailure(error);
  }
}

function revalidateClientRoutes(clientId: string) {
  revalidatePath("/admin");
  revalidatePath("/admin/clients");
  revalidatePath(`/admin/clients/${clientId}`);
  revalidatePath("/admin/sales");
}

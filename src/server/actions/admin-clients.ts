"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/permissions";
import {
  ArchiveClientSchema,
  BulkArchiveClientsSchema,
  BulkCancelClientsSchema,
  BulkDeleteClientsSchema,
  BulkMarkClientsPaidSchema,
  BulkRefundClientsSchema,
  CancelClientSchema,
  CheckCustomWebsiteOriginHealthSchema,
  DeleteClientSchema,
  DisableCustomWebsiteSchema,
  EnableCustomWebsiteSchema,
  MarkClientPaidSchema,
  RefundClientPaymentSchema,
  ResendOnboardingSchema,
  RestoreClientSchema,
  SaveCustomFrontendOriginSchema,
} from "@/lib/validations/admin-workflow.schema";
import {
  archiveClient,
  bulkArchiveClients,
  bulkCancelClients,
  bulkDeleteClients,
  bulkMarkClientsAsPaid,
  bulkRefundClientPayments,
  cancelClient,
  deleteClient,
  markClientAsPaid,
  refundClientPayment,
  resendClientOnboarding,
  restoreClient,
} from "@/server/services/admin-workflow/clients";
import {
  disableCustomWebsite,
  enableCustomWebsite,
  saveCustomFrontendOrigin,
} from "@/server/services/admin-workflow/custom-websites";
import { checkCustomWebsiteOriginHealth } from "@/server/services/custom-websites/custom-website-health";
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

export async function markClientPaidAction(input: unknown) {
  try {
    const admin = await requireAdmin();
    const payload = parseActionInput(MarkClientPaidSchema, input);
    const result = await markClientAsPaid(payload, admin.id);

    revalidateClientRoutes(result.data.clientId);

    return actionSuccess({
      clientId: result.data.clientId,
      paymentId: result.data.paymentId,
      status: result.data.status,
      warnings: result.warnings,
    });
  } catch (error) {
    return actionFailure(error);
  }
}

export async function cancelClientAction(input: unknown) {
  try {
    const admin = await requireAdmin();
    const payload = parseActionInput(CancelClientSchema, input);
    const result = await cancelClient(payload, admin.id);

    revalidateClientRoutes(result.data.clientId);

    return actionSuccess({
      clientId: result.data.clientId,
      status: result.data.status,
      warnings: result.warnings,
    });
  } catch (error) {
    return actionFailure(error);
  }
}

export async function bulkMarkClientsPaidAction(input: unknown) {
  try {
    const admin = await requireAdmin();
    const payload = parseActionInput(BulkMarkClientsPaidSchema, input);
    const result = await bulkMarkClientsAsPaid(payload, admin.id);

    revalidateBulkClientRoutes(payload.clientIds);

    return actionSuccess(result);
  } catch (error) {
    return actionFailure(error);
  }
}

export async function bulkCancelClientsAction(input: unknown) {
  try {
    const admin = await requireAdmin();
    const payload = parseActionInput(BulkCancelClientsSchema, input);
    const result = await bulkCancelClients(payload, admin.id);

    revalidateBulkClientRoutes(payload.clientIds);

    return actionSuccess(result);
  } catch (error) {
    return actionFailure(error);
  }
}

export async function bulkArchiveClientsAction(input: unknown) {
  try {
    const admin = await requireAdmin();
    const payload = parseActionInput(BulkArchiveClientsSchema, input);
    const result = await bulkArchiveClients(payload, admin.id);

    revalidateBulkClientRoutes(payload.clientIds);

    return actionSuccess(result);
  } catch (error) {
    return actionFailure(error);
  }
}

export async function deleteClientAction(input: unknown) {
  try {
    const admin = await requireAdmin();
    const payload = parseActionInput(DeleteClientSchema, input);
    const result = await deleteClient(payload, admin.id);

    revalidatePath("/admin");
    revalidatePath("/admin/clients");
    revalidatePath(`/admin/clients/${payload.clientId}`);

    return actionSuccess(result.data);
  } catch (error) {
    return actionFailure(error);
  }
}

export async function bulkDeleteClientsAction(input: unknown) {
  try {
    const admin = await requireAdmin();
    const payload = parseActionInput(BulkDeleteClientsSchema, input);
    const result = await bulkDeleteClients(payload, admin.id);

    revalidateBulkClientRoutes(payload.clientIds);

    return actionSuccess(result);
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
    const result = await resendClientOnboarding(payload, admin.id);

    revalidateClientRoutes(payload.clientId);

    return actionSuccess({
      clientId: payload.clientId,
      emailLogId: result.data.emailLogId,
      status: result.data.status,
      warnings: result.warnings,
    });
  } catch (error) {
    return actionFailure(error);
  }
}

export async function refundClientPaymentAction(input: unknown) {
  try {
    const admin = await requireAdmin();
    const payload = parseActionInput(RefundClientPaymentSchema, input);
    const result = await refundClientPayment(payload, admin.id);

    revalidateClientRoutes(payload.clientId);

    return actionSuccess({
      clientId: result.data.clientId,
      paymentId: result.data.paymentId,
      refundId: result.data.refundId,
      status: result.data.status,
      warnings: result.warnings,
    });
  } catch (error) {
    return actionFailure(error);
  }
}

export async function bulkRefundClientPaymentsAction(input: unknown) {
  try {
    const admin = await requireAdmin();
    const payload = parseActionInput(BulkRefundClientsSchema, input);
    const result = await bulkRefundClientPayments(payload, admin.id);

    revalidateBulkClientRoutes(payload.clientIds);

    return actionSuccess(result);
  } catch (error) {
    return actionFailure(error);
  }
}

export async function saveCustomFrontendOriginAction(input: unknown) {
  try {
    const admin = await requireAdmin();
    const payload = parseActionInput(SaveCustomFrontendOriginSchema, input);
    const result = await saveCustomFrontendOrigin(payload, admin.id);

    revalidateClientRoutes(payload.clientId);

    return actionSuccess({
      clientId: result.client_id,
      customFrontendEnabled: result.custom_frontend_enabled,
      eventId: result.event_id,
      id: result.id,
      status: result.status,
    });
  } catch (error) {
    return actionFailure(error);
  }
}

export async function enableCustomWebsiteAction(input: unknown) {
  try {
    const admin = await requireAdmin();
    const payload = parseActionInput(EnableCustomWebsiteSchema, input);
    const result = await enableCustomWebsite(payload, admin.id);

    revalidateClientRoutes(payload.clientId);

    return actionSuccess({
      clientId: result.client_id,
      customFrontendEnabled: result.custom_frontend_enabled,
      eventId: result.event_id,
      id: result.id,
      status: result.status,
    });
  } catch (error) {
    return actionFailure(error);
  }
}

export async function disableCustomWebsiteAction(input: unknown) {
  try {
    const admin = await requireAdmin();
    const payload = parseActionInput(DisableCustomWebsiteSchema, input);
    const result = await disableCustomWebsite(payload, admin.id);

    revalidateClientRoutes(payload.clientId);

    return actionSuccess({
      clientId: result.client_id,
      customFrontendEnabled: result.custom_frontend_enabled,
      eventId: result.event_id,
      id: result.id,
      status: result.status,
    });
  } catch (error) {
    return actionFailure(error);
  }
}

export async function checkCustomWebsiteOriginHealthAction(input: unknown) {
  try {
    await requireAdmin();
    const payload = parseActionInput(CheckCustomWebsiteOriginHealthSchema, input);
    const result = await checkCustomWebsiteOriginHealth(payload);

    revalidateClientRoutes(payload.clientId);

    return actionSuccess({
      clientId: result.client_id,
      eventId: result.event_id,
      id: result.id,
      lastHealthCheckedAt: result.last_health_checked_at,
      lastHealthError: result.last_health_error,
      lastOriginResponseMs: result.last_origin_response_ms,
      lastOriginStatusCode: result.last_origin_status_code,
      status: result.status,
      healthStatus: result.last_health_status,
    });
  } catch (error) {
    return actionFailure(error);
  }
}

function revalidateClientRoutes(clientId: string) {
  revalidatePath("/admin");
  revalidatePath("/admin/clients");
  revalidatePath(`/admin/clients/${clientId}`);
}

function revalidateBulkClientRoutes(clientIds: string[]) {
  revalidatePath("/admin");
  revalidatePath("/admin/clients");

  for (const clientId of new Set(clientIds)) {
    revalidatePath(`/admin/clients/${clientId}`);
  }
}

import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import type { TablesInsert } from "@/lib/supabase/types";
import type {
  ArchiveClientInput,
  BulkArchiveClientsInput,
  BulkCancelClientsInput,
  BulkDeleteClientsInput,
  BulkMarkClientsPaidInput,
  BulkRefundClientsInput,
  CancelClientInput,
  DeleteClientInput,
  MarkClientPaidInput,
  RefundClientPaymentInput,
  ResendOnboardingInput,
  RestoreClientInput,
} from "@/lib/validations/admin-workflow.schema";
import {
  ServiceError,
  assertServiceData,
  assertServiceSuccess,
} from "@/server/services/service-error";
import { sendOnboardingEmail } from "@/server/services/send-onboarding-email";
import { sendMetaCapiPurchase } from "@/server/services/send-meta-capi-purchase";
import { writeAuditLog } from "@/server/services/write-audit-log";
import { ensureOwnerProfileForClient } from "./provisioning";
import { calculateHostingCoverage } from "./hosting";
import {
  type ClientPaymentDisplayStatus,
  type DeleteEligibilityReasonCode,
  deriveClientPaymentStatus,
  deriveDeleteEligibility,
} from "./client-rules";
import { getPackageSettingsMap } from "./package-settings";

type ClientActionResult<T> = {
  data: T;
  warnings: string[];
};

type ClientPaymentResult = {
  clientId: string;
  paymentId: string;
  status: string;
};

type ClientCancelResult = {
  clientId: string;
  status: string;
};

type ClientOnboardingResult = {
  clientId: string;
  emailLogId: string | null;
  status: string | undefined;
};

type ClientDeleteResult = {
  clientId: string;
  deleted: boolean;
  mode: DeleteExecutionMode;
  tombstoneId: string;
};

type ClientRefundResult = {
  clientId: string;
  paymentId: string;
  refundId: string;
  status: string;
};

type DeleteEligibilitySnapshot = {
  deleteEligible: boolean;
  deleteEligibleAt: string | null;
  eventPassed: boolean;
  hasPaidNonRefundedPayment: boolean;
  hasRefundedPaymentHistory: boolean;
  hostingExpired: boolean;
  reasonCode: DeleteEligibilityReasonCode;
  reason: string;
};

type DeleteExecutionMode = "normal" | "force";

type BulkClientActionResultItem = {
  clientId: string;
  mode?: DeleteExecutionMode;
  warnings: string[];
};

export type BulkClientActionResult = {
  failed: Array<{ clientId: string; error: string }>;
  forceDeletedCount?: number;
  failedCount?: number;
  normalDeletedCount?: number;
  selectedCount?: number;
  skippedCount?: number;
  skipped: Array<{ clientId: string; reason: string }>;
  succeeded: BulkClientActionResultItem[];
  total: number;
};

type BulkDeleteClientActionResult = BulkClientActionResult & {
  failedCount: number;
  forceDeletedCount: number;
  normalDeletedCount: number;
  selectedCount: number;
  skippedCount: number;
};

type ClientDeleteSnapshot = {
  application: Awaited<ReturnType<typeof getApprovedApplicationForClient>>;
  client: Awaited<ReturnType<typeof getClientForLifecycle>>;
  eligibility: DeleteEligibilitySnapshot;
  eventResponseCount: number;
  events: Awaited<ReturnType<typeof getEventsForClient>>;
  paymentStatus: ClientPaymentDisplayStatus;
  payments: Awaited<ReturnType<typeof getPaymentsForClientOrApplication>>;
  refunds: Awaited<ReturnType<typeof getRefundsForClient>>;
};

type DeletePermissionDecision =
  | {
      allowed: false;
      reason: string;
    }
  | {
      allowed: true;
      mode: DeleteExecutionMode;
      reasonCode: DeleteEligibilityReasonCode;
    };

export async function archiveClient(input: ArchiveClientInput, actorUserId: string) {
  const supabase = createAdminClient();
  const client = await getClientForLifecycle(input.clientId);

  if (client.status === "archived" && client.archived_at) {
    return client;
  }

  const archivedAt = new Date().toISOString();
  const { data, error } = await supabase
    .from("clients")
    .update({
      archived_at: archivedAt,
      notes: appendLifecycleNote(client.notes, "Archived", input.note),
      status: "archived",
    })
    .eq("id", client.id)
    .select("*")
    .single();

  assertServiceSuccess(error, "Failed to archive the client.");
  assertServiceData(data, "Client archive update returned no row.");

  await safeWriteAuditLog({
    action: "client_archived",
    actorUserId,
    clientId: client.id,
    entityId: client.id,
    entityType: "clients",
    metadata: {
      note: input.note,
      previous_status: client.status,
      timestamp: archivedAt,
    },
  });

  return data;
}

export async function markClientAsPaid(
  input: MarkClientPaidInput,
  actorUserId: string,
  context?: { clientIpAddress?: string | null; clientUserAgent?: string | null },
): Promise<ClientActionResult<ClientPaymentResult>> {
  const supabase = createAdminClient();
  const warnings: string[] = [];
  const client = await getClientForLifecycle(input.clientId);

  if (client.status === "archived" || client.status === "cancelled") {
    throw new ServiceError("Archived or cancelled clients cannot be marked as paid.");
  }

  const [application, event, packageSettingsMap] = await Promise.all([
    getApprovedApplicationForClient(client.id),
    getPrimaryEventForClient(client.id),
    getPackageSettingsMap(),
  ]);

  assertServiceData(
    application,
    "An approved application is required before payment can be confirmed.",
  );

  const existingPayment = await getPaymentForClientOrApplication(client.id, application.id);
  const planType = normalizePlanType(client.plan_type || application.preferred_plan);
  const packageSettings = packageSettingsMap.get(planType);
  const paidAt = input.paidAt ?? new Date().toISOString();
  const amountDue = input.amountDue ?? packageSettings?.default_amount ?? input.amountPaid;
  const paymentMethod = resolvePaymentMethod(
    existingPayment?.payment_method ?? null,
    application.preferred_manual_payment_option ?? null,
    input.paymentMethod,
  );
  const coverage =
    packageSettings?.is_active &&
    packageSettings.default_hosting_days !== null &&
    packageSettings.renewal_notice_days !== null
      ? calculateHostingCoverage({
          defaultHostingDays: packageSettings.default_hosting_days,
          paidAt,
          renewalNoticeDays: packageSettings.renewal_notice_days,
        })
      : null;

  if (!coverage) {
    warnings.push(
      "Package access duration is not configured, so website access remains Not configured.",
    );
  }

  if (existingPayment?.payment_status === "paid") {
    throw new ServiceError("This client already has a confirmed paid payment.");
  }

  if (existingPayment?.payment_status === "refunded") {
    throw new ServiceError("Refunded payments must be handled through refund records.");
  }

  const paymentPayload = {
    amount_due: amountDue,
    amount_paid: input.amountPaid,
    application_id: application.id,
    client_id: client.id,
    confirmed_by: actorUserId,
    currency: packageSettings?.currency ?? "PHP",
    event_id: event.id,
    hosting_ends_at: coverage?.hostingEndsAt ?? null,
    hosting_starts_at: coverage?.hostingStartsAt ?? null,
    notes: mergeNotes(existingPayment?.notes ?? null, input.note),
    paid_at: paidAt,
    payment_method: paymentMethod,
    payment_status: "paid",
    plan_type: planType,
    reference_number: input.referenceNumber ?? null,
    renewal_required_at: coverage?.renewalRequiredAt ?? null,
  } satisfies TablesInsert<"payments">;

  const { data: payment, error: paymentError } = existingPayment
    ? await supabase
        .from("payments")
        .update(paymentPayload)
        .eq("id", existingPayment.id)
        .select("*")
        .single()
    : await supabase.from("payments").insert(paymentPayload).select("*").single();

  assertServiceSuccess(paymentError, "Failed to confirm the client payment.");
  assertServiceData(payment, "Payment confirmation returned no row.");

  const clientUpdate = coverage
    ? {
        hosting_ends_at: coverage.hostingEndsAt,
        hosting_starts_at: coverage.hostingStartsAt,
        renewal_required_at: coverage.renewalRequiredAt,
        status: "active",
      }
    : {
        status: "active",
      };

  const { error: clientError } = await supabase
    .from("clients")
    .update(clientUpdate)
    .eq("id", client.id);

  assertServiceSuccess(clientError, "Failed to update the client payment state.");

  const auditWarning = await safeWriteAuditLog({
    action: "payment_confirmed",
    actorUserId,
    clientId: client.id,
    entityId: payment.id,
    entityType: "payments",
    eventId: event.id,
    metadata: {
      application_id: application.id,
      amount_due: payment.amount_due,
      amount_paid: payment.amount_paid,
      client_id: client.id,
      event_id: event.id,
      payment_method: payment.payment_method,
      plan_type: payment.plan_type,
      reference_number: payment.reference_number,
      status_after: "paid",
      status_before: existingPayment?.payment_status ?? "missing",
      timestamp: paidAt,
    },
  });

  if (auditWarning) {
    warnings.push(auditWarning);
  }

  const capiSourceUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? "https://webserbisyo-rsvp.vercel.app"}/apply/success`;
  const capiWarning = await safeSendMetaCapiPurchase({
    actorUserId,
    amount: payment.amount_paid,
    clientId: client.id,
    clientIpAddress: context?.clientIpAddress ?? null,
    clientUserAgent: context?.clientUserAgent ?? null,
    customerEmail: application.email,
    customerFullName: application.full_name,
    customerPhone: application.phone,
    eventId: event.id,
    externalId: application.reference_code,
    fbc: application.fb_fbc,
    fbp: application.fb_fbp,
    paymentId: payment.id,
    sourceUrl: capiSourceUrl,
  });

  if (capiWarning) {
    warnings.push(capiWarning);
  }

  return {
    data: {
      clientId: client.id,
      paymentId: payment.id,
      status: payment.payment_status,
    },
    warnings,
  };
}

export async function cancelClient(
  input: CancelClientInput,
  actorUserId: string,
): Promise<ClientActionResult<ClientCancelResult>> {
  const supabase = createAdminClient();
  const warnings: string[] = [];
  const client = await getClientForLifecycle(input.clientId);

  if (client.status === "archived") {
    throw new ServiceError("Archived clients cannot be cancelled.");
  }

  if (client.status === "cancelled") {
    return {
      data: {
        clientId: client.id,
        status: client.status,
      },
      warnings,
    };
  }

  const [application, event] = await Promise.all([
    getApprovedApplicationForClient(client.id),
    getPrimaryEventForClient(client.id),
  ]);
  const payments = await getPaymentsForClientOrApplication(client.id, application?.id ?? null);

  if (payments.some((payment) => payment.payment_status === "paid")) {
    throw new ServiceError("Clients with paid payments cannot be cancelled.");
  }

  if (payments.some((payment) => payment.payment_status === "refunded")) {
    throw new ServiceError("Refunded payment histories cannot be cancelled.");
  }

  const latestPayment = selectLatestPayment(payments);

  if (latestPayment) {
    const { error: paymentError } = await supabase
      .from("payments")
      .update({
        notes: mergeNotes(latestPayment.notes, input.note),
        payment_status: "cancelled",
      })
      .eq("id", latestPayment.id);

    assertServiceSuccess(paymentError, "Failed to cancel the client payment path.");
  }

  const cancelledAt = new Date().toISOString();
  const { data, error } = await supabase
    .from("clients")
    .update({
      archived_at: null,
      cancelled_at: cancelledAt,
      notes: input.note ? appendLifecycleNote(client.notes, "Cancelled", input.note) : client.notes,
      status: "cancelled",
    })
    .eq("id", client.id)
    .select("*")
    .single();

  assertServiceSuccess(error, "Failed to cancel the client.");
  assertServiceData(data, "Client cancellation returned no row.");

  const auditWarning = await safeWriteAuditLog({
    action: "client_cancelled",
    actorUserId,
    clientId: client.id,
    entityId: client.id,
    entityType: "clients",
    eventId: event.id,
    metadata: {
      application_id: application?.id ?? null,
      client_id: client.id,
      event_id: event.id,
      note: input.note ?? null,
      payment_id: latestPayment?.id ?? null,
      payment_status_before: latestPayment?.payment_status ?? null,
      status_after: "cancelled",
      status_before: client.status,
      timestamp: cancelledAt,
    },
  });

  if (auditWarning) {
    warnings.push(auditWarning);
  }

  return {
    data: {
      clientId: data.id,
      status: data.status,
    },
    warnings,
  };
}

export async function refundClientPayment(
  input: RefundClientPaymentInput,
  actorUserId: string,
): Promise<ClientActionResult<ClientRefundResult>> {
  const supabase = createAdminClient();
  const warnings: string[] = [];
  const client = await getClientForLifecycle(input.clientId);
  const payment = await getLatestRefundablePaymentForClient(client.id);

  if (!payment) {
    throw new ServiceError("A paid client payment is required before refunding.");
  }

  const application = await getApprovedApplicationForClient(client.id);
  const paymentMethod = resolvePaymentMethod(
    payment.payment_method ?? null,
    application?.preferred_manual_payment_option ?? null,
    input.paymentMethod,
  );
  const confirmedAt = input.confirmedAt ?? new Date().toISOString();
  const refundAmount = payment.amount_paid;

  if (refundAmount <= 0) {
    throw new ServiceError("A paid amount is required before refunding.");
  }

  const refundPayload: TablesInsert<"payment_refunds"> = {
    amount: refundAmount,
    client_id: client.id,
    confirmed_at: confirmedAt,
    created_by: actorUserId,
    method: paymentMethod,
    metadata: {
      application_id: payment.application_id,
      event_id: payment.event_id,
      payment_status_before: payment.payment_status,
    },
    payment_id: payment.id,
    reason_note: input.note,
    reference_number: input.referenceNumber ?? null,
  };

  const { data: refund, error: refundError } = await supabase
    .from("payment_refunds")
    .insert(refundPayload)
    .select("*")
    .single();

  assertServiceSuccess(refundError, "Failed to record the refund.");
  assertServiceData(refund, "Refund creation returned no row.");

  const { data: updatedPayment, error: paymentError } = await supabase
    .from("payments")
    .update({
      notes: mergeNotes(payment.notes, `[Refunded] ${input.note.trim()}`),
      payment_status: "refunded",
    })
    .eq("id", payment.id)
    .select("*")
    .single();

  assertServiceSuccess(paymentError, "Failed to update the refunded payment.");
  assertServiceData(updatedPayment, "Refunded payment update returned no row.");

  await touchClientActivity(client.id);

  const auditWarning = await safeWriteAuditLog({
    action: "payment_refunded",
    actorUserId,
    clientId: client.id,
    entityId: payment.id,
    entityType: "payments",
    eventId: payment.event_id,
    metadata: {
      amount: refund.amount,
      confirmed_at: refund.confirmed_at,
      method: refund.method,
      note: input.note,
      payment_id: payment.id,
      reference_number: refund.reference_number,
      refund_id: refund.id,
    },
  });

  if (auditWarning) {
    warnings.push(auditWarning);
  }

  return {
    data: {
      clientId: client.id,
      paymentId: payment.id,
      refundId: refund.id,
      status: updatedPayment.payment_status,
    },
    warnings,
  };
}

export async function bulkMarkClientsAsPaid(
  input: BulkMarkClientsPaidInput,
  actorUserId: string,
): Promise<BulkClientActionResult> {
  const clientIds = uniqueIds(input.clientIds);
  const result = createBulkResult(clientIds.length);
  const packageSettingsMap = await getPackageSettingsMap();
  const paidAt = input.paidAt ?? new Date().toISOString();

  for (const [index, clientId] of clientIds.entries()) {
    try {
      const client = await getClientForLifecycle(clientId);

      if (client.status === "archived" || client.status === "cancelled") {
        result.skipped.push({
          clientId,
          reason: "Client is archived or cancelled.",
        });
        continue;
      }

      const application = await getApprovedApplicationForClient(client.id);

      if (!application) {
        result.skipped.push({
          clientId,
          reason: "Approved application is missing.",
        });
        continue;
      }

      const existingPayment = await getPaymentForClientOrApplication(client.id, application.id);
      const displayStatus = deriveClientPaymentStatus({
        clientCancelledAt: client.cancelled_at,
        clientStatus: client.status,
        paymentStatus: existingPayment?.payment_status ?? null,
      });

      if (displayStatus !== "pending") {
        result.skipped.push({
          clientId,
          reason: buildBulkPaymentSkipReason(displayStatus),
        });
        continue;
      }

      const planType = normalizePlanType(client.plan_type || application.preferred_plan);
      const packageSettings = packageSettingsMap.get(planType);

      if (!packageSettings?.is_active || packageSettings.default_amount === null) {
        result.skipped.push({
          clientId,
          reason:
            "Bulk Mark as Paid requires configured package default amounts. Use single Mark as Paid for manual confirmation.",
        });
        continue;
      }

      const referenceNumber = input.referencePrefix?.trim()
        ? `${input.referencePrefix.trim()}-${String(index + 1).padStart(2, "0")}`
        : undefined;

      const paid = await markClientAsPaid(
        {
          amountDue: packageSettings.default_amount,
          amountPaid: packageSettings.default_amount,
          clientId,
          note: input.note,
          paidAt,
          paymentMethod: input.paymentMethod,
          referenceNumber,
        },
        actorUserId,
      );

      result.succeeded.push({
        clientId: paid.data.clientId,
        warnings: paid.warnings,
      });
    } catch (error) {
      result.failed.push({
        clientId,
        error: error instanceof Error ? error.message : "Bulk payment confirmation failed.",
      });
    }
  }

  return result;
}

export async function bulkCancelClients(
  input: BulkCancelClientsInput,
  actorUserId: string,
): Promise<BulkClientActionResult> {
  const clientIds = uniqueIds(input.clientIds);
  const result = createBulkResult(clientIds.length);

  for (const clientId of clientIds) {
    try {
      const client = await getClientForLifecycle(clientId);

      if (client.status === "archived" || client.status === "cancelled") {
        result.skipped.push({
          clientId,
          reason: "Client is already archived or cancelled.",
        });
        continue;
      }

      const application = await getApprovedApplicationForClient(client.id);
      const payments = await getPaymentsForClientOrApplication(client.id, application?.id ?? null);

      if (payments.some((payment) => payment.payment_status === "paid")) {
        result.skipped.push({
          clientId,
          reason: "Clients with paid payments cannot be cancelled.",
        });
        continue;
      }

      if (payments.some((payment) => payment.payment_status === "refunded")) {
        result.skipped.push({
          clientId,
          reason: "Refunded payment histories cannot be cancelled.",
        });
        continue;
      }

      const cancelled = await cancelClient(
        {
          clientId,
          confirmation: input.confirmation,
          note: input.note,
        },
        actorUserId,
      );

      result.succeeded.push({
        clientId: cancelled.data.clientId,
        warnings: cancelled.warnings,
      });
    } catch (error) {
      result.failed.push({
        clientId,
        error: error instanceof Error ? error.message : "Bulk cancellation failed.",
      });
    }
  }

  return result;
}

export async function bulkArchiveClients(
  input: BulkArchiveClientsInput,
  actorUserId: string,
): Promise<BulkClientActionResult> {
  const clientIds = uniqueIds(input.clientIds);
  const result = createBulkResult(clientIds.length);

  for (const clientId of clientIds) {
    try {
      const client = await getClientForLifecycle(clientId);

      if (client.status === "archived" && client.archived_at) {
        result.skipped.push({
          clientId,
          reason: "Client is already archived.",
        });
        continue;
      }

      const archived = await archiveClient(
        {
          clientId,
          note: input.note,
        },
        actorUserId,
      );

      result.succeeded.push({
        clientId: archived.id,
        warnings: [],
      });
    } catch (error) {
      result.failed.push({
        clientId,
        error: error instanceof Error ? error.message : "Bulk archive failed.",
      });
    }
  }

  return result;
}

export async function bulkRefundClientPayments(
  input: BulkRefundClientsInput,
  actorUserId: string,
): Promise<BulkClientActionResult> {
  const clientIds = uniqueIds(input.clientIds);
  const result = createBulkResult(clientIds.length);
  const confirmedAt = input.confirmedAt ?? new Date().toISOString();

  for (const [index, clientId] of clientIds.entries()) {
    try {
      const refund = await refundClientPayment(
        {
          clientId,
          confirmedAt,
          note: input.note ?? "Bulk refund confirmed.",
          paymentMethod: input.paymentMethod,
          referenceNumber: input.referencePrefix?.trim()
            ? `${input.referencePrefix.trim()}-${String(index + 1).padStart(2, "0")}`
            : undefined,
        },
        actorUserId,
      );

      result.succeeded.push({
        clientId: refund.data.clientId,
        warnings: refund.warnings,
      });
    } catch (error) {
      result.failed.push({
        clientId,
        error: error instanceof Error ? error.message : "Bulk refund failed.",
      });
    }
  }

  return result;
}

export async function restoreClient(input: RestoreClientInput, actorUserId: string) {
  const supabase = createAdminClient();
  const client = await getClientForLifecycle(input.clientId);

  if (client.status !== "archived") {
    return client;
  }

  const latestPaidPayment = await getLatestPaidPaymentForClient(client.id);
  const referenceHostingEndsAt = latestPaidPayment?.hosting_ends_at ?? client.hosting_ends_at;
  const restoredStatus =
    referenceHostingEndsAt && new Date(referenceHostingEndsAt).getTime() < Date.now()
      ? "expired"
      : "active";

  const { data, error } = await supabase
    .from("clients")
    .update({
      archived_at: null,
      notes: input.note ? appendLifecycleNote(client.notes, "Restored", input.note) : client.notes,
      status: restoredStatus,
    })
    .eq("id", client.id)
    .select("*")
    .single();

  assertServiceSuccess(error, "Failed to restore the client.");
  assertServiceData(data, "Client restore update returned no row.");

  await safeWriteAuditLog({
    action: "client_restored",
    actorUserId,
    clientId: client.id,
    entityId: client.id,
    entityType: "clients",
    metadata: {
      next_status: restoredStatus,
      note: input.note ?? null,
    },
  });

  return data;
}

export async function resendClientOnboarding(input: ResendOnboardingInput, actorUserId: string) {
  const client = await getClientForLifecycle(input.clientId);
  const ownerProfile = await getOwnerProfileForClient(client.id);
  const event = await getPrimaryEventForClient(client.id);
  const application = await getApprovedApplicationForClient(client.id);
  const defaultRecipientEmail = ownerProfile?.email ?? client.contact_email;
  const recipientEmail = input.recipientEmail ?? defaultRecipientEmail;
  const accessEmail = ownerProfile?.email ?? client.contact_email;
  const ownerSetup = await ensureOwnerProfileForClient({
    accessMode: "temporary_password",
    clientId: client.id,
    email: accessEmail,
    fullName: ownerProfile?.full_name ?? client.contact_name ?? client.name,
  });

  if (ownerSetup.warning) {
    throw new ServiceError(ownerSetup.warning);
  }

  if (!ownerSetup.temporaryPassword) {
    throw new ServiceError("A new temporary password could not be generated for this client.");
  }

  const emailLog = await sendOnboardingEmail({
    applicationId: application?.id ?? null,
    clientId: client.id,
    eventId: event.id,
    mode: "password_reset",
    note: input.note ?? null,
    recipientEmail,
    recipientName: ownerProfile?.full_name ?? client.contact_name ?? client.name,
    temporaryPassword: ownerSetup.temporaryPassword,
  });

  await touchClientActivity(client.id);

  const auditWarning = await safeWriteAuditLog({
    action: "client_onboarding_resent",
    actorUserId,
    clientId: client.id,
    entityId: client.id,
    entityType: "clients",
    eventId: event.id,
    metadata: {
      email_log_id: emailLog.id,
      email_log_written: emailLog.logWritten,
      email_status: emailLog.status,
      is_custom_recipient: recipientEmail !== defaultRecipientEmail,
      note_present: Boolean(input.note),
      password_reset: true,
      recipient_email: recipientEmail,
    },
  });

  return {
    data: {
      clientId: client.id,
      emailLogId: emailLog.id,
      status: emailLog.status,
    },
    warnings: [emailLog.warning, auditWarning].filter((warning): warning is string =>
      Boolean(warning),
    ),
  } satisfies ClientActionResult<ClientOnboardingResult>;
}

export async function deleteClient(
  input: DeleteClientInput,
  actorUserId: string,
): Promise<ClientActionResult<ClientDeleteResult>> {
  return deleteClientWithMode(
    {
      clientId: input.clientId,
      force: false,
      note: input.note,
    },
    actorUserId,
  );
}

async function deleteClientWithMode(
  input: {
    clientId: string;
    force: boolean;
    note?: string;
  },
  actorUserId: string,
): Promise<ClientActionResult<ClientDeleteResult>> {
  const supabase = createAdminClient();
  const warnings: string[] = [];
  const snapshot = await loadClientDeleteSnapshot(input.clientId);
  const decision = resolveDeletePermission(snapshot, input.force);

  if (!decision.allowed) {
    throw new ServiceError(decision.reason);
  }

  if (decision.mode === "force") {
    const cleanupWarning = await disableClientAccessForForceDelete(snapshot.client.id, snapshot.events);

    if (cleanupWarning) {
      warnings.push(cleanupWarning);
    }
  }

  const primaryEvent = selectPrimaryEvent(snapshot.events);
  const tombstonePayload: TablesInsert<"client_deletion_tombstones"> = {
    client_email: snapshot.client.contact_email,
    client_name: snapshot.client.name,
    client_status: snapshot.client.status,
    deleted_by: actorUserId,
    deleted_reason:
      input.note ??
      (decision.mode === "force"
        ? "Client force-deleted from admin clients page."
        : "Client deleted from admin clients page."),
    event_date: primaryEvent?.event_date ?? null,
    event_id: primaryEvent?.id ?? null,
    event_slug: primaryEvent?.event_slug ?? null,
    event_type: primaryEvent?.event_type ?? null,
    metadata: {
      application_id: snapshot.application?.id ?? null,
      archived_at: snapshot.client.archived_at,
      cancelled_at: snapshot.client.cancelled_at,
      delete_eligible_at: snapshot.eligibility.deleteEligibleAt,
      delete_eligibility_reason_code: snapshot.eligibility.reasonCode,
      delete_execution_mode: decision.mode,
      event_response_count: snapshot.eventResponseCount,
      payments: snapshot.payments.map((payment) => ({
        amount_due: payment.amount_due,
        amount_paid: payment.amount_paid,
        hosting_ends_at: payment.hosting_ends_at,
        hosting_starts_at: payment.hosting_starts_at,
        id: payment.id,
        paid_at: payment.paid_at,
        payment_method: payment.payment_method,
        payment_status: payment.payment_status,
        reference_number: payment.reference_number,
      })),
      refunds: snapshot.refunds.map((refund) => ({
        amount: refund.amount,
        confirmed_at: refund.confirmed_at,
        id: refund.id,
        method: refund.method,
        payment_id: refund.payment_id,
        reason_note: refund.reason_note,
        reference_number: refund.reference_number,
      })),
    },
    original_client_id: snapshot.client.id,
    payment_status: snapshot.paymentStatus,
    payment_summary: {
      count: snapshot.payments.length,
      ids: snapshot.payments.map((payment) => payment.id),
      refunds_count: snapshot.refunds.length,
      statuses: snapshot.payments.map((payment) => payment.payment_status),
    },
  };

  const { data: tombstone, error: tombstoneError } = await supabase
    .from("client_deletion_tombstones")
    .insert(tombstonePayload)
    .select("*")
    .single();

  assertServiceSuccess(tombstoneError, "Failed to write the client deletion tombstone.");
  assertServiceData(tombstone, "Deletion tombstone insert returned no row.");

  const deletablePayments = snapshot.payments.filter((payment) =>
    ["pending", "cancelled", "failed", "refunded"].includes(payment.payment_status),
  );
  if (deletablePayments.length > 0) {
    const { error: paymentDeleteError } = await supabase
      .from("payments")
      .delete()
      .in(
        "id",
        deletablePayments.map((payment) => payment.id),
      );

    assertServiceSuccess(paymentDeleteError, "Failed to delete linked non-paid payments.");
  }

  const eventIds = snapshot.events.map((event) => event.id);
  const metaPixelFilter =
    eventIds.length > 0
      ? `client_id.eq.${snapshot.client.id},event_id.in.(${eventIds.join(",")})`
      : `client_id.eq.${snapshot.client.id}`;
  const { error: metaPixelDeleteError } = await supabase
    .from("meta_pixels")
    .delete()
    .or(metaPixelFilter);

  assertServiceSuccess(metaPixelDeleteError, "Failed to delete linked Meta Pixel records.");

  if (snapshot.events.length > 0) {
    const { error: eventDeleteError } = await supabase
      .from("rsvp_events")
      .delete()
      .eq("client_id", snapshot.client.id);

    assertServiceSuccess(eventDeleteError, "Failed to delete linked draft RSVP events.");
  }

  const { error: clientDeleteError } = await supabase
    .from("clients")
    .delete()
    .eq("id", snapshot.client.id);

  assertServiceSuccess(clientDeleteError, "Failed to delete the client.");

  const auditWarning = await safeWriteAuditLog({
    action: "client_deleted",
    actorUserId,
    clientId: null,
    entityId: tombstone.id,
    entityType: "client_deletion_tombstones",
    eventId: null,
    metadata: {
      deleted_client_id: snapshot.client.id,
      delete_mode: decision.mode,
      deleted_event_id: primaryEvent?.id ?? null,
      reason: input.note ?? null,
      tombstone_id: tombstone.id,
    },
  });

  if (auditWarning) {
    warnings.push(auditWarning);
  }

  return {
    data: {
      clientId: snapshot.client.id,
      deleted: true,
      mode: decision.mode,
      tombstoneId: tombstone.id,
    },
    warnings,
  };
}

export async function bulkDeleteClients(
  input: BulkDeleteClientsInput,
  actorUserId: string,
): Promise<BulkDeleteClientActionResult> {
  const clientIds = uniqueIds(input.clientIds);
  const result = createBulkDeleteResult(clientIds.length);

  for (const clientId of clientIds) {
    try {
      const deleted = await deleteClientWithMode(
        {
          clientId,
          force: input.force,
          note: input.note,
        },
        actorUserId,
      );

      result.succeeded.push({
        clientId: deleted.data.clientId,
        mode: deleted.data.mode,
        warnings: deleted.warnings,
      });
      if (deleted.data.mode === "force") {
        result.forceDeletedCount += 1;
      } else {
        result.normalDeletedCount += 1;
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Bulk delete failed.";
      if (isDeleteSkipReason(message)) {
        result.skipped.push({
          clientId,
          reason: message,
        });
      } else {
        result.failed.push({
          clientId,
          error: message,
        });
      }
    }
  }

  result.failedCount = result.failed.length;
  result.skippedCount = result.skipped.length;

  return result;
}

export async function getDeleteEligibilityForClient(
  clientId: string,
): Promise<DeleteEligibilitySnapshot> {
  const client = await getClientForLifecycle(clientId);
  const [events, payments] = await Promise.all([
    getEventsForClient(client.id),
    getPaymentsForClientOrApplication(client.id, null),
  ]);
  const primaryEvent = selectPrimaryEvent(events);
  const latestPayment = selectLatestPayment(payments);
  const hostingEndsAt = latestPayment?.hosting_ends_at ?? client.hosting_ends_at;
  const paymentStatus = latestPayment?.payment_status ?? null;
  const refunds = await getRefundsForClient(client.id);
  const hasPaidNonRefundedPayment = payments.some((payment) => payment.payment_status === "paid");
  const hasRefundedPaymentHistory =
    payments.some((payment) => payment.payment_status === "refunded") || refunds.length > 0;
  const result = deriveDeleteEligibility({
    archivedAt: client.archived_at,
    cancelledAt: client.cancelled_at,
    clientCustomFrontendStatus: client.custom_frontend_status,
    clientCustomFrontendUrl: client.custom_frontend_url,
    clientStatus: client.status,
    eventCustomFrontendEnabled: primaryEvent?.custom_frontend_enabled ?? false,
    eventCustomFrontendUrl: primaryEvent?.custom_frontend_url ?? null,
    eventDate: primaryEvent?.event_date ?? null,
    eventPublishedAt: primaryEvent?.published_at ?? null,
    eventStatus: primaryEvent?.status ?? null,
    eventVisibility: primaryEvent?.visibility ?? null,
    hasPaidNonRefundedPayment,
    hasRefundedPaymentHistory,
    hasUnpublishedSetupWork: events.some((event) =>
      ["setup_in_progress", "ready"].includes(event.status),
    ),
    hostingEndsAt,
    lastActivityAt: client.last_activity_at ?? client.updated_at,
    latestPaymentStatus: paymentStatus,
    now: new Date(),
  });

  return {
    deleteEligible: result.deleteEligible,
    deleteEligibleAt: result.deleteEligibleAt,
    eventPassed: Boolean(
      primaryEvent?.event_date && primaryEvent.event_date < getTodayDateInManila(),
    ),
    hasPaidNonRefundedPayment,
    hasRefundedPaymentHistory,
    hostingExpired: Boolean(hostingEndsAt && new Date(hostingEndsAt).getTime() < Date.now()),
    reasonCode: result.reasonCode,
    reason: result.reason,
  };
}

async function touchClientActivity(clientId: string) {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("clients")
    .update({ last_activity_at: new Date().toISOString() })
    .eq("id", clientId);

  assertServiceSuccess(error, "Failed to update the client activity timestamp.");
}

async function getClientForLifecycle(clientId: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase.from("clients").select("*").eq("id", clientId).single();

  assertServiceSuccess(error, "Failed to load the client.");
  assertServiceData(data, "The requested client does not exist.");

  return data;
}

async function getLatestPaidPaymentForClient(clientId: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("payments")
    .select("id, hosting_ends_at")
    .eq("client_id", clientId)
    .eq("payment_status", "paid")
    .order("paid_at", { ascending: false, nullsFirst: false })
    .limit(1)
    .maybeSingle();

  assertServiceSuccess(error, "Failed to load the latest payment.");

  return data;
}

async function getLatestRefundablePaymentForClient(clientId: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("payments")
    .select("*")
    .eq("client_id", clientId)
    .eq("payment_status", "paid")
    .order("paid_at", { ascending: false, nullsFirst: false })
    .limit(1)
    .maybeSingle();

  assertServiceSuccess(error, "Failed to load the refundable payment.");

  return data;
}

async function getPaymentForClientOrApplication(clientId: string, applicationId: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("payments")
    .select("*")
    .or(`client_id.eq.${clientId},application_id.eq.${applicationId}`)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  assertServiceSuccess(error, "Failed to load the latest client payment.");

  return data;
}

async function getPaymentsForClientOrApplication(clientId: string, applicationId: string | null) {
  const supabase = createAdminClient();
  const filter = applicationId
    ? `client_id.eq.${clientId},application_id.eq.${applicationId}`
    : `client_id.eq.${clientId}`;
  const { data, error } = await supabase
    .from("payments")
    .select("*")
    .or(filter)
    .order("updated_at", { ascending: false });

  assertServiceSuccess(error, "Failed to load client payments.");

  return data ?? [];
}

async function getOwnerProfileForClient(clientId: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, email, full_name")
    .eq("client_id", clientId)
    .eq("role", "client_owner")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  assertServiceSuccess(error, "Failed to load the client owner profile.");

  return data;
}

async function getPrimaryEventForClient(clientId: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("rsvp_events")
    .select("id, event_slug")
    .eq("client_id", clientId)
    .neq("status", "archived")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  assertServiceSuccess(error, "Failed to load the client event.");
  assertServiceData(data, "An active RSVP event is required before onboarding can be resent.");

  return data;
}

async function getEventsForClient(clientId: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("rsvp_events")
    .select(
      "id, event_slug, event_type, event_date, status, visibility, published_at, custom_frontend_enabled, custom_frontend_url, updated_at",
    )
    .eq("client_id", clientId)
    .order("updated_at", { ascending: false });

  assertServiceSuccess(error, "Failed to load the client events.");

  return data ?? [];
}

async function getRefundsForClient(clientId: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("payment_refunds")
    .select("*")
    .eq("client_id", clientId)
    .order("confirmed_at", { ascending: false, nullsFirst: false });

  assertServiceSuccess(error, "Failed to load client refunds.");

  return data ?? [];
}

async function getApprovedApplicationForClient(clientId: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("rsvp_applications")
    .select(
      "id, approved_at, email, full_name, phone, preferred_manual_payment_option, preferred_plan, reference_code, fb_fbp, fb_fbc",
    )
    .eq("approved_client_id", clientId)
    .order("approved_at", { ascending: false, nullsFirst: false })
    .limit(1)
    .maybeSingle();

  assertServiceSuccess(error, "Failed to load the approved application.");

  return data;
}

async function getLatestPaymentDisplayStatusForClient(
  clientId: string,
): Promise<ClientPaymentDisplayStatus> {
  const payments = await getPaymentsForClientOrApplication(clientId, null);
  const client = await getClientForLifecycle(clientId);
  const latestPayment = selectLatestPayment(payments);

  return deriveClientPaymentStatus({
    clientCancelledAt: client.cancelled_at,
    clientStatus: client.status,
    paymentStatus: latestPayment?.payment_status ?? null,
  });
}

function appendLifecycleNote(existing: string | null, label: string, note: string) {
  const entry = `[${label}] ${note.trim()}`;

  if (!existing?.trim()) {
    return entry;
  }

  return `${existing.trim()}\n\n${entry}`;
}

function mergeNotes(existing: string | null | undefined, next: string | undefined) {
  const trimmedExisting = existing?.trim();
  const trimmedNext = next?.trim();

  if (!trimmedNext) {
    return trimmedExisting ?? null;
  }

  if (!trimmedExisting) {
    return trimmedNext;
  }

  if (trimmedExisting === trimmedNext) {
    return trimmedExisting;
  }

  return `${trimmedExisting}\n\n${trimmedNext}`;
}

function normalizePlanType(value: string | null | undefined): "pro" | "max" {
  if (value === "pro" || value === "max") {
    return value;
  }

  throw new ServiceError("A valid Pro or Max package is required before payment can be confirmed.");
}

function resolvePaymentMethod(
  existingMethod: string | null,
  preferredMethod: string | null,
  fallbackMethod: string | undefined,
) {
  return existingMethod ?? preferredMethod ?? fallbackMethod ?? "manual";
}

function selectLatestPayment<T extends { updated_at: string | null }>(payments: T[]) {
  return (
    [...payments].sort((left, right) => {
      const leftTime = left.updated_at ? new Date(left.updated_at).getTime() : 0;
      const rightTime = right.updated_at ? new Date(right.updated_at).getTime() : 0;

      return rightTime - leftTime;
    })[0] ?? null
  );
}

function selectPrimaryEvent<T extends { event_date: string | null; updated_at?: string | null }>(
  events: T[],
) {
  return (
    [...events].sort((left, right) => {
      const leftDate = left.event_date ? new Date(left.event_date).getTime() : 0;
      const rightDate = right.event_date ? new Date(right.event_date).getTime() : 0;
      if (rightDate !== leftDate) {
        return rightDate - leftDate;
      }

      const leftUpdated = left.updated_at ? new Date(left.updated_at).getTime() : 0;
      const rightUpdated = right.updated_at ? new Date(right.updated_at).getTime() : 0;
      return rightUpdated - leftUpdated;
    })[0] ?? null
  );
}

async function safeWriteAuditLog(input: Parameters<typeof writeAuditLog>[0]) {
  try {
    await writeAuditLog(input);
    return null;
  } catch (error) {
    return error instanceof Error
      ? `Audit log could not be written: ${error.message}`
      : "Audit log could not be written.";
  }
}

async function safeSendMetaCapiPurchase(input: Parameters<typeof sendMetaCapiPurchase>[0]) {
  try {
    const result = await sendMetaCapiPurchase(input);

    if (result.status === "failed") {
      return "Meta CAPI delivery failed after payment confirmation.";
    }

    return null;
  } catch {
    return "Meta CAPI delivery failed after payment confirmation.";
  }
}

function createBulkResult(total: number): BulkClientActionResult {
  return {
    failed: [],
    skipped: [],
    succeeded: [],
    total,
  };
}

function createBulkDeleteResult(total: number): BulkDeleteClientActionResult {
  return {
    failed: [],
    failedCount: 0,
    forceDeletedCount: 0,
    normalDeletedCount: 0,
    selectedCount: total,
    skipped: [],
    skippedCount: 0,
    succeeded: [],
    total,
  };
}

function uniqueIds(clientIds: string[]) {
  return Array.from(new Set(clientIds));
}

async function loadClientDeleteSnapshot(clientId: string): Promise<ClientDeleteSnapshot> {
  const client = await getClientForLifecycle(clientId);
  const [application, events, payments, refunds, eligibility, paymentStatus, eventResponseCount] =
    await Promise.all([
      getApprovedApplicationForClient(client.id),
      getEventsForClient(client.id),
      getPaymentsForClientOrApplication(client.id, null),
      getRefundsForClient(client.id),
      getDeleteEligibilityForClient(client.id),
      getLatestPaymentDisplayStatusForClient(client.id),
      getEventResponseCountForClient(client.id),
    ]);

  return {
    application,
    client,
    eligibility,
    eventResponseCount,
    events,
    paymentStatus,
    payments,
    refunds,
  };
}

function resolveDeletePermission(
  snapshot: ClientDeleteSnapshot,
  force: boolean,
): DeletePermissionDecision {
  if (!force) {
    if (!snapshot.eligibility.deleteEligible) {
      return {
        allowed: false,
        reason: snapshot.eligibility.reason,
      };
    }

    return {
      allowed: true,
      mode: "normal",
      reasonCode: snapshot.eligibility.reasonCode,
    };
  }

  if (snapshot.eventResponseCount > 0) {
    return {
      allowed: false,
      reason: "Clients with persisted RSVP responses or guest data remain blocked in force delete.",
    };
  }

  if (snapshot.eligibility.reasonCode === "paid_non_refunded") {
    return {
      allowed: false,
      reason: "Paid non-refunded clients remain blocked in force delete v1.",
    };
  }

  if (snapshot.eligibility.reasonCode === "live_rsvp") {
    return {
      allowed: false,
      reason: "Live public or unlisted RSVP records remain blocked in force delete v1.",
    };
  }

  if (
    snapshot.eligibility.deleteEligible ||
    ["status_inconsistent", "status_not_closed", "active_hosting", "active_setup"].includes(
      snapshot.eligibility.reasonCode,
    )
  ) {
    return {
      allowed: true,
      mode: snapshot.eligibility.deleteEligible ? "normal" : "force",
      reasonCode: snapshot.eligibility.reasonCode,
    };
  }

  return {
    allowed: false,
    reason: snapshot.eligibility.reason,
  };
}

function isDeleteSkipReason(message: string) {
  return [
    "Archive or cancel the client before deletion.",
    "Active hosting/access must end before deletion.",
    "Client still has active onboarding or setup work to retain.",
    "Client has archive metadata but status is still Active. Re-archive or cancel the client before deleting.",
    "Paid non-refunded clients remain blocked in force delete v1.",
    "Live public or unlisted RSVP records remain blocked in force delete v1.",
    "Clients with persisted RSVP responses or guest data remain blocked in force delete.",
    "Unpublish or disable the live RSVP website before deletion.",
    "Paid clients must be refunded or retained before deletion.",
  ].includes(message);
}

async function getEventResponseCountForClient(clientId: string) {
  const supabase = createAdminClient();
  const { count, error } = await supabase
    .from("rsvp_responses")
    .select("id", { count: "exact", head: true })
    .eq("client_id", clientId);

  assertServiceSuccess(error, "Failed to verify persisted RSVP responses.");

  return count ?? 0;
}

async function disableClientAccessForForceDelete(clientId: string, events: Array<{ id: string }>) {
  const supabase = createAdminClient();
  const now = new Date().toISOString();

  try {
    const { error: customWebsiteError } = await supabase
      .from("client_custom_websites")
      .update({
        custom_frontend_enabled: false,
        disabled_at: now,
        status: "disabled",
      })
      .eq("client_id", clientId);

    assertServiceSuccess(customWebsiteError, "Failed to disable linked custom website access.");

    const { error: clientError } = await supabase
      .from("clients")
      .update({
        custom_frontend_status: "disabled",
        custom_frontend_url: null,
        hosting_ends_at: now,
        hosting_starts_at: null,
        renewal_required_at: null,
      })
      .eq("id", clientId);

    assertServiceSuccess(clientError, "Failed to disable client hosting/access.");

    if (events.length > 0) {
      const eventIds = events.map((event) => event.id);
      const { error: eventError } = await supabase
        .from("rsvp_events")
        .update({
          custom_frontend_enabled: false,
          custom_frontend_url: null,
        })
        .in("id", eventIds);

      assertServiceSuccess(eventError, "Failed to unlink event website access.");
    }

    return null;
  } catch (error) {
    return error instanceof Error
      ? `Access cleanup could not be fully recorded before force delete: ${error.message}`
      : "Access cleanup could not be fully recorded before force delete.";
  }
}

function buildBulkPaymentSkipReason(status: ClientPaymentDisplayStatus) {
  switch (status) {
    case "paid":
      return "Client already has a paid payment.";
    case "refunded":
      return "Client payment is already refunded.";
    case "cancelled":
      return "Client payment path is cancelled.";
    case "pending":
    default:
      return "Client payment is not eligible.";
  }
}

function getTodayDateInManila() {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    day: "2-digit",
    month: "2-digit",
    timeZone: "Asia/Manila",
    year: "numeric",
  });

  return formatter.format(new Date());
}

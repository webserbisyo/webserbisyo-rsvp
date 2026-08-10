import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import type { TablesInsert } from "@/lib/supabase/types";
import type {
  ArchiveClientInput,
  BulkArchiveClientsInput,
  BulkCancelClientsInput,
  BulkMarkClientsPaidInput,
  BulkRefundClientsInput,
  CancelClientInput,
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
import { sendClientPasswordSetup } from "@/server/services/send-client-password-setup";
import { sendMetaCapiPurchase } from "@/server/services/send-meta-capi-purchase";
import { writeAuditLog } from "@/server/services/write-audit-log";
import { ensureOwnerProfileForClient } from "./provisioning";
import { calculateHostingCoverage } from "./hosting";
import { type ClientPaymentDisplayStatus, deriveClientPaymentStatus } from "./client-rules";
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

type ClientRefundResult = {
  clientId: string;
  paymentId: string;
  refundId: string;
  status: string;
};

type BulkClientActionResultItem = {
  clientId: string;
  warnings: string[];
};

export type BulkClientActionResult = {
  failed: Array<{ clientId: string; error: string }>;
  skipped: Array<{ clientId: string; reason: string }>;
  succeeded: BulkClientActionResultItem[];
  total: number;
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

  const capiWarning = await safeSendMetaCapiPurchase({
    actorUserId,
    amount: payment.amount_paid,
    clientId: client.id,
    currency: payment.currency,
    customerEmail: application.email,
    customerFullName: application.full_name,
    customerPhone: application.phone,
    eventId: event.id,
    externalId: application.reference_code,
    fbc: application.fb_fbc,
    fbp: application.fb_fbp,
    paymentId: payment.id,
    paidAt: payment.paid_at,
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
  const accessEmail = ownerProfile?.email ?? client.contact_email;
  const ownerSetup = await ensureOwnerProfileForClient({
    clientId: client.id,
    email: accessEmail,
    fullName: ownerProfile?.full_name ?? client.contact_name ?? client.name,
  });

  if (ownerSetup.warning) {
    throw new ServiceError(ownerSetup.warning);
  }

  if (!ownerSetup.profileId || !ownerSetup.userId) {
    throw new ServiceError("Secure client owner access could not be reconciled.");
  }

  const emailLog = await sendClientPasswordSetup({
    actorUserId,
    applicationId: application?.id ?? null,
    clientId: client.id,
    eventId: event.id,
    recipientName: ownerProfile?.full_name ?? client.contact_name ?? client.name,
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
      issuance_reason: "password_setup",
      note_present: Boolean(input.note),
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

function uniqueIds(clientIds: string[]) {
  return Array.from(new Set(clientIds));
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

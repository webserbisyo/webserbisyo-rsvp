import "server-only";

import { clientStatusAllowsDashboardAccess } from "@/lib/auth/client-access";
import { createAdminClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type {
  ApproveApplicationInput,
  ApproveApplicationForPaymentInput,
  BulkApproveApplicationsInput,
  BulkRejectAndDeleteApplicationsInput,
  CancelApplicationInput,
  MarkApplicationReviewingInput,
  RejectAndDeleteApplicationInput,
  RejectApplicationInput,
} from "@/lib/validations/admin-workflow.schema";
import {
  ServiceError,
  assertServiceData,
  assertServiceSuccess,
} from "@/server/services/service-error";
import { sendClientPasswordSetup } from "@/server/services/send-client-password-setup";
import { writeAuditLog } from "@/server/services/write-audit-log";
import { ensureAuthUserWithCreationFlag } from "@/server/services/create-client-user";
import {
  assertCompleteOwnerSetup,
  ensureEventBundleForClient,
  ensureOwnerProfileForClient,
} from "./provisioning";
import { getRequiredPackageSettings } from "./package-settings";

const MUTATION_APPLICATION_COLUMNS = "id, preferred_plan, preferred_manual_payment_option, status";

export async function approveApplication(input: ApproveApplicationInput, actorUserId: string) {
  const application = await getApplicationForMutation(input.applicationId);
  const warnings: string[] = [];

  if (application.approved_client_id && application.approved_event_id) {
    const linkedRecords = await getConsistentProvisionedLinks(
      application.approved_client_id,
      application.approved_event_id,
    );

    if (application.status !== "approved") {
      throw new ServiceError(
        "This application already contains provisioned links. Open the client record instead.",
      );
    }

    const ownerSetup = await ensureOwnerProfileForClient({
      clientId: linkedRecords.client.id,
      email: application.email,
      fullName: application.full_name,
    });
    assertCompleteOwnerSetup(ownerSetup);
    await ensureEventBundleForClient({
      application,
      clientId: linkedRecords.client.id,
      existingEventId: linkedRecords.event.id,
    });

    return {
      application,
      client: linkedRecords.client,
      href: `/admin/clients/${linkedRecords.client.id}`,
      warnings,
    };
  }

  if (application.approved_client_id || application.approved_event_id) {
    throw new ServiceError(
      "This application has inconsistent provisioned links. Resolve the linked client or event before approving it again.",
    );
  }

  ensureAllowedStatusTransition(
    application.status,
    ["submitted", "reviewing"],
    "approve this application",
  );

  const { userId: authUserId, wasCreated } = await ensureAuthUserWithCreationFlag(
    application.email,
    application.full_name,
  );
  const adminSupabase = createAdminClient();

  let rpcResult: unknown;
  let rpcError: unknown;

  try {
    const result = await (
      adminSupabase.rpc as unknown as (
        name: string,
        args: Record<string, unknown>,
      ) => Promise<{ data: unknown; error: unknown }>
    )("provision_application_atomic", {
      p_actor_user_id: actorUserId,
      p_application_id: application.id,
      p_auth_user_id: authUserId,
    });

    rpcResult = result.data;
    rpcError = result.error;
  } catch (error) {
    if (wasCreated) {
      try {
        await adminSupabase.auth.admin.deleteUser(authUserId);
      } catch {
        // Safe compensation fallback
      }
    }
    throw error;
  }

  if (rpcError) {
    if (wasCreated) {
      try {
        await adminSupabase.auth.admin.deleteUser(authUserId);
      } catch {
        // Safe compensation fallback
      }
    }
    assertServiceSuccess(rpcError, "Failed to provision application atomically.");
  }

  assertServiceData(rpcResult, "Provisioning RPC returned no result.");

  const provisioned = rpcResult as {
    client_id: string;
    event_id: string;
    payment_id: string;
    profile_id: string;
    status: string;
  };

  const [client, approvedApplication] = await Promise.all([
    getLinkedClientById(provisioned.client_id),
    getApplicationForMutation(application.id),
  ]);

  const eventBundle = { event: { id: provisioned.event_id } };

  try {
    await writeAuditLog({
      action: "application_approved",
      actorUserId,
      clientId: client.id,
      entityId: application.id,
      entityType: "rsvp_applications",
      eventId: eventBundle.event.id,
      metadata: {
        client_id: client.id,
        event_id: eventBundle.event.id,
        payment_id: provisioned.payment_id,
        plan_type: application.preferred_plan,
        profile_email: application.email,
      },
    });
  } catch {
    warnings.push("Audit log write was skipped for this approval.");
  }

  try {
    const emailResult = await sendClientPasswordSetup({
      actorUserId,
      applicationId: application.id,
      clientId: client.id,
      eventId: eventBundle.event.id,
      recipientName: application.full_name,
    });

    if (emailResult.status !== "sent") {
      warnings.push(
        "Secure client access was provisioned, but the setup email was not delivered. Use Resend access after checking the email provider.",
      );
    }

    try {
      await writeAuditLog({
        action:
          emailResult.status === "sent"
            ? "client_password_setup_email_sent"
            : "client_password_setup_email_failed",
        actorUserId,
        clientId: client.id,
        entityId: emailResult.id,
        entityType: "email_logs",
        eventId: eventBundle.event.id,
        metadata: {
          application_id: application.id,
          email_status: emailResult.status,
        },
      });
    } catch {
      warnings.push("Setup email audit logging was skipped.");
    }
  } catch {
    warnings.push(
      "Secure client access was provisioned, but the setup email could not be prepared. Use Resend access after reviewing the relationship graph.",
    );
  }

  return {
    application: approvedApplication,
    client,
    href: `/admin/clients/${client.id}`,
    warnings,
  };
}

export async function rejectAndDeleteApplication(
  input: RejectAndDeleteApplicationInput,
  actorUserId: string,
) {
  const supabase = await createServerSupabaseClient();
  const application = await getApplicationForMutation(input.applicationId);
  const warnings: string[] = [];

  ensureAllowedStatusTransition(
    application.status,
    ["submitted", "reviewing"],
    "delete this application",
  );

  if (application.approved_client_id || application.approved_event_id) {
    throw new ServiceError("Provisioned applications cannot be deleted from the queue.");
  }

  try {
    await writeAuditLog({
      action: "application_deleted",
      actorUserId,
      entityId: application.id,
      entityType: "rsvp_applications",
      metadata: {
        application_id: application.id,
        email: application.email,
        event_date: application.event_date,
        event_location: application.event_location,
        event_type: application.event_type,
        full_name: application.full_name,
        phone: application.phone,
        preferred_manual_payment_option: application.preferred_manual_payment_option,
        preferred_plan: application.preferred_plan,
        reference_code: application.reference_code,
        status: application.status,
      },
    });
  } catch {
    warnings.push("Audit log write was skipped for this delete.");
  }

  const { data, error } = await supabase
    .from("rsvp_applications")
    .delete()
    .eq("id", application.id)
    .select("id")
    .single();

  if (isLinkedPaymentConstraintError(error)) {
    throw new ServiceError("Cannot delete this application because it already has linked records.");
  }

  assertServiceSuccess(error, "Failed to delete the application.");
  assertServiceData(data, "Application delete returned no row.");

  return {
    id: data.id,
    warnings,
  };
}

export async function approveApplicationsBulk(
  input: BulkApproveApplicationsInput,
  actorUserId: string,
) {
  const results = await Promise.all(
    input.applicationIds.map(async (applicationId) => {
      try {
        const result = await approveApplication({ applicationId }, actorUserId);

        return {
          applicationId,
          href: result.href,
          warnings: result.warnings,
          ok: true as const,
        };
      } catch (error) {
        return {
          applicationId,
          error: error instanceof Error ? error.message : "The application could not be approved.",
          ok: false as const,
        };
      }
    }),
  );

  return summarizeBulkResults(results);
}

export async function rejectAndDeleteApplicationsBulk(
  input: BulkRejectAndDeleteApplicationsInput,
  actorUserId: string,
) {
  const results = await Promise.all(
    input.applicationIds.map(async (applicationId) => {
      try {
        const result = await rejectAndDeleteApplication(
          { applicationId, confirmation: input.confirmation },
          actorUserId,
        );

        return {
          applicationId,
          warnings: result.warnings,
          ok: true as const,
        };
      } catch (error) {
        return {
          applicationId,
          error: error instanceof Error ? error.message : "The application could not be deleted.",
          ok: false as const,
        };
      }
    }),
  );

  return summarizeBulkResults(results);
}

export async function markApplicationReviewing(
  input: MarkApplicationReviewingInput,
  actorUserId: string,
) {
  const supabase = createAdminClient();
  const application = await getApplicationForMutation(input.applicationId);

  if (application.status === "reviewing") {
    return application;
  }

  ensureAllowedStatusTransition(
    application.status,
    ["submitted"],
    "mark this application as reviewing",
  );

  const { data, error } = await supabase
    .from("rsvp_applications")
    .update({
      review_notes: mergeNotes(application.review_notes, input.note),
      reviewed_at: new Date().toISOString(),
      status: "reviewing",
    })
    .eq("id", application.id)
    .select(MUTATION_APPLICATION_COLUMNS)
    .single();

  assertServiceSuccess(error, "Failed to mark the application as reviewing.");
  assertServiceData(data, "Application review update returned no row.");

  await writeAuditLog({
    action: "application_reviewing_marked",
    actorUserId,
    entityId: application.id,
    entityType: "rsvp_applications",
    metadata: input.note ? { note: input.note } : {},
  });

  return data;
}

export async function rejectApplication(input: RejectApplicationInput, actorUserId: string) {
  const supabase = createAdminClient();
  const application = await getApplicationForMutation(input.applicationId);

  if (application.status === "rejected") {
    return application;
  }

  ensureAllowedStatusTransition(
    application.status,
    ["submitted", "reviewing"],
    "reject this application",
  );

  const { data, error } = await supabase
    .from("rsvp_applications")
    .update({
      rejected_at: new Date().toISOString(),
      review_notes: mergeNotes(application.review_notes, input.note),
      reviewed_at: new Date().toISOString(),
      status: "rejected",
    })
    .eq("id", application.id)
    .select(MUTATION_APPLICATION_COLUMNS)
    .single();

  assertServiceSuccess(error, "Failed to reject the application.");
  assertServiceData(data, "Application rejection returned no row.");

  await writeAuditLog({
    action: "application_rejected",
    actorUserId,
    entityId: application.id,
    entityType: "rsvp_applications",
    metadata: {
      note: input.note,
    },
  });

  return data;
}

export async function cancelApplication(input: CancelApplicationInput, actorUserId: string) {
  const supabase = createAdminClient();
  const [application, existingPayment] = await Promise.all([
    getApplicationForMutation(input.applicationId),
    getPaymentByApplicationId(input.applicationId),
  ]);

  if (application.status === "cancelled") {
    return application;
  }

  ensureAllowedStatusTransition(
    application.status,
    ["submitted", "reviewing", "approved"],
    "cancel this application",
  );

  if (existingPayment?.payment_status === "paid") {
    throw new ServiceError("A paid application cannot be cancelled from the application workflow.");
  }

  if (existingPayment && ["pending", "failed"].includes(existingPayment.payment_status)) {
    const { error: paymentError } = await supabase
      .from("payments")
      .update({
        notes: mergeNotes(existingPayment.notes, input.note),
        payment_status: "cancelled",
      })
      .eq("id", existingPayment.id);

    assertServiceSuccess(paymentError, "Failed to cancel the linked payment.");
  }

  const { data, error } = await supabase
    .from("rsvp_applications")
    .update({
      review_notes: mergeNotes(application.review_notes, input.note),
      reviewed_at: new Date().toISOString(),
      status: "cancelled",
    })
    .eq("id", application.id)
    .select(MUTATION_APPLICATION_COLUMNS)
    .single();

  assertServiceSuccess(error, "Failed to cancel the application.");
  assertServiceData(data, "Application cancellation returned no row.");

  await writeAuditLog({
    action: "application_cancelled",
    actorUserId,
    entityId: application.id,
    entityType: "rsvp_applications",
    metadata: {
      note: input.note,
      payment_id: existingPayment?.id ?? null,
    },
  });

  return data;
}

export async function approveApplicationForPayment(
  input: ApproveApplicationForPaymentInput,
  actorUserId: string,
) {
  const approvalResult = await approveApplication({ applicationId: input.applicationId }, actorUserId);
  const payment = await getPaymentByApplicationId(input.applicationId);

  assertServiceData(payment, "Canonical payment record was not created during approval.");

  if (input.note) {
    const supabase = createAdminClient();
    await supabase
      .from("payments")
      .update({ notes: mergeNotes(payment.notes, input.note) })
      .eq("id", payment.id);
  }

  return {
    application: approvalResult.application,
    payment,
  };
}

async function getApplicationForMutation(applicationId: string) {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("rsvp_applications")
    .select(
      "id, approved_at, approved_client_id, approved_event_id, email, estimated_guest_count, event_date, event_location, event_type, full_name, phone, preferred_manual_payment_option, preferred_plan, reference_code, rejected_at, review_notes, reviewed_at, status",
    )
    .eq("id", applicationId)
    .single();

  assertServiceSuccess(error, "Failed to load the application.");
  assertServiceData(data, "The requested application does not exist.");

  return data;
}

async function getPaymentByApplicationId(applicationId: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("payments")
    .select("id, client_id, event_id, amount_due, notes, payment_method, payment_status")
    .eq("application_id", applicationId)
    .maybeSingle();

  assertServiceSuccess(error, "Failed to load payment records for this application.");

  return data;
}

async function getConsistentProvisionedLinks(clientId: string, eventId: string) {
  const [client, event] = await Promise.all([
    getLinkedClientById(clientId),
    getLinkedEventById(eventId),
  ]);

  if (event.client_id !== client.id) {
    throw new ServiceError(
      "This application has inconsistent provisioned links. Resolve the linked client or event before approving it again.",
    );
  }

  if (!clientStatusAllowsDashboardAccess(client.status)) {
    throw new ServiceError(
      "This application belongs to an archived or cancelled client. Restore client access explicitly before retrying provisioning.",
    );
  }

  return { client, event };
}

async function getLinkedClientById(clientId: string) {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.from("clients").select("*").eq("id", clientId).single();

  assertServiceSuccess(error, "Failed to load the linked client.");
  assertServiceData(data, "The linked client no longer exists.");

  return data;
}

async function getLinkedEventById(eventId: string) {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.from("rsvp_events").select("*").eq("id", eventId).single();

  assertServiceSuccess(error, "Failed to load the linked event.");
  assertServiceData(data, "The linked event no longer exists.");

  return data;
}

function ensureAllowedStatusTransition(
  currentStatus: string,
  allowedStatuses: string[],
  actionLabel: string,
) {
  if (!allowedStatuses.includes(currentStatus)) {
    throw new ServiceError(`You cannot ${actionLabel} while it is ${currentStatus}.`);
  }
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

function isLinkedPaymentConstraintError(
  error: {
    code?: string | null;
    message?: string | null;
  } | null,
) {
  if (!error) {
    return false;
  }

  return (
    error.code === "23503" ||
    error.message?.toLowerCase().includes("foreign key constraint") === true
  );
}

function summarizeBulkResults(
  results: Array<
    | { applicationId: string; href?: string; ok: true; warnings?: string[] }
    | { applicationId: string; error: string; ok: false }
  >,
) {
  const succeeded = results.filter((result) => result.ok);
  const failed = results.filter((result) => !result.ok);

  return {
    failed,
    succeeded,
    total: results.length,
  };
}

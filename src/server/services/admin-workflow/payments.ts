import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import type {
  ConfirmManualPaymentInput,
  TransitionPaymentStatusInput,
} from "@/lib/validations/admin-workflow.schema";
import {
  ServiceError,
  assertServiceData,
  assertServiceSuccess,
} from "@/server/services/service-error";
import { sendOnboardingEmail } from "@/server/services/send-onboarding-email";
import { writeAuditLog } from "@/server/services/write-audit-log";
import { calculateHostingCoverage } from "./hosting";
import { getRequiredPackageSettings } from "./package-settings";
import {
  ensureClientForApplication,
  ensureEventBundleForClient,
  ensureOwnerProfileForClient,
} from "./provisioning";

export async function confirmManualPayment(input: ConfirmManualPaymentInput, actorUserId: string) {
  const supabase = createAdminClient();
  const payment = await getPaymentForMutation(input.paymentId);
  const application = await getApplicationForPayment(payment.application_id);

  if (!["pending", "paid"].includes(payment.payment_status)) {
    throw new ServiceError(
      `This payment cannot be confirmed while it is ${payment.payment_status}.`,
    );
  }

  const packageSettings = await getRequiredPackageSettings(payment.plan_type as "pro" | "max");
  const paidAt = payment.paid_at ?? input.paidAt ?? new Date().toISOString();
  const amountPaid =
    payment.payment_status === "paid"
      ? payment.amount_paid
      : (input.amountPaid ?? payment.amount_due);

  if (
    input.amountPaid !== undefined &&
    input.amountPaid !== payment.amount_due &&
    !input.customAmountReason
  ) {
    throw new ServiceError("A reason is required when confirming a custom amount.");
  }

  const coverage = calculateHostingCoverage({
    defaultHostingDays: packageSettings.defaultHostingDays,
    paidAt,
    renewalNoticeDays: packageSettings.renewalNoticeDays,
  });

  const client = await ensureClientForApplication({
    application,
    existingClientId: payment.client_id,
    planType: payment.plan_type as "pro" | "max",
  });

  await ensureOwnerProfileForClient({
    clientId: client.id,
    email: application.email,
    fullName: application.full_name,
  });

  const eventBundle = await ensureEventBundleForClient({
    application,
    clientId: client.id,
    existingEventId: payment.event_id,
  });

  const shouldWriteConfirmationAudit = payment.payment_status !== "paid";
  const { data: updatedPayment, error: paymentError } = await supabase
    .from("payments")
    .update({
      amount_paid: shouldWriteConfirmationAudit ? amountPaid : payment.amount_paid,
      client_id: payment.client_id ?? client.id,
      confirmed_by: payment.confirmed_by ?? actorUserId,
      currency: payment.currency ?? packageSettings.currency,
      event_id: payment.event_id ?? eventBundle.event.id,
      hosting_ends_at: payment.hosting_ends_at ?? coverage.hostingEndsAt,
      hosting_starts_at: payment.hosting_starts_at ?? coverage.hostingStartsAt,
      notes: mergeNotes(
        payment.notes,
        buildPaymentNoteFragment(
          input.note,
          input.customAmountReason,
          amountPaid,
          payment.amount_due,
        ),
      ),
      paid_at: payment.paid_at ?? paidAt,
      payment_method:
        payment.payment_method ??
        input.paymentMethod ??
        application.preferred_manual_payment_option ??
        "manual",
      payment_status: "paid",
      reference_number: payment.reference_number ?? input.referenceNumber,
      renewal_required_at: payment.renewal_required_at ?? coverage.renewalRequiredAt,
    })
    .eq("id", payment.id)
    .select("*")
    .single();

  assertServiceSuccess(paymentError, "Failed to confirm the manual payment.");
  assertServiceData(updatedPayment, "Payment confirmation returned no row.");

  const { error: clientError } = await supabase
    .from("clients")
    .update({
      contact_email: application.email,
      contact_name: application.full_name,
      contact_phone: application.phone,
      hosting_ends_at: updatedPayment.hosting_ends_at,
      hosting_starts_at: updatedPayment.hosting_starts_at,
      name: client.name || application.full_name,
      plan_type: payment.plan_type,
      renewal_required_at: updatedPayment.renewal_required_at,
      status: "active",
    })
    .eq("id", client.id);

  assertServiceSuccess(clientError, "Failed to update the client hosting mirror.");

  const { error: applicationError } = await supabase
    .from("rsvp_applications")
    .update({
      approved_at: application.approved_at ?? updatedPayment.paid_at ?? paidAt,
      approved_client_id: client.id,
      approved_event_id: eventBundle.event.id,
      reviewed_at: application.reviewed_at ?? updatedPayment.paid_at ?? paidAt,
      status: "approved",
    })
    .eq("id", application.id);

  assertServiceSuccess(applicationError, "Failed to link the approved client and event.");

  if (await shouldSendOnboardingEmail(client.id)) {
    await sendOnboardingEmail({
      applicationId: application.id,
      clientId: client.id,
      eventId: eventBundle.event.id,
      eventSlug: eventBundle.event.event_slug,
      recipientEmail: application.email,
      recipientName: application.full_name,
    });
  }

  if (shouldWriteConfirmationAudit) {
    await writeAuditLog({
      action: "payment_confirmed",
      actorUserId,
      clientId: client.id,
      entityId: updatedPayment.id,
      entityType: "payments",
      eventId: eventBundle.event.id,
      metadata: {
        amount_due: updatedPayment.amount_due,
        amount_paid: updatedPayment.amount_paid,
        custom_amount_reason: input.customAmountReason ?? null,
        payment_method: updatedPayment.payment_method,
        plan_type: payment.plan_type,
        reference_number: updatedPayment.reference_number,
      },
    });
  }

  return {
    client,
    event: eventBundle.event,
    payment: updatedPayment,
  };
}

export async function transitionPaymentStatus(
  input: TransitionPaymentStatusInput,
  actorUserId: string,
) {
  const supabase = createAdminClient();
  const payment = await getPaymentForMutation(input.paymentId);

  if (payment.payment_status === input.status) {
    return payment;
  }

  if (input.status === "refunded" && payment.payment_status !== "paid") {
    throw new ServiceError("Only paid payments can be refunded.");
  }

  if (["failed", "cancelled"].includes(input.status) && payment.payment_status === "paid") {
    throw new ServiceError(
      "Paid payments must be refunded instead of moved back to a pending state.",
    );
  }

  const { data, error } = await supabase
    .from("payments")
    .update({
      notes: mergeNotes(payment.notes, input.note),
      payment_status: input.status,
    })
    .eq("id", payment.id)
    .select("*")
    .single();

  assertServiceSuccess(error, "Failed to update the payment status.");
  assertServiceData(data, "Payment status update returned no row.");

  await writeAuditLog({
    action: `payment_${input.status}`,
    actorUserId,
    clientId: payment.client_id,
    entityId: payment.id,
    entityType: "payments",
    eventId: payment.event_id,
    metadata: {
      note: input.note,
      previous_status: payment.payment_status,
    },
  });

  return data;
}

async function getPaymentForMutation(paymentId: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase.from("payments").select("*").eq("id", paymentId).single();

  assertServiceSuccess(error, "Failed to load the payment.");
  assertServiceData(data, "The requested payment does not exist.");

  return data;
}

async function getApplicationForPayment(applicationId: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("rsvp_applications")
    .select(
      "id, approved_at, approved_client_id, approved_event_id, email, estimated_guest_count, event_date, event_location, event_type, full_name, phone, preferred_manual_payment_option, preferred_plan, reference_code, review_notes, reviewed_at, status",
    )
    .eq("id", applicationId)
    .single();

  assertServiceSuccess(error, "Failed to load the linked application.");
  assertServiceData(data, "The linked application no longer exists.");

  return data;
}

async function shouldSendOnboardingEmail(clientId: string) {
  const supabase = createAdminClient();
  const { count, error } = await supabase
    .from("email_logs")
    .select("id", { count: "exact", head: true })
    .eq("client_id", clientId)
    .eq("email_type", "client_onboarding");

  assertServiceSuccess(error, "Failed to check onboarding email history.");

  return (count ?? 0) === 0;
}

function buildPaymentNoteFragment(
  note: string | undefined,
  customAmountReason: string | undefined,
  amountPaid: number,
  amountDue: number,
) {
  const parts = [note?.trim(), customAmountReason?.trim()].filter((value): value is string =>
    Boolean(value),
  );

  if (amountPaid !== amountDue && customAmountReason?.trim()) {
    parts.unshift(`Custom amount confirmed: ${amountPaid} (default ${amountDue})`);
  }

  if (parts.length === 0) {
    return undefined;
  }

  return parts.join("\n");
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

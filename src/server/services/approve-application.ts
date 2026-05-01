import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import type { ApprovalInput } from "@/lib/validations/approval.schema";
import { ApprovalSchema } from "@/lib/validations/approval.schema";
import { createClientUser } from "./create-client-user";
import { createDraftEvent } from "./create-draft-event";
import { provisionClient } from "./provision-client";
import { recordOneTimePayment } from "./record-one-time-payment";
import { sendMetaCapiPurchase } from "./send-meta-capi-purchase";
import { sendOnboardingEmail } from "./send-onboarding-email";
import { assertServiceData, assertServiceSuccess } from "./service-error";
import { writeAuditLog } from "./write-audit-log";

export async function approveApplication(input: ApprovalInput, actorUserId: string) {
  const payload = ApprovalSchema.parse(input);
  const supabase = createAdminClient();

  const { data: application, error: applicationError } = await supabase
    .from("rsvp_applications")
    .select("*")
    .eq("id", payload.applicationId)
    .single();

  assertServiceSuccess(applicationError, "Failed to load RSVP application for approval.");
  assertServiceData(application, "RSVP application does not exist.");

  const client =
    application.approved_client_id !== null
      ? await getClient(application.approved_client_id)
      : await provisionClient({
          contactEmail: application.email,
          contactName: payload.contactName ?? application.full_name,
          contactPhone: payload.contactPhone ?? application.phone,
          name: payload.contactName ?? application.full_name,
          planType: payload.planType,
        });

  const ownerSetup = await createClientUser({
    accessMode: "temporary_password",
    clientId: client.id,
    email: application.email,
    fullName: payload.contactName ?? application.full_name,
  });

  const eventBundle =
    application.approved_event_id !== null
      ? { event: await getEvent(application.approved_event_id) }
      : await createDraftEvent({
          clientId: client.id,
          eventDate: application.event_date,
          eventLocation: application.event_location,
          eventSlug: payload.eventSlug,
          eventType: application.event_type,
          maxGuestCount: application.estimated_guest_count,
          title: `${application.full_name} ${application.event_type} RSVP`,
        });

  const payment = await recordOneTimePayment({
    actorUserId,
    amountDue: payload.amountDue,
    amountPaid: payload.amountPaid,
    applicationId: application.id,
    clientId: client.id,
    eventId: eventBundle.event.id,
    hostingEndsAt: payload.hostingEndsAt,
    hostingStartsAt: payload.hostingStartsAt,
    notes: payload.reviewNotes ?? null,
    paidAt: payload.paidAt,
    paymentMethod: payload.paymentMethod,
    planType: payload.planType,
    referenceNumber: payload.referenceNumber,
    renewalRequiredAt: payload.renewalRequiredAt,
  });

  const now = new Date().toISOString();
  const { data: approvedApplication, error: approvalError } = await supabase
    .from("rsvp_applications")
    .update({
      approved_at: now,
      approved_client_id: client.id,
      approved_event_id: eventBundle.event.id,
      review_notes: payload.reviewNotes ?? application.review_notes,
      reviewed_at: now,
      status: "approved",
    })
    .eq("id", application.id)
    .select("*")
    .single();

  assertServiceSuccess(approvalError, "Failed to mark RSVP application as approved.");
  assertServiceData(approvedApplication, "Approved RSVP application update returned no row.");

  if (ownerSetup.temporaryPassword) {
    await sendOnboardingEmail({
      applicationId: application.id,
      clientId: client.id,
      eventId: eventBundle.event.id,
      recipientEmail: application.email,
      recipientName: payload.contactName ?? application.full_name,
      temporaryPassword: ownerSetup.temporaryPassword,
    });
  }

  await sendMetaCapiPurchase({
    actorUserId,
    amount: payment.amount_paid,
    clientId: client.id,
    customerEmail: application.email,
    customerPhone: application.phone,
    eventId: eventBundle.event.id,
    paymentId: payment.id,
  });

  await writeAuditLog({
    action: "application_approved",
    actorUserId,
    clientId: client.id,
    entityId: application.id,
    entityType: "rsvp_applications",
    eventId: eventBundle.event.id,
    metadata: {
      payment_id: payment.id,
      plan_type: payload.planType,
    },
  });

  return {
    application: approvedApplication,
    client,
    event: eventBundle.event,
    payment,
  };
}

async function getClient(clientId: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase.from("clients").select("*").eq("id", clientId).single();

  assertServiceSuccess(error, "Failed to load approved client.");
  assertServiceData(data, "Approved client does not exist.");

  return data;
}

async function getEvent(eventId: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase.from("rsvp_events").select("*").eq("id", eventId).single();

  assertServiceSuccess(error, "Failed to load approved event.");
  assertServiceData(data, "Approved event does not exist.");

  return data;
}

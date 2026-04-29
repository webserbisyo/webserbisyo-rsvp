import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import type {
  ArchiveClientInput,
  ResendOnboardingInput,
  RestoreClientInput,
} from "@/lib/validations/admin-workflow.schema";
import { assertServiceData, assertServiceSuccess } from "@/server/services/service-error";
import { sendOnboardingEmail } from "@/server/services/send-onboarding-email";
import { writeAuditLog } from "@/server/services/write-audit-log";

export async function archiveClient(input: ArchiveClientInput, actorUserId: string) {
  const supabase = createAdminClient();
  const client = await getClientForLifecycle(input.clientId);

  if (client.status === "archived") {
    return client;
  }

  const { data, error } = await supabase
    .from("clients")
    .update({
      notes: appendLifecycleNote(client.notes, "Archived", input.note),
      status: "archived",
    })
    .eq("id", client.id)
    .select("*")
    .single();

  assertServiceSuccess(error, "Failed to archive the client.");
  assertServiceData(data, "Client archive update returned no row.");

  await writeAuditLog({
    action: "client_archived",
    actorUserId,
    clientId: client.id,
    entityId: client.id,
    entityType: "clients",
    metadata: {
      note: input.note,
      previous_status: client.status,
    },
  });

  return data;
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
      notes: input.note ? appendLifecycleNote(client.notes, "Restored", input.note) : client.notes,
      status: restoredStatus,
    })
    .eq("id", client.id)
    .select("*")
    .single();

  assertServiceSuccess(error, "Failed to restore the client.");
  assertServiceData(data, "Client restore update returned no row.");

  await writeAuditLog({
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

  const emailLog = await sendOnboardingEmail({
    applicationId: application?.id ?? null,
    clientId: client.id,
    eventId: event.id,
    eventSlug: event.event_slug,
    recipientEmail: ownerProfile.email,
    recipientName: ownerProfile.full_name ?? client.contact_name ?? client.name,
  });

  await writeAuditLog({
    action: "client_onboarding_resent",
    actorUserId,
    clientId: client.id,
    entityId: client.id,
    entityType: "clients",
    eventId: event.id,
    metadata: {
      email_log_id: emailLog.id,
      email_status: emailLog.status,
      recipient_email: ownerProfile.email,
    },
  });

  return emailLog;
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
  assertServiceData(data, "The client owner profile could not be found.");

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

async function getApprovedApplicationForClient(clientId: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("rsvp_applications")
    .select("id")
    .eq("approved_client_id", clientId)
    .order("approved_at", { ascending: false, nullsFirst: false })
    .limit(1)
    .maybeSingle();

  assertServiceSuccess(error, "Failed to load the approved application.");

  return data;
}

function appendLifecycleNote(existing: string | null, label: string, note: string) {
  const entry = `[${label}] ${note.trim()}`;

  if (!existing?.trim()) {
    return entry;
  }

  return `${existing.trim()}\n\n${entry}`;
}

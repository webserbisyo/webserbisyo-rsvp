import "server-only";

import { clientStatusAllowsDashboardAccess } from "@/lib/auth/client-access";
import { createAdminClient } from "@/lib/supabase/admin";
import { CLIENT_PASSWORD_SETUP_SUBJECT } from "@/server/email/templates/client-access";
import { generateClientPasswordLink } from "./client-password-links";
import { sendOnboardingEmail } from "./send-onboarding-email";
import { ServiceError, assertServiceData, assertServiceSuccess } from "./service-error";
import { finalizePasswordEmailLog, queuePasswordEmailLog } from "./write-email-log";

export async function sendClientPasswordSetup(input: {
  actorUserId?: string | null;
  applicationId?: string | null;
  clientId: string;
  eventId: string;
  recipientName?: string | null;
}) {
  const supabase = createAdminClient();
  const [
    { data: client, error: clientError },
    { data: event, error: eventError },
    { data: ownerProfiles, error: profileError },
  ] = await Promise.all([
    supabase.from("clients").select("id, status").eq("id", input.clientId).single(),
    supabase
      .from("rsvp_events")
      .select("client_id, id")
      .eq("id", input.eventId)
      .eq("client_id", input.clientId)
      .single(),
    supabase
      .from("profiles")
      .select("email, full_name, id, is_active, role")
      .eq("client_id", input.clientId)
      .eq("role", "client_owner")
      .limit(2),
  ]);

  assertServiceSuccess(clientError, "Failed to verify the client before password setup.");
  assertServiceData(client, "The client does not exist for password setup.");
  assertServiceSuccess(eventError, "Failed to verify the event before password setup.");
  assertServiceData(event, "The event does not exist for password setup.");
  assertServiceSuccess(profileError, "Failed to verify the client owner before password setup.");

  if (!clientStatusAllowsDashboardAccess(client.status)) {
    throw new ServiceError(
      "Password setup cannot be sent while this client does not have dashboard access.",
    );
  }

  if ((ownerProfiles?.length ?? 0) !== 1 || !ownerProfiles?.[0]?.is_active) {
    throw new ServiceError("Password setup requires exactly one active client owner profile.");
  }

  if (input.applicationId) {
    const { data: application, error: applicationError } = await supabase
      .from("rsvp_applications")
      .select("approved_client_id, approved_event_id, id, status")
      .eq("id", input.applicationId)
      .single();

    assertServiceSuccess(
      applicationError,
      "Failed to verify the application before password setup.",
    );
    assertServiceData(application, "The application does not exist for password setup.");

    if (
      application.status !== "approved" ||
      application.approved_client_id !== input.clientId ||
      application.approved_event_id !== input.eventId
    ) {
      throw new ServiceError(
        "Password setup was blocked because the application links are incomplete.",
      );
    }
  }

  const ownerProfile = ownerProfiles[0];
  const queuedLog = await queuePasswordEmailLog({
    applicationId: input.applicationId ?? null,
    clientId: input.clientId,
    eventId: input.eventId,
    emailType: "client_password_setup",
    recipientEmail: ownerProfile.email,
    recipientName: input.recipientName ?? ownerProfile.full_name,
    subject: CLIENT_PASSWORD_SETUP_SUBJECT,
  });
  let setupUrl: string;

  try {
    setupUrl = await generateClientPasswordLink({
      actorUserId: input.actorUserId ?? null,
      applicationId: input.applicationId ?? null,
      authUserId: ownerProfile.id,
      clientId: input.clientId,
      email: ownerProfile.email,
      eventId: input.eventId,
      intent: "password_setup",
    });
  } catch (error) {
    await finalizePasswordEmailLog(queuedLog.id, {
      errorMessage: "The secure password setup link could not be issued.",
      status: "failed",
    });
    throw error;
  }

  return sendOnboardingEmail({
    applicationId: input.applicationId ?? null,
    clientId: input.clientId,
    emailLogId: queuedLog.id,
    eventId: input.eventId,
    recipientEmail: ownerProfile.email,
    recipientName: input.recipientName ?? ownerProfile.full_name,
    setupUrl,
  });
}

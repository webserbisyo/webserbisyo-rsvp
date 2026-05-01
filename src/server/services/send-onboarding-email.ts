import "server-only";

import { buildClientAccessEmail } from "@/server/email/templates/client-access";
import { createResendClient } from "@/lib/resend";
import { createAdminClient } from "@/lib/supabase/admin";
import type { TablesInsert } from "@/lib/supabase/types";
import { writeEmailLog } from "./write-email-log";

export type SendOnboardingEmailInput = {
  applicationId?: string | null;
  clientId: string;
  eventId: string;
  mode?: "onboarding" | "password_reset";
  note?: string | null;
  recipientEmail: string;
  recipientName?: string | null;
  temporaryPassword: string;
};

export type SendOnboardingEmailResult = {
  id: string | null;
  logWritten: boolean;
  recipientEmail: string;
  status: TablesInsert<"email_logs">["status"];
  warning?: string;
};

type EmailSummary = {
  clientName: string;
  dashboardUrl: string;
  eventDate: string | null;
  eventTitle: string;
  eventType: string | null;
  loginEmail: string;
  planLabel: string;
  roleLabel: string;
  supportEmail: string | null;
};

export async function sendOnboardingEmail(input: SendOnboardingEmailInput) {
  const summary = await getEmailSummary(input.clientId, input.eventId, input.recipientEmail);
  const mode = input.mode ?? "onboarding";
  const content = buildClientAccessEmail({
    clientName: summary.clientName,
    dashboardUrl: summary.dashboardUrl,
    eventDate: summary.eventDate,
    eventTitle: summary.eventTitle,
    eventType: summary.eventType,
    loginEmail: summary.loginEmail,
    mode,
    planLabel: summary.planLabel,
    recipientName: input.recipientName ?? summary.clientName,
    replyToEmail: process.env.RESEND_REPLY_TO_EMAIL ?? null,
    roleLabel: summary.roleLabel,
    supportEmail: summary.supportEmail,
    temporaryPassword: input.temporaryPassword,
  });

  if (!process.env.RESEND_API_KEY || !process.env.RESEND_FROM_EMAIL) {
    return writeOnboardingLog({
      applicationId: input.applicationId ?? null,
      clientId: input.clientId,
      emailType: "client_onboarding",
      errorMessage: "RESEND_API_KEY or RESEND_FROM_EMAIL is not configured.",
      eventId: input.eventId,
      recipientEmail: input.recipientEmail,
      recipientName: input.recipientName ?? null,
      status: "skipped",
      subject: content.subject,
    });
  }

  try {
    const resend = createResendClient();
    const result = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL,
      html: content.html,
      replyTo: process.env.RESEND_REPLY_TO_EMAIL || undefined,
      subject: content.subject,
      text: content.text,
      to: input.recipientEmail,
    });

    if (result.error) {
      return writeOnboardingLog({
        applicationId: input.applicationId ?? null,
        clientId: input.clientId,
        emailType: "client_onboarding",
        errorMessage: result.error.message,
        eventId: input.eventId,
        recipientEmail: input.recipientEmail,
        recipientName: input.recipientName ?? null,
        status: "failed",
        subject: content.subject,
      });
    }

    return writeOnboardingLog({
      applicationId: input.applicationId ?? null,
      clientId: input.clientId,
      emailType: "client_onboarding",
      eventId: input.eventId,
      providerMessageId: result.data?.id ?? null,
      recipientEmail: input.recipientEmail,
      recipientName: input.recipientName ?? null,
      sentAt: new Date().toISOString(),
      status: "sent",
      subject: content.subject,
    });
  } catch (error) {
    return writeOnboardingLog({
      applicationId: input.applicationId ?? null,
      clientId: input.clientId,
      emailType: "client_onboarding",
      errorMessage: error instanceof Error ? error.message : "Unknown email failure.",
      eventId: input.eventId,
      recipientEmail: input.recipientEmail,
      recipientName: input.recipientName ?? null,
      status: "failed",
      subject: content.subject,
    });
  }
}

async function getEmailSummary(
  clientId: string,
  eventId: string,
  fallbackEmail: string,
): Promise<EmailSummary> {
  const supabase = createAdminClient();
  const [
    { data: client, error: clientError },
    { data: event, error: eventError },
    { data: ownerProfile, error: profileError },
  ] = await Promise.all([
    supabase.from("clients").select("name, plan_type").eq("id", clientId).single(),
    supabase.from("rsvp_events").select("event_date, event_type, title").eq("id", eventId).single(),
    supabase
      .from("profiles")
      .select("email, role")
      .eq("client_id", clientId)
      .in("role", ["client_owner", "client_staff"])
      .eq("is_active", true)
      .order("role", { ascending: true })
      .limit(1)
      .maybeSingle(),
  ]);

  if (clientError) {
    throw clientError;
  }

  if (eventError) {
    throw eventError;
  }

  if (profileError) {
    throw profileError;
  }

  return {
    clientName: client.name,
    dashboardUrl: buildDashboardUrl(),
    eventDate: event.event_date,
    eventTitle: event.title,
    eventType: event.event_type,
    loginEmail: ownerProfile?.email ?? fallbackEmail,
    planLabel: formatPlanLabel(client.plan_type),
    roleLabel: ownerProfile?.role ? formatRoleLabel(ownerProfile.role) : "Client owner",
    supportEmail:
      process.env.RESEND_REPLY_TO_EMAIL ?? process.env.RESEND_FROM_EMAIL ?? "WebSerbisyo RSVP",
  };
}

async function writeOnboardingLog(
  input: Parameters<typeof writeEmailLog>[0],
): Promise<SendOnboardingEmailResult> {
  try {
    const emailLog = await writeEmailLog(input);

    return {
      id: emailLog.id,
      logWritten: true,
      recipientEmail: emailLog.recipient_email,
      status: emailLog.status,
    };
  } catch (error) {
    return {
      id: null,
      logWritten: false,
      recipientEmail: input.recipientEmail,
      status: input.status,
      warning:
        error instanceof Error
          ? `Email log could not be written: ${error.message}`
          : "Email log could not be written.",
    };
  }
}

function buildDashboardUrl() {
  const baseUrl = process.env.APP_BASE_URL ?? process.env.NEXT_PUBLIC_APP_URL;

  if (!baseUrl) {
    return "/dashboard";
  }

  return `${baseUrl.replace(/\/+$/, "")}/dashboard`;
}

function formatPlanLabel(value: string) {
  return value === "max" ? "Max" : "Pro";
}

function formatRoleLabel(value: string) {
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

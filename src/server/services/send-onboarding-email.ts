import "server-only";

import { formatUserRoleLabel } from "@/lib/auth/role-labels";
import { buildClientAccessEmail } from "@/server/email/templates/client-access";
import { createResendClient } from "@/lib/resend";
import { createAdminClient } from "@/lib/supabase/admin";
import type { TablesInsert } from "@/lib/supabase/types";
import { finalizePasswordEmailLog } from "./write-email-log";

export type SendOnboardingEmailInput = {
  applicationId?: string | null;
  clientId: string;
  emailLogId: string;
  eventId: string;
  recipientEmail: string;
  recipientName?: string | null;
  setupUrl: string;
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
  eventType: string | null;
  loginEmail: string;
  messengerUrl: string | null;
  planLabel: string;
  roleLabel: string;
  supportEmail: string | null;
};

export async function sendOnboardingEmail(input: SendOnboardingEmailInput) {
  const summary = await getEmailSummary(input.clientId, input.eventId, input.recipientEmail);
  const content = buildClientAccessEmail({
    clientName: summary.clientName,
    dashboardUrl: summary.dashboardUrl,
    eventDate: summary.eventDate,
    eventType: summary.eventType,
    loginEmail: summary.loginEmail,
    messengerUrl: summary.messengerUrl,
    planLabel: summary.planLabel,
    recipientName: input.recipientName ?? summary.clientName,
    replyToEmail: process.env.RESEND_REPLY_TO_EMAIL ?? null,
    roleLabel: summary.roleLabel,
    setupUrl: input.setupUrl,
    supportEmail: summary.supportEmail,
  });
  if (!process.env.RESEND_API_KEY || !process.env.RESEND_FROM_EMAIL) {
    const emailLog = await finalizePasswordEmailLog(input.emailLogId, {
      errorMessage: "RESEND_API_KEY or RESEND_FROM_EMAIL is not configured.",
      status: "skipped",
    });
    return toOnboardingResult(emailLog);
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
      const emailLog = await finalizePasswordEmailLog(input.emailLogId, {
        errorMessage: result.error.message,
        status: "failed",
      });
      return toOnboardingResult(emailLog);
    }

    const emailLog = await finalizePasswordEmailLog(input.emailLogId, {
      providerMessageId: result.data?.id ?? null,
      sentAt: new Date().toISOString(),
      status: "sent",
    });
    return toOnboardingResult(emailLog);
  } catch (error) {
    const emailLog = await finalizePasswordEmailLog(input.emailLogId, {
      errorMessage: error instanceof Error ? error.message : "Unknown email failure.",
      status: "failed",
    });
    return toOnboardingResult(emailLog);
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
    { data: settings, error: settingsError },
  ] = await Promise.all([
    supabase.from("clients").select("name, plan_type").eq("id", clientId).single(),
    supabase.from("rsvp_events").select("event_date, event_type").eq("id", eventId).single(),
    supabase
      .from("profiles")
      .select("email, role")
      .eq("client_id", clientId)
      .in("role", ["client_owner", "client_staff"])
      .eq("is_active", true)
      .order("role", { ascending: true })
      .limit(1)
      .maybeSingle(),
    supabase.from("platform_public_settings").select("messenger_page_url").maybeSingle(),
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
    eventType: event.event_type,
    loginEmail: ownerProfile?.email ?? fallbackEmail,
    messengerUrl: settingsError ? null : settings?.messenger_page_url?.trim() || null,
    planLabel: formatPlanLabel(client.plan_type),
    roleLabel: ownerProfile?.role ? formatUserRoleLabel(ownerProfile.role) : "Client Admin",
    supportEmail: process.env.RESEND_REPLY_TO_EMAIL ?? "webserbisyo@gmail.com",
  };
}

function toOnboardingResult(emailLog: {
  id: string;
  recipient_email: string;
  status: string;
}): SendOnboardingEmailResult {
  return {
    id: emailLog.id,
    logWritten: true,
    recipientEmail: emailLog.recipient_email,
    status: emailLog.status,
  };
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

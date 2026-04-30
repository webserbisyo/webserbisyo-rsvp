import "server-only";

import { createResendClient } from "@/lib/resend";
import type { TablesInsert } from "@/lib/supabase/types";
import { writeEmailLog } from "./write-email-log";

export type SendOnboardingEmailInput = {
  applicationId?: string | null;
  clientId: string;
  eventId: string;
  eventSlug: string;
  note?: string | null;
  recipientEmail: string;
  recipientName?: string | null;
};

export type SendOnboardingEmailResult = {
  id: string | null;
  logWritten: boolean;
  recipientEmail: string;
  status: TablesInsert<"email_logs">["status"];
  warning?: string;
};

export async function sendOnboardingEmail(input: SendOnboardingEmailInput) {
  const subject = "Your WebSerbisyo RSVP project is ready";

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
      subject,
    });
  }

  try {
    const resend = createResendClient();
    const result = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL,
      subject,
      to: input.recipientEmail,
      text: [
        `Hi ${input.recipientName ?? "there"},`,
        "",
        "Your WebSerbisyo RSVP workspace has been provisioned.",
        `Public event slug: ${input.eventSlug}`,
        input.note ? "" : null,
        input.note ? `Admin note: ${input.note}` : null,
        "",
        "Use the Supabase invite email to finish account setup.",
      ]
        .filter((line): line is string => line !== null)
        .join("\n"),
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
        subject,
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
      subject,
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
      subject,
    });
  }
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

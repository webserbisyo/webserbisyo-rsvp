import "server-only";

import { createResendClient } from "@/lib/resend";
import { writeEmailLog } from "./write-email-log";

export type SendOnboardingEmailInput = {
  applicationId?: string | null;
  clientId: string;
  eventId: string;
  eventSlug: string;
  recipientEmail: string;
  recipientName?: string | null;
};

export async function sendOnboardingEmail(input: SendOnboardingEmailInput) {
  const subject = "Your WebSerbisyo RSVP project is ready";

  if (!process.env.RESEND_API_KEY || !process.env.RESEND_FROM_EMAIL) {
    return writeEmailLog({
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
        "",
        "Use the Supabase invite email to finish account setup.",
      ].join("\n"),
    });

    if (result.error) {
      return writeEmailLog({
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

    return writeEmailLog({
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
    return writeEmailLog({
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

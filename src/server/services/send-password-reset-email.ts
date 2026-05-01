import "server-only";

import { buildPasswordResetEmail } from "@/server/email/templates/password-reset";
import { createResendClient } from "@/lib/resend";
import { writeEmailLog } from "./write-email-log";

type SendPasswordResetEmailInput = {
  clientId: string;
  eventId?: string | null;
  recipientEmail: string;
  recipientName?: string | null;
  resetUrl: string;
};

export async function sendPasswordResetEmail(input: SendPasswordResetEmailInput) {
  const content = buildPasswordResetEmail({
    clientFirstName: getFirstName(input.recipientName ?? input.recipientEmail),
    resetUrl: input.resetUrl,
    supportEmail: process.env.RESEND_REPLY_TO_EMAIL ?? process.env.RESEND_FROM_EMAIL ?? null,
  });

  if (!process.env.RESEND_API_KEY || !process.env.RESEND_FROM_EMAIL) {
    return writePasswordResetLog({
      clientId: input.clientId,
      emailType: "client_onboarding",
      errorMessage: "RESEND_API_KEY or RESEND_FROM_EMAIL is not configured.",
      eventId: input.eventId ?? null,
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
      return writePasswordResetLog({
        clientId: input.clientId,
        emailType: "client_onboarding",
        errorMessage: result.error.message,
        eventId: input.eventId ?? null,
        recipientEmail: input.recipientEmail,
        recipientName: input.recipientName ?? null,
        status: "failed",
        subject: content.subject,
      });
    }

    return writePasswordResetLog({
      clientId: input.clientId,
      emailType: "client_onboarding",
      eventId: input.eventId ?? null,
      providerMessageId: result.data?.id ?? null,
      recipientEmail: input.recipientEmail,
      recipientName: input.recipientName ?? null,
      sentAt: new Date().toISOString(),
      status: "sent",
      subject: content.subject,
    });
  } catch (error) {
    return writePasswordResetLog({
      clientId: input.clientId,
      emailType: "client_onboarding",
      errorMessage: error instanceof Error ? error.message : "Unknown email failure.",
      eventId: input.eventId ?? null,
      recipientEmail: input.recipientEmail,
      recipientName: input.recipientName ?? null,
      status: "failed",
      subject: content.subject,
    });
  }
}

async function writePasswordResetLog(input: Parameters<typeof writeEmailLog>[0]) {
  try {
    return await writeEmailLog(input);
  } catch {
    return null;
  }
}

function getFirstName(value: string) {
  const trimmed = value.trim();

  return trimmed.split(/\s+/)[0] || "there";
}

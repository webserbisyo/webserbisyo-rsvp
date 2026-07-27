import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { buildPasswordResetEmail } from "@/server/email/templates/password-reset";
import { createResendClient } from "@/lib/resend";
import { finalizePasswordEmailLog } from "./write-email-log";

type SendPasswordResetEmailInput = {
  clientId: string;
  emailLogId: string;
  eventId?: string | null;
  recipientEmail: string;
  recipientName?: string | null;
  resetUrl: string;
};

export async function sendPasswordResetEmail(input: SendPasswordResetEmailInput) {
  const supportDetails = await getSupportDetails();
  const content = buildPasswordResetEmail({
    clientFirstName: getFirstName(input.recipientName ?? input.recipientEmail),
    messengerUrl: supportDetails.messengerUrl,
    resetUrl: input.resetUrl,
    supportEmail: supportDetails.supportEmail,
  });
  if (!process.env.RESEND_API_KEY || !process.env.RESEND_FROM_EMAIL) {
    return finalizePasswordEmailLog(input.emailLogId, {
      errorMessage: "RESEND_API_KEY or RESEND_FROM_EMAIL is not configured.",
      status: "skipped",
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
      return finalizePasswordEmailLog(input.emailLogId, {
        errorMessage: result.error.message,
        status: "failed",
      });
    }

    return finalizePasswordEmailLog(input.emailLogId, {
      providerMessageId: result.data?.id ?? null,
      sentAt: new Date().toISOString(),
      status: "sent",
    });
  } catch (error) {
    return finalizePasswordEmailLog(input.emailLogId, {
      errorMessage: error instanceof Error ? error.message : "Unknown email failure.",
      status: "failed",
    });
  }
}

function getFirstName(value: string) {
  const trimmed = value.trim();

  return trimmed.split(/\s+/)[0] || "there";
}

async function getSupportDetails() {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("platform_public_settings")
    .select("messenger_page_url")
    .maybeSingle();

  return {
    messengerUrl: error ? null : data?.messenger_page_url?.trim() || null,
    supportEmail: process.env.RESEND_REPLY_TO_EMAIL ?? "webserbisyo@gmail.com",
  };
}

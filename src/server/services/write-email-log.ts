import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import type { TablesInsert } from "@/lib/supabase/types";
import { ServiceError, assertServiceData, assertServiceSuccess } from "./service-error";

export type WriteEmailLogInput = {
  applicationId?: string | null;
  clientId?: string | null;
  emailType: TablesInsert<"email_logs">["email_type"];
  errorMessage?: string | null;
  eventId?: string | null;
  providerMessageId?: string | null;
  recipientEmail: string;
  recipientName?: string | null;
  sentAt?: string | null;
  status: TablesInsert<"email_logs">["status"];
  subject?: string | null;
};

export async function writeEmailLog(input: WriteEmailLogInput) {
  const supabase = createAdminClient();
  const row: TablesInsert<"email_logs"> = {
    application_id: input.applicationId ?? null,
    client_id: input.clientId ?? null,
    email_type: input.emailType,
    error_message: input.errorMessage ?? null,
    event_id: input.eventId ?? null,
    provider: "resend",
    provider_message_id: input.providerMessageId ?? null,
    recipient_email: input.recipientEmail,
    recipient_name: input.recipientName ?? null,
    sent_at: input.sentAt ?? null,
    status: input.status,
    subject: input.subject ?? null,
  };

  const { data, error } = await supabase.from("email_logs").insert(row).select("*").single();

  assertServiceSuccess(error, "Failed to write email log.");
  assertServiceData(data, "Email log insert returned no row.");

  return data;
}

export async function queuePasswordEmailLog(input: Omit<WriteEmailLogInput, "status">) {
  const supabase = createAdminClient();
  const staleBefore = new Date(Date.now() - 10 * 60_000).toISOString();

  await supabase
    .from("email_logs")
    .update({
      error_message: "Stale queued email attempt closed before retry.",
      status: "failed",
    })
    .eq("client_id", input.clientId ?? "")
    .in("email_type", ["client_password_setup", "client_password_recovery"])
    .eq("status", "queued")
    .lt("created_at", staleBefore);

  const { data, error } = await supabase
    .from("email_logs")
    .insert({
      application_id: input.applicationId ?? null,
      client_id: input.clientId ?? null,
      email_type: input.emailType,
      error_message: null,
      event_id: input.eventId ?? null,
      provider: "resend",
      recipient_email: input.recipientEmail,
      recipient_name: input.recipientName ?? null,
      status: "queued",
      subject: input.subject ?? null,
    })
    .select("*")
    .single();

  if (error?.code === "23505") {
    throw new ServiceError("A password email is already being prepared for this client.");
  }

  assertServiceSuccess(error, "Failed to queue password email.");
  assertServiceData(data, "Queued password email returned no row.");

  return data;
}

export async function finalizePasswordEmailLog(
  emailLogId: string,
  input: {
    errorMessage?: string | null;
    providerMessageId?: string | null;
    sentAt?: string | null;
    status: "failed" | "sent" | "skipped";
  },
) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("email_logs")
    .update({
      error_message: input.errorMessage ?? null,
      provider_message_id: input.providerMessageId ?? null,
      sent_at: input.sentAt ?? null,
      status: input.status,
    })
    .eq("id", emailLogId)
    .select("*")
    .single();

  assertServiceSuccess(error, "Failed to finalize password email log.");
  assertServiceData(data, "Finalized password email log returned no row.");

  return data;
}

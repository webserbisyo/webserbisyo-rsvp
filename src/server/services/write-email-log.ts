import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import type { TablesInsert } from "@/lib/supabase/types";
import { assertServiceData, assertServiceSuccess } from "./service-error";

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

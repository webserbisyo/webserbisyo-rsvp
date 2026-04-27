import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import type { TablesInsert } from "@/lib/supabase/types";
import { assertServiceData, assertServiceSuccess } from "./service-error";
import { writeAuditLog } from "./write-audit-log";

export type RecordOneTimePaymentInput = {
  actorUserId: string;
  amountDue: number;
  amountPaid: number;
  applicationId: string;
  clientId: string;
  eventId: string;
  hostingEndsAt: string;
  hostingStartsAt: string;
  notes?: string | null;
  paidAt?: string | null;
  paymentMethod?: string | null;
  planType: "pro" | "max";
  referenceNumber?: string | null;
  renewalRequiredAt?: string | null;
};

export async function recordOneTimePayment(input: RecordOneTimePaymentInput) {
  const supabase = createAdminClient();
  const paidAt = input.paidAt ?? new Date().toISOString();
  const row: TablesInsert<"payments"> = {
    amount_due: input.amountDue,
    amount_paid: input.amountPaid,
    application_id: input.applicationId,
    client_id: input.clientId,
    confirmed_by: input.actorUserId,
    event_id: input.eventId,
    hosting_ends_at: input.hostingEndsAt,
    hosting_starts_at: input.hostingStartsAt,
    notes: input.notes ?? null,
    paid_at: paidAt,
    payment_method: input.paymentMethod ?? "manual",
    payment_status: "paid",
    plan_type: input.planType,
    reference_number: input.referenceNumber ?? null,
    renewal_required_at: input.renewalRequiredAt ?? null,
  };

  const { data: payment, error: paymentError } = await supabase
    .from("payments")
    .upsert(row, { onConflict: "application_id" })
    .select("*")
    .single();

  assertServiceSuccess(paymentError, "Failed to record one-time payment.");
  assertServiceData(payment, "Payment upsert returned no row.");

  const { error: clientError } = await supabase
    .from("clients")
    .update({
      hosting_ends_at: input.hostingEndsAt,
      hosting_starts_at: input.hostingStartsAt,
      renewal_required_at: input.renewalRequiredAt ?? null,
      status: "active",
    })
    .eq("id", input.clientId);

  assertServiceSuccess(clientError, "Failed to update client hosting mirror fields.");

  await writeAuditLog({
    action: "payment_confirmed",
    actorUserId: input.actorUserId,
    clientId: input.clientId,
    entityId: payment.id,
    entityType: "payments",
    eventId: input.eventId,
    metadata: {
      amount_due: input.amountDue,
      amount_paid: input.amountPaid,
      payment_method: row.payment_method,
      reference_number: row.reference_number,
    },
  });

  return payment;
}

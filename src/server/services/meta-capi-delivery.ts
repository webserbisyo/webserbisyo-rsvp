import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

export type MetaCapiDeliveryClaim =
  | {
      attempts: number;
      claimToken: string;
      deliveryId: string;
      state: "claimed";
    }
  | {
      attempts: number;
      deliveryId: string;
      state: "already_sent" | "busy";
    };

export async function claimMetaCapiPurchaseDelivery(input: {
  eventId: string;
  paymentId: string;
}): Promise<MetaCapiDeliveryClaim> {
  const supabase = createAdminClient();
  const { data, error } = await supabase.rpc("claim_meta_capi_delivery", {
    p_entity_id: input.paymentId,
    p_entity_type: "payments",
    p_event_id: input.eventId,
    p_event_name: "Purchase",
    p_provider: "meta",
  });

  if (error) {
    throw error;
  }

  const claim = data?.[0];

  if (!claim) {
    throw new Error("Meta CAPI delivery claim returned no row.");
  }

  if (claim.claim_acquired && claim.claim_token) {
    return {
      attempts: claim.attempt_count,
      claimToken: claim.claim_token,
      deliveryId: claim.delivery_id,
      state: "claimed",
    };
  }

  return {
    attempts: claim.attempt_count,
    deliveryId: claim.delivery_id,
    state: claim.delivery_status === "sent" ? "already_sent" : "busy",
  };
}

export async function completeMetaCapiPurchaseDelivery(input: {
  claimToken: string;
  deliveryId: string;
  failureCode?: string | null;
  outcome: "failed" | "sent";
}) {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("meta_capi_deliveries")
    .update({
      claim_token: null,
      last_error_code:
        input.outcome === "failed" ? (input.failureCode ?? "meta_request_failed") : null,
      sent_at: input.outcome === "sent" ? new Date().toISOString() : null,
      status: input.outcome,
    })
    .eq("id", input.deliveryId)
    .eq("claim_token", input.claimToken)
    .eq("status", "sending");

  if (error) {
    throw error;
  }
}

import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { assertServiceSuccess, ServiceError } from "./service-error";
import { writeAuditLog } from "./write-audit-log";

type ModerateRsvpResponseInput = {
  actorUserId: string;
  clientId: string;
  mode: "approve" | "reject";
  responseIds: string[];
};

export async function moderateRsvpResponses(input: ModerateRsvpResponseInput) {
  const supabase = createAdminClient();

  if (input.mode === "reject") {
    const { data: results, error } = await supabase
      .from("rsvp_responses")
      .update({
        host_confirmation_status: "pending",
        host_confirmed_at: null,
        host_confirmed_by: null,
        review_status: "rejected",
        updated_at: new Date().toISOString(),
      })
      .eq("client_id", input.clientId)
      .in("id", input.responseIds)
      .select("id, event_id");

    assertServiceSuccess(error, "Failed to reject RSVP responses.");

    if (results && results.length > 0) {
      await Promise.all(
        results.map((row) =>
          writeAuditLog({
            action: "rsvp_response_rejected",
            actorUserId: input.actorUserId,
            clientId: input.clientId,
            entityId: row.id,
            entityType: "rsvp_responses",
            eventId: row.event_id,
            metadata: { confirmation_cleared: true },
          }),
        ),
      );
    }

    return { count: results?.length ?? 0 };
  }

  // mode === "approve" (Restore)
  // We process them one by one to ensure transaction-safe capacity check via RPC
  let successCount = 0;
  for (const id of input.responseIds) {
    const { data: response, error } = await supabase.rpc(
      "approve_rsvp_response_with_capacity_check",
      {
        p_client_id: input.clientId,
        p_response_id: id,
      },
    );

    if (error) {
      if (error.message?.includes("CAPACITY_EXCEEDED")) {
        throw new ServiceError("Cannot restore RSVP. Guest limit reached for this event.", {
          code: "CAPACITY_EXCEEDED",
        });
      }
      assertServiceSuccess(error, "Failed to approve RSVP response.");
    }

    if (response) {
      successCount += 1;
      await writeAuditLog({
        action: "rsvp_response_approved",
        actorUserId: input.actorUserId,
        clientId: input.clientId,
        entityId: response.id,
        entityType: "rsvp_responses",
        eventId: response.event_id,
      });
    }
  }

  return { count: successCount };
}

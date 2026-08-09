import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import type { Tables } from "@/lib/supabase/types";
import { ServiceError } from "./service-error";
import { writeAuditLog } from "./write-audit-log";

type ConfirmationMode = "confirm" | "unconfirm";
type CurrentEventRecord = Pick<Tables<"rsvp_events">, "client_id" | "event_slug" | "id">;
type ConfirmationRow = Pick<
  Tables<"rsvp_responses">,
  | "archived_at"
  | "attendance_status"
  | "event_id"
  | "host_confirmation_status"
  | "host_confirmed_at"
  | "host_confirmed_by"
  | "id"
  | "review_status"
  | "updated_at"
>;

export type ConfirmRsvpResponsesInput = {
  actorUserId: string;
  clientId: string;
  mode: ConfirmationMode;
  responseIds: string[];
};

export async function confirmRsvpResponses(input: ConfirmRsvpResponsesInput) {
  if (!input.clientId) {
    throw new ServiceError("A tenant client account is required to manage the final guest list.");
  }

  const supabase = createAdminClient();
  const currentEvent = await getCurrentTenantEvent(supabase, input.clientId);
  const requestedIds = Array.from(new Set(input.responseIds));

  const { data, error } = await supabase
    .from("rsvp_responses")
    .select(
      "id, event_id, attendance_status, review_status, archived_at, host_confirmation_status, host_confirmed_at, host_confirmed_by, updated_at",
    )
    .eq("client_id", input.clientId)
    .eq("event_id", currentEvent.id)
    .in("id", requestedIds)
    .is("archived_at", null);

  if (error) {
    throw new ServiceError("Failed to load RSVP responses for final-list confirmation.", error);
  }

  const rows = (data ?? []) as ConfirmationRow[];
  const skippedUnauthorizedCount = Math.max(0, requestedIds.length - rows.length);
  const eligibleRows = rows.filter((row) =>
    input.mode === "confirm"
      ? row.attendance_status === "attending" && row.review_status === "approved"
      : row.host_confirmation_status === "confirmed",
  );
  const skippedIneligibleCount = rows.length - eligibleRows.length;
  const targetStatus = input.mode === "confirm" ? "confirmed" : "pending";
  const rowsToUpdate = eligibleRows.filter((row) => row.host_confirmation_status !== targetStatus);
  const skippedAlreadySetCount = eligibleRows.length - rowsToUpdate.length;

  if (rowsToUpdate.length === 0) {
    return {
      currentEventSlug: currentEvent.event_slug,
      skippedAlreadySetCount,
      skippedIneligibleCount,
      skippedUnauthorizedCount,
      updated: [],
      updatedCount: 0,
    };
  }

  const idsToUpdate = rowsToUpdate.map((row) => row.id);
  const now = new Date().toISOString();
  const { data: updatedRows, error: updateError } = await supabase
    .from("rsvp_responses")
    .update(
      input.mode === "confirm"
        ? {
            host_confirmation_status: "confirmed",
            host_confirmed_at: now,
            host_confirmed_by: input.actorUserId,
          }
        : {
            host_confirmation_status: "pending",
            host_confirmed_at: null,
            host_confirmed_by: null,
          },
    )
    .eq("client_id", input.clientId)
    .eq("event_id", currentEvent.id)
    .in("id", idsToUpdate)
    .eq("review_status", "approved")
    .eq("attendance_status", "attending")
    .is("archived_at", null)
    .select("id, host_confirmation_status, host_confirmed_at, host_confirmed_by, updated_at");

  if (updateError) {
    throw new ServiceError("Failed to update final guest-list confirmation.", updateError);
  }

  const updated = updatedRows ?? [];
  await writeAuditLog({
    action: input.mode === "confirm" ? "rsvp_guest_confirmed" : "rsvp_guest_unconfirmed",
    actorUserId: input.actorUserId,
    clientId: input.clientId,
    entityType: "rsvp_responses",
    eventId: currentEvent.id,
    metadata: {
      response_ids: updated.map((row) => row.id),
      skipped_already_set_count: skippedAlreadySetCount,
      skipped_ineligible_count: skippedIneligibleCount,
      skipped_unauthorized_count: skippedUnauthorizedCount,
      updated_count: updated.length,
    },
  });

  return {
    currentEventSlug: currentEvent.event_slug,
    skippedAlreadySetCount,
    skippedIneligibleCount,
    skippedUnauthorizedCount,
    updated: updated.map((row) => ({
      hostConfirmationStatus: (row.host_confirmation_status === "confirmed"
        ? "confirmed"
        : "pending") as "confirmed" | "pending",
      hostConfirmedAt: row.host_confirmed_at,
      hostConfirmedBy: row.host_confirmed_by,
      id: row.id,
      updatedAt: row.updated_at,
    })),
    updatedCount: updated.length,
  };
}

async function getCurrentTenantEvent(
  supabase: ReturnType<typeof createAdminClient>,
  clientId: string,
): Promise<CurrentEventRecord> {
  const { data: event, error } = await supabase
    .from("rsvp_events")
    .select("id, client_id, event_slug")
    .eq("client_id", clientId)
    .is("archived_at", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new ServiceError("Failed to resolve the current RSVP event.", error);
  }

  if (!event) {
    throw new ServiceError("No active RSVP event is available for final-list confirmation.");
  }

  return event;
}

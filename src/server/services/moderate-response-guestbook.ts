import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import type { Tables } from "@/lib/supabase/types";
import { assertServiceData, ServiceError } from "./service-error";
import { writeAuditLog } from "./write-audit-log";

type GuestbookModerationMode = "approve" | "remove";
type GuestbookStatus = "approved" | "hidden" | "pending_review" | "private";

type CurrentEventRecord = Pick<Tables<"rsvp_events">, "client_id" | "event_slug" | "id">;
type ResponseModerationRecord = Pick<
  Tables<"rsvp_responses">,
  | "archived_at"
  | "client_id"
  | "event_id"
  | "id"
  | "message"
  | "message_approved_at"
  | "message_approved_by"
  | "message_public_consent"
  | "message_public_status"
  | "updated_at"
>;

type UpdatedResponseRecord = Pick<
  Tables<"rsvp_responses">,
  | "id"
  | "message_approved_at"
  | "message_approved_by"
  | "message_public_consent"
  | "message_public_status"
  | "updated_at"
>;

export type ModerateResponseGuestbookInput = {
  actorUserId: string;
  clientId: string;
  mode: GuestbookModerationMode;
  responseIds: string[];
};

export type ModerateResponseGuestbookResult = {
  currentEventId: string;
  currentEventSlug: string;
  skippedAlreadySetCount: number;
  skippedNoMessageCount: number;
  skippedUnauthorizedCount: number;
  updated: Array<{
    id: string;
    messageApprovedAt: string | null;
    messageApprovedBy: string | null;
    messagePublicConsent: boolean;
    messagePublicStatus: GuestbookStatus;
    updatedAt: string;
  }>;
  updatedCount: number;
};

export async function moderateResponseGuestbookMessages(
  input: ModerateResponseGuestbookInput,
): Promise<ModerateResponseGuestbookResult> {
  if (!input.clientId) {
    throw new ServiceError("A tenant client account is required for guestbook moderation.");
  }

  const supabase = createAdminClient();
  const currentEvent = await getCurrentTenantEvent(supabase, input.clientId);
  const requestedIds = Array.from(new Set(input.responseIds));

  if (requestedIds.length === 0) {
    return {
      currentEventId: currentEvent.id,
      currentEventSlug: currentEvent.event_slug,
      skippedAlreadySetCount: 0,
      skippedNoMessageCount: 0,
      skippedUnauthorizedCount: 0,
      updated: [],
      updatedCount: 0,
    };
  }

  const { data: responseRows, error } = await supabase
    .from("rsvp_responses")
    .select(
      "id, client_id, event_id, message, message_public_status, message_public_consent, message_approved_at, message_approved_by, updated_at, archived_at",
    )
    .eq("client_id", input.clientId)
    .eq("event_id", currentEvent.id)
    .in("id", requestedIds)
    .is("archived_at", null);

  if (error) {
    throw new ServiceError("Failed to load RSVP responses for guestbook moderation.", error);
  }

  const ownedRows = (responseRows ?? []) as ResponseModerationRecord[];
  const skippedUnauthorizedCount = Math.max(0, requestedIds.length - ownedRows.length);
  const rowsWithMessage = ownedRows.filter((row) => hasMessage(row.message));
  const skippedNoMessageCount = ownedRows.length - rowsWithMessage.length;
  const targetStatus = input.mode === "approve" ? "approved" : "private";
  const rowsToUpdate = rowsWithMessage.filter((row) => row.message_public_status !== targetStatus);
  const skippedAlreadySetCount = rowsWithMessage.length - rowsToUpdate.length;

  if (rowsToUpdate.length === 0) {
    return {
      currentEventId: currentEvent.id,
      currentEventSlug: currentEvent.event_slug,
      skippedAlreadySetCount,
      skippedNoMessageCount,
      skippedUnauthorizedCount,
      updated: [],
      updatedCount: 0,
    };
  }

  const nextApprovedAt = input.mode === "approve" ? new Date().toISOString() : null;
  const nextApprovedBy = input.mode === "approve" ? input.actorUserId : null;
  const idsToUpdate = rowsToUpdate.map((row) => row.id);
  const { data: updatedRows, error: updateError } = await supabase
    .from("rsvp_responses")
    .update({
      message_approved_at: nextApprovedAt,
      message_approved_by: nextApprovedBy,
      message_public_status: targetStatus,
    })
    .eq("client_id", input.clientId)
    .eq("event_id", currentEvent.id)
    .in("id", idsToUpdate)
    .select(
      "id, message_public_status, message_public_consent, message_approved_at, message_approved_by, updated_at",
    );

  if (updateError) {
    throw new ServiceError("Failed to update RSVP guestbook moderation status.", updateError);
  }

  const updated = (updatedRows ?? []) as UpdatedResponseRecord[];

  await writeAuditLog({
    action: input.mode === "approve" ? "guestbook_approved" : "guestbook_removed",
    actorUserId: input.actorUserId,
    clientId: input.clientId,
    entityType: "rsvp_responses",
    eventId: currentEvent.id,
    metadata: {
      response_ids: updated.map((row) => row.id),
      skipped_already_set_count: skippedAlreadySetCount,
      skipped_no_message_count: skippedNoMessageCount,
      skipped_unauthorized_count: skippedUnauthorizedCount,
      updated_count: updated.length,
    },
  });

  return {
    currentEventId: currentEvent.id,
    currentEventSlug: currentEvent.event_slug,
    skippedAlreadySetCount,
    skippedNoMessageCount,
    skippedUnauthorizedCount,
    updated: updated.map((row) => ({
      id: row.id,
      messageApprovedAt: row.message_approved_at,
      messageApprovedBy: row.message_approved_by,
      messagePublicConsent: row.message_public_consent,
      messagePublicStatus: row.message_public_status as GuestbookStatus,
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
    throw new ServiceError("Failed to load the current RSVP event.", error);
  }

  assertServiceData(event, "No active RSVP event is available for guestbook moderation.");
  return event;
}

function hasMessage(message: string | null) {
  return Boolean(message?.trim());
}

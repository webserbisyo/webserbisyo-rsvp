import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { buildEventWebsiteCanonicalEventPatchInput } from "@/lib/event-website/canonical";
import type { EventWebsiteContent } from "@/lib/event-website/types";
import { EventWebsiteCanonicalEventPatchSchema } from "@/lib/validations/event-website.schema";
import type { Json, TablesInsert, TablesUpdate } from "@/lib/supabase/types";
import { assertServiceData, ServiceError } from "./service-error";
import { writeAuditLog } from "./write-audit-log";

export type SaveEventWebsiteDraftInput = {
  actorUserId: string;
  clientId: string;
  content: EventWebsiteContent;
  eventId: string;
};

export async function saveEventWebsiteDraft(input: SaveEventWebsiteDraftInput) {
  const supabase = createAdminClient();
  const canonicalPatchResult = EventWebsiteCanonicalEventPatchSchema.safeParse(
    buildEventWebsiteCanonicalEventPatchInput(input.content),
  );

  if (!canonicalPatchResult.success) {
    throw new ServiceError(getCanonicalPatchErrorMessage(canonicalPatchResult.error));
  }

  const canonicalPatch = canonicalPatchResult.data;
  const eventRow: TablesUpdate<"rsvp_events"> = {
    event_date: canonicalPatch.event_date,
    event_time: canonicalPatch.event_time,
    rsvp_close_at: canonicalPatch.rsvp_close_at,
    venue_address: canonicalPatch.venue_address,
    venue_name: canonicalPatch.venue_name,
  };
  const row: TablesInsert<"event_content"> = {
    content_json: input.content as unknown as Json,
    event_id: input.eventId,
  };
  const { data: event, error: eventError } = await supabase
    .from("rsvp_events")
    .update(eventRow)
    .eq("id", input.eventId)
    .eq("client_id", input.clientId)
    .select("id, client_id")
    .single();

  if (eventError) {
    throw new ServiceError(
      formatSupabaseWriteError("Failed to update event canonical fields.", eventError),
      eventError,
    );
  }

  assertServiceData(event, "Canonical RSVP event update returned no row.");

  const { data: content, error } = await supabase
    .from("event_content")
    .upsert(row, { onConflict: "event_id" })
    .select("id, event_id")
    .single();

  if (error) {
    throw new ServiceError(
      formatSupabaseWriteError("Failed to save event content.", error),
      error,
    );
  }

  assertServiceData(content, "Event Website draft save returned no row.");

  await writeAuditLog({
    action: "event_website_draft_saved",
    actorUserId: input.actorUserId,
    clientId: event.client_id,
    entityId: content.id,
    entityType: "event_content",
    eventId: input.eventId,
    metadata: {
      enabledSectionCount: Object.values(input.content.layout.enabledSections).filter(Boolean).length,
      eventType: input.content.eventType,
      version: input.content.version,
    },
  });

  return content;
}

function formatSupabaseWriteError(message: string, error: unknown) {
  if (!error || typeof error !== "object") {
    return message;
  }

  const messagePart = "message" in error && typeof error.message === "string" ? error.message : "";
  const detailsPart = "details" in error && typeof error.details === "string" ? error.details : "";
  const hintPart = "hint" in error && typeof error.hint === "string" ? error.hint : "";
  const suffix = [messagePart, detailsPart, hintPart].filter(Boolean).join(" ");

  return suffix ? `${message} ${suffix}` : message;
}

function getCanonicalPatchErrorMessage(error: {
  issues: Array<{ message: string; path: PropertyKey[] }>;
}) {
  const issue = error.issues[0];

  if (!issue) {
    return "Invalid canonical event fields.";
  }

  const [path] = issue.path;

  if (path === "rsvp_close_at") {
    return issue.message === "RSVP deadline must be on or before the ceremony start."
      ? issue.message
      : "Invalid RSVP deadline.";
  }

  if (path === "event_date") {
    return "Invalid ceremony date.";
  }

  if (path === "event_time") {
    return "Invalid ceremony time.";
  }

  if (path === "venue_name") {
    return "Invalid venue name.";
  }

  if (path === "venue_address") {
    return "Invalid venue address.";
  }

  return issue.message || "Invalid canonical event fields.";
}

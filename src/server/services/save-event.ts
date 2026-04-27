import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import type { EventInput } from "@/lib/validations/event.schema";
import { EventSchema } from "@/lib/validations/event.schema";
import { assertServiceData, assertServiceSuccess } from "./service-error";
import { writeAuditLog } from "./write-audit-log";

export type SaveEventInput = EventInput & {
  eventId: string;
};

export async function saveEvent(input: SaveEventInput, actorUserId: string) {
  const { eventId, ...eventInput } = input;
  const payload = EventSchema.parse(eventInput);
  const supabase = createAdminClient();

  const { data: event, error } = await supabase
    .from("rsvp_events")
    .update({
      custom_frontend_enabled: payload.customFrontendEnabled,
      custom_frontend_url: payload.customFrontendUrl ?? null,
      event_date: payload.eventDate ?? null,
      event_time: payload.eventTime ?? null,
      event_type: payload.eventType,
      fallback_page_enabled: payload.fallbackPageEnabled,
      max_guest_count: payload.maxGuestCount ?? null,
      rsvp_close_at: payload.rsvpCloseAt ?? null,
      rsvp_open_at: payload.rsvpOpenAt ?? null,
      status: payload.status,
      title: payload.title,
      venue_address: payload.venueAddress ?? null,
      venue_name: payload.venueName ?? null,
      visibility: payload.visibility,
    })
    .eq("id", eventId)
    .select("*")
    .single();

  assertServiceSuccess(error, "Failed to save RSVP event.");
  assertServiceData(event, "RSVP event update returned no row.");

  await writeAuditLog({
    action: "event_updated",
    actorUserId,
    clientId: event.client_id,
    entityId: event.id,
    entityType: "rsvp_events",
    eventId: event.id,
  });

  return event;
}

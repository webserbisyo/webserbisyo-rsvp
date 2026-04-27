import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import type { Json } from "@/lib/supabase/types";
import type { EventContentInput } from "@/lib/validations/event.schema";
import { EventContentSchema } from "@/lib/validations/event.schema";
import { assertServiceData, assertServiceSuccess } from "./service-error";
import { writeAuditLog } from "./write-audit-log";

export type SaveEventContentInput = EventContentInput & {
  eventId: string;
};

export async function saveEventContent(input: SaveEventContentInput, actorUserId: string) {
  const { eventId, ...contentInput } = input;
  const payload = EventContentSchema.parse(contentInput);
  const supabase = createAdminClient();

  const { data: event, error: eventError } = await supabase
    .from("rsvp_events")
    .select("id, client_id")
    .eq("id", eventId)
    .single();

  assertServiceSuccess(eventError, "Failed to load event for content update.");
  assertServiceData(event, "Event does not exist for content update.");

  const { data: content, error } = await supabase
    .from("event_content")
    .upsert(
      {
        contact_note: payload.contactNote ?? null,
        content_json: (payload.contentJson ?? {}) as Json,
        couple_or_celebrant_names: payload.coupleOrCelebrantNames ?? null,
        dress_code: payload.dressCode ?? null,
        event_id: eventId,
        event_story: payload.eventStory ?? null,
        gift_note: payload.giftNote ?? null,
        hero_subtitle: payload.heroSubtitle ?? null,
        hero_title: payload.heroTitle ?? null,
        rsvp_note: payload.rsvpNote ?? null,
        schedule_note: payload.scheduleNote ?? null,
        theme_key: payload.themeKey ?? null,
        venue_note: payload.venueNote ?? null,
      },
      { onConflict: "event_id" },
    )
    .select("*")
    .single();

  assertServiceSuccess(error, "Failed to save event content.");
  assertServiceData(content, "Event content upsert returned no row.");

  await writeAuditLog({
    action: "event_content_updated",
    actorUserId,
    clientId: event.client_id,
    entityId: content.id,
    entityType: "event_content",
    eventId,
  });

  return content;
}

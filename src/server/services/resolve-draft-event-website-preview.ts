import "server-only";

import { buildPublicEventDto, type PublicEventDto } from "@/lib/event-website/public-event";
import {
  mergeEventWebsiteContent,
  parseEventWebsiteContentJson,
} from "@/lib/event-website/hydration";
import { createAdminClient } from "@/lib/supabase/admin";
import { listApprovedGuestbookMessages } from "./event-website-guestbook";

export async function resolveDraftEventWebsitePreview(input: {
  clientId: string;
  eventId: string;
  eventSlug: string;
}): Promise<PublicEventDto | null> {
  const supabase = createAdminClient();
  const { data: event, error } = await supabase
    .from("rsvp_events")
    .select(
      `
        id,
        client_id,
        title,
        event_type,
        event_date,
        event_time,
        venue_name,
        venue_address,
        draft_visibility,
        rsvp_open_at,
        rsvp_close_at,
        subdomain_slug,
        event_content (
          content_json,
          saved_at,
          saved_revision,
          published_revision
        )
      `,
    )
    .eq("id", input.eventId)
    .eq("client_id", input.clientId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  const relation = event?.event_content;
  const eventContent = Array.isArray(relation) ? (relation[0] ?? null) : relation;
  const parsedContent = parseEventWebsiteContentJson(eventContent?.content_json);

  if (!event || !eventContent || !parsedContent || !eventContent.saved_at) {
    return null;
  }

  const content = mergeEventWebsiteContent(parsedContent, {
    event: {
      eventDate: event.event_date,
      eventTime: event.event_time,
      eventType: event.event_type,
      rsvpCloseAt: event.rsvp_close_at,
      title: event.title,
      venueAddress: event.venue_address,
      venueName: event.venue_name,
    },
  });
  const guestbookMessages = await listApprovedGuestbookMessages({
    clientId: input.clientId,
    eventId: event.id,
  });

  return buildPublicEventDto({
    content,
    eventDate: event.event_date,
    eventSlug: input.eventSlug,
    eventTime: event.event_time,
    eventTitle: event.title,
    eventType: event.event_type,
    guestbookMessages,
    publishedAt: eventContent.saved_at,
    publishedRevision: eventContent.published_revision,
    rsvpCloseAt: event.rsvp_close_at,
    rsvpOpenAt: event.rsvp_open_at,
    savedRevision: eventContent.saved_revision,
    subdomainSlug: event.subdomain_slug,
    venueAddress: event.venue_address,
    venueName: event.venue_name,
    visibility:
      event.draft_visibility === "private" || event.draft_visibility === "public"
        ? event.draft_visibility
        : "unlisted",
  });
}

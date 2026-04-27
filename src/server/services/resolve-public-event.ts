import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

export type PublicEventDto = {
  content: {
    coupleOrCelebrantNames: string | null;
    dressCode: string | null;
    eventStory: string | null;
    heroSubtitle: string | null;
    heroTitle: string | null;
    rsvpNote: string | null;
    scheduleNote: string | null;
    themeKey: string | null;
    venueNote: string | null;
  } | null;
  eventDate: string | null;
  eventSlug: string;
  eventTime: string | null;
  eventType: string;
  rsvpCloseAt: string | null;
  rsvpOpenAt: string | null;
  title: string;
  venueAddress: string | null;
  venueName: string | null;
};

export async function resolvePublicEvent(eventSlug: string): Promise<PublicEventDto | null> {
  const supabase = createAdminClient();
  const { data: event, error } = await supabase
    .from("rsvp_events")
    .select(
      `
        event_slug,
        title,
        event_type,
        event_date,
        event_time,
        venue_name,
        venue_address,
        rsvp_open_at,
        rsvp_close_at,
        event_content (
          hero_title,
          hero_subtitle,
          couple_or_celebrant_names,
          event_story,
          dress_code,
          schedule_note,
          venue_note,
          rsvp_note,
          theme_key
        )
      `,
    )
    .eq("event_slug", eventSlug)
    .eq("status", "published")
    .in("visibility", ["public", "unlisted"])
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!event) {
    return null;
  }

  const content = Array.isArray(event.event_content)
    ? (event.event_content[0] ?? null)
    : event.event_content;

  return {
    content: content
      ? {
          coupleOrCelebrantNames: content.couple_or_celebrant_names,
          dressCode: content.dress_code,
          eventStory: content.event_story,
          heroSubtitle: content.hero_subtitle,
          heroTitle: content.hero_title,
          rsvpNote: content.rsvp_note,
          scheduleNote: content.schedule_note,
          themeKey: content.theme_key,
          venueNote: content.venue_note,
        }
      : null,
    eventDate: event.event_date,
    eventSlug: event.event_slug,
    eventTime: event.event_time,
    eventType: event.event_type,
    rsvpCloseAt: event.rsvp_close_at,
    rsvpOpenAt: event.rsvp_open_at,
    title: event.title,
    venueAddress: event.venue_address,
    venueName: event.venue_name,
  };
}

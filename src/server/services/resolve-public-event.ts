import "server-only";

import { resolvePublicEventWebsite } from "@/server/services/resolve-public-event-website";

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
  // Legacy compatibility adapter.
  // New public consumers should prefer resolvePublicEventWebsite(), which is backed by the published snapshot.
  const event = await resolvePublicEventWebsite(eventSlug);

  if (!event) {
    return null;
  }

  return {
    content: event.content
      ? {
          coupleOrCelebrantNames: event.content.sections.host_info.displayAs,
          dressCode: event.content.sections.attire_motif.dressCodeNote,
          eventStory: event.content.sections.story_message.storyBody,
          heroSubtitle: event.content.sections.host_info.shortHostMessage,
          heroTitle: event.content.sections.host_info.hostLine,
          rsvpNote: null,
          scheduleNote: event.content.sections.main_event.scheduleNote,
          themeKey: null,
          venueNote: event.content.sections.venue.arrivalNote,
        }
      : null,
    eventDate: event.eventDate,
    eventSlug: event.eventSlug,
    eventTime: event.eventTime,
    eventType: event.eventType,
    rsvpCloseAt: event.rsvp.closeAt,
    rsvpOpenAt: event.rsvp.openAt,
    title: event.eventTitle,
    venueAddress: event.venueAddress,
    venueName: event.venueName,
  };
}

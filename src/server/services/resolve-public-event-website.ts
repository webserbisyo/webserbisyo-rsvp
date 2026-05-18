import "server-only";

import { cache } from "react";
import { z } from "zod";
import {
  mergeEventWebsiteContent,
  parseEventWebsiteContentJson,
} from "@/lib/event-website/hydration";
import type { EventWebsiteContent, EventWebsiteContentSectionKey } from "@/lib/event-website/types";
import { createAdminClient } from "@/lib/supabase/admin";

const PublicEventSlugSchema = z
  .string()
  .trim()
  .min(1)
  .max(200)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);

type PublicEventWebsiteDto = {
  content: EventWebsiteContent;
  eventDate: string | null;
  eventSlug: string;
  eventTime: string | null;
  eventTitle: string;
  eventType: string;
  publishedAt: string;
  rsvpCloseAt: string | null;
  rsvpOpenAt: string | null;
  sectionsToRender: EventWebsiteContentSectionKey[];
  venueAddress: string | null;
  venueName: string | null;
  visibility: "private" | "public" | "unlisted";
};

export const resolvePublicEventWebsite = cache(
  async (eventSlugInput: string): Promise<PublicEventWebsiteDto | null> => {
    const parsedSlug = PublicEventSlugSchema.safeParse(eventSlugInput);

    if (!parsedSlug.success) {
      return null;
    }

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
          visibility,
          status,
          published_at,
          archived_at,
          fallback_page_enabled,
          rsvp_open_at,
          rsvp_close_at,
          event_content (
            published_content_json,
            published_at
          )
        `,
      )
      .eq("event_slug", parsedSlug.data)
      .eq("status", "published")
      .eq("fallback_page_enabled", true)
      .in("visibility", ["public", "unlisted", "private"])
      .is("archived_at", null)
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!event || !event.published_at) {
      return null;
    }

    const eventContent = Array.isArray(event.event_content)
      ? (event.event_content[0] ?? null)
      : event.event_content;

    if (!eventContent?.published_content_json || !eventContent.published_at) {
      return null;
    }

    const parsedContent = parseEventWebsiteContentJson(eventContent.published_content_json);

    if (!parsedContent) {
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

    return {
      content,
      eventDate: event.event_date,
      eventSlug: event.event_slug,
      eventTime: event.event_time,
      eventTitle: event.title,
      eventType: event.event_type,
      publishedAt: event.published_at,
      rsvpCloseAt: event.rsvp_close_at,
      rsvpOpenAt: event.rsvp_open_at,
      sectionsToRender: buildSectionsToRender(content),
      venueAddress: event.venue_address,
      venueName: event.venue_name,
      visibility: event.visibility as "private" | "public" | "unlisted",
    };
  },
);

function buildSectionsToRender(content: EventWebsiteContent): EventWebsiteContentSectionKey[] {
  const visibleSections = content.layout.sectionOrder.filter(
    (sectionKey) => sectionKey === "contact_socials" || content.layout.enabledSections[sectionKey],
  );
  const contactSection = visibleSections.filter((sectionKey) => sectionKey === "contact_socials");
  const nonContactSections = visibleSections.filter(
    (sectionKey) => sectionKey !== "contact_socials",
  );

  return [...nonContactSections, ...contactSection];
}

export type { PublicEventWebsiteDto };

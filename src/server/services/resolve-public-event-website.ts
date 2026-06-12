import "server-only";

import { cache } from "react";
import {
  buildPublicEventDto,
  PUBLIC_EVENT_RENDER_VISIBILITIES,
  PublicEventSlugSchema,
  type PublicEventDto,
} from "@/lib/event-website/public-event";
import { hasPublishedPrivateAccess, normalizePrivateAccessToken } from "@/lib/private-access";
import { isPublicRenderingEventTypeEnabled } from "@/config/event-type-availability";
import { createAdminClient } from "@/lib/supabase/admin";
import { listApprovedGuestbookMessages } from "./event-website-guestbook";

type PublicEventRecord = {
  archived_at: string | null;
  event_content:
    | {
        published_at: string | null;
        published_content_json: unknown;
      }
    | Array<{
        published_at: string | null;
        published_content_json: unknown;
      }>
    | null;
  event_date: string | null;
  event_slug: string;
  event_time: string | null;
  event_type: string;
  fallback_page_enabled: boolean;
  id: string;
  published_at: string | null;
  private_access_token: string | null;
  rsvp_close_at: string | null;
  rsvp_open_at: string | null;
  status: string;
  subdomain_slug: string | null;
  title: string;
  venue_address: string | null;
  venue_name: string | null;
  visibility: "private" | "public" | "unlisted";
};

export const resolvePublicEventWebsite = cache(
  async (
    eventSlugInput: string,
    accessTokenInput?: string | null,
  ): Promise<PublicEventDto | null> => {
    const parsedSlug = PublicEventSlugSchema.safeParse(eventSlugInput);

    if (!parsedSlug.success) {
      return null;
    }

    return loadPublishedPublicEvent({
      accessToken: normalizePrivateAccessToken(accessTokenInput),
      lookupColumn: "event_slug",
      lookupValue: parsedSlug.data,
    });
  },
);

export const resolvePublicEventWebsiteBySubdomain = cache(
  async (
    subdomainSlugInput: string,
    accessTokenInput?: string | null,
  ): Promise<PublicEventDto | null> => {
    const parsedSlug = PublicEventSlugSchema.safeParse(subdomainSlugInput);

    if (!parsedSlug.success) {
      return null;
    }

    try {
      return await loadPublishedPublicEvent({
        accessToken: normalizePrivateAccessToken(accessTokenInput),
        lookupColumn: "subdomain_slug",
        lookupValue: parsedSlug.data,
      });
    } catch (error) {
      if (isMissingSubdomainLookupColumnError(error)) {
        return null;
      }

      throw error;
    }
  },
);

async function loadPublishedPublicEvent(input: {
  accessToken?: string | null;
  lookupColumn: "event_slug" | "subdomain_slug";
  lookupValue: string;
}) {
  const supabase = createAdminClient();
  const baseSelect = `
        title,
        event_type,
        event_date,
        event_time,
        venue_name,
        venue_address,
        private_access_token,
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
      `;
  const { data: event, error } = await supabase
    .from("rsvp_events")
    .select(
      `
        event_slug,
        id,
        subdomain_slug,
        ${baseSelect}
      `,
    )
    .eq(input.lookupColumn, input.lookupValue)
    .eq("status", "published")
    .eq("fallback_page_enabled", true)
    .in("visibility", PUBLIC_EVENT_RENDER_VISIBILITIES)
    .is("archived_at", null)
    .maybeSingle();

  if (error) {
    if (!isMissingSubdomainLookupColumnError(error) || input.lookupColumn === "subdomain_slug") {
      throw error;
    }

    const { data: fallbackEvent, error: fallbackError } = await supabase
      .from("rsvp_events")
      .select(
        `
          event_slug,
          id,
          ${baseSelect}
        `,
      )
      .eq("event_slug", input.lookupValue)
      .eq("status", "published")
      .eq("fallback_page_enabled", true)
      .in("visibility", PUBLIC_EVENT_RENDER_VISIBILITIES)
      .is("archived_at", null)
      .maybeSingle();

    if (fallbackError) {
      throw fallbackError;
    }

    return toPublicEventDto(
      fallbackEvent
        ? ({
            ...fallbackEvent,
            subdomain_slug: null,
          } as PublicEventRecord)
        : null,
      input.accessToken,
    );
  }

  return toPublicEventDto(event as PublicEventRecord | null, input.accessToken);
}

async function toPublicEventDto(
  event: PublicEventRecord | null,
  accessToken?: string | null,
) {
  if (!event || !event.published_at || !isPublicRenderingEventTypeEnabled(event.event_type)) {
    return null;
  }

  if (
    !hasPublishedPrivateAccess({
      providedToken: accessToken,
      storedToken: event.private_access_token,
      visibility: event.visibility,
    })
  ) {
    return null;
  }

  const eventContent = Array.isArray(event.event_content)
    ? (event.event_content[0] ?? null)
    : event.event_content;

  if (!eventContent?.published_content_json || !eventContent.published_at) {
    return null;
  }

  const { mergeEventWebsiteContent, parseEventWebsiteContentJson } = await import(
    "@/lib/event-website/hydration"
  );
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
  const guestbookMessages = await listApprovedGuestbookMessages({
    eventId: event.id,
  });

  return buildPublicEventDto({
    content,
    eventDate: event.event_date,
    eventSlug: event.event_slug,
    eventTime: event.event_time,
    eventTitle: event.title,
    eventType: event.event_type,
    guestbookMessages,
    publishedAt: event.published_at,
    rsvpCloseAt: event.rsvp_close_at,
    rsvpOpenAt: event.rsvp_open_at,
    subdomainSlug: event.subdomain_slug,
    venueAddress: event.venue_address,
    venueName: event.venue_name,
    visibility: event.visibility,
  });
}

function isMissingSubdomainLookupColumnError(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    "message" in error &&
    (error as { code?: string }).code === "42703" &&
    typeof (error as { message?: string }).message === "string" &&
    (error as { message: string }).message.includes("subdomain_slug")
  );
}

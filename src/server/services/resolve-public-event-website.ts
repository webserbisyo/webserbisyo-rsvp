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
import { getEventWebsiteContentIssuePaths } from "@/lib/event-website/hydration";
import { EventWebsiteContentIntegrityError } from "./event-website-resolution";
import { logEventWebsiteOperation } from "./event-website-operation-log";
import { listApprovedGuestbookMessages } from "./event-website-guestbook";

type PublicEventRecord = {
  archived_at: string | null;
  event_content:
    | {
        published_at: string | null;
        published_revision: number;
        published_content_json: unknown;
        saved_revision: number;
      }
    | Array<{
        published_at: string | null;
        published_revision: number;
        published_content_json: unknown;
        saved_revision: number;
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

export type PublicEventWebsiteResolution =
  | { status: "EVENT_NOT_FOUND" }
  | { status: "EVENT_NOT_PUBLISHED" }
  | { data: PublicEventDto; status: "RESOLVED" };

export const resolvePublicEventWebsiteResult = cache(
  async (
    eventSlugInput: string,
    accessTokenInput?: string | null,
  ): Promise<PublicEventWebsiteResolution> => {
    const parsedSlug = PublicEventSlugSchema.safeParse(eventSlugInput);

    if (!parsedSlug.success) {
      return { status: "EVENT_NOT_FOUND" };
    }

    return loadPublishedPublicEvent({
      accessToken: normalizePrivateAccessToken(accessTokenInput),
      lookupColumn: "event_slug",
      lookupValue: parsedSlug.data,
    });
  },
);

export const resolvePublicEventWebsite = cache(
  async (eventSlugInput: string, accessTokenInput?: string | null): Promise<PublicEventDto | null> => {
    try {
      const result = await resolvePublicEventWebsiteResult(eventSlugInput, accessTokenInput);
      return result.status === "RESOLVED" ? result.data : null;
    } catch (error) {
      if (error instanceof EventWebsiteContentIntegrityError) {
        logEventWebsiteOperation("error", {
          category: error.code,
          eventId: error.eventId,
          issuePaths: error.issuePaths,
          operation: "public_resolve",
          stage: "failed",
        });
        return null;
      }
      throw error;
    }
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
      const result = await loadPublishedPublicEvent({
        accessToken: normalizePrivateAccessToken(accessTokenInput),
        lookupColumn: "subdomain_slug",
        lookupValue: parsedSlug.data,
      });
      return result.status === "RESOLVED" ? result.data : null;
    } catch (error) {
      if (error instanceof EventWebsiteContentIntegrityError) {
        logEventWebsiteOperation("error", {
          category: error.code,
          eventId: error.eventId,
          issuePaths: error.issuePaths,
          operation: "public_resolve",
          stage: "failed",
        });
        return null;
      }

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
          published_at,
          published_revision,
          saved_revision
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

async function toPublicEventDto(event: PublicEventRecord | null, accessToken?: string | null) {
  if (!event) {
    return { status: "EVENT_NOT_FOUND" } as const;
  }

  if (
    !event.published_at ||
    event.status !== "published" ||
    !event.fallback_page_enabled ||
    event.archived_at ||
    !PUBLIC_EVENT_RENDER_VISIBILITIES.includes(event.visibility) ||
    !isPublicRenderingEventTypeEnabled(event.event_type)
  ) {
    return { status: "EVENT_NOT_PUBLISHED" } as const;
  }

  if (
    !hasPublishedPrivateAccess({
      providedToken: accessToken,
      storedToken: event.private_access_token,
      visibility: event.visibility,
    })
  ) {
    return { status: "EVENT_NOT_FOUND" } as const;
  }

  const eventContent = Array.isArray(event.event_content)
    ? (event.event_content[0] ?? null)
    : event.event_content;

  if (!eventContent?.published_content_json || !eventContent.published_at) {
    throw new EventWebsiteContentIntegrityError({
      code: "EVENT_CONTENT_INVALID",
      eventId: event.id,
      issuePaths: ["published_content_json"],
    });
  }

  const { mergeEventWebsiteContent, parseEventWebsiteContentJson } =
    await import("@/lib/event-website/hydration");
  const parsedContent = parseEventWebsiteContentJson(eventContent.published_content_json);

  if (!parsedContent) {
    throw new EventWebsiteContentIntegrityError({
      code: "EVENT_CONTENT_INVALID",
      eventId: event.id,
      issuePaths: getEventWebsiteContentIssuePaths(eventContent.published_content_json),
    });
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

  return {
    data: buildPublicEventDto({
      content,
      eventDate: event.event_date,
      eventSlug: event.event_slug,
      eventTime: event.event_time,
      eventTitle: event.title,
      eventType: event.event_type,
      guestbookMessages,
      publishedAt: event.published_at,
      publishedRevision: eventContent.published_revision,
      rsvpCloseAt: event.rsvp_close_at,
      rsvpOpenAt: event.rsvp_open_at,
      savedRevision: eventContent.saved_revision,
      subdomainSlug: event.subdomain_slug,
      venueAddress: event.venue_address,
      venueName: event.venue_name,
      visibility: event.visibility,
    }),
    status: "RESOLVED",
  } as const;
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

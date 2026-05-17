import "server-only";

import { evaluateEventWebsiteReadiness, type EventWebsiteReadinessResult } from "@/lib/event-website/readiness";
import { mergeEventWebsiteContent, parseEventWebsiteContentJson } from "@/lib/event-website/hydration";
import { requireTenantMember } from "@/lib/permissions";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export type WebsiteAccessData = {
  customFrontendEnabled: boolean;
  customFrontendUrl: string | null;
  eventId: string | null;
  eventSlug: string | null;
  fallbackPageEnabled: boolean;
  hasPublishedSnapshot: boolean;
  publishedAt: string | null;
  publishedBy: string | null;
  publishState: "draft" | "published";
  readiness: EventWebsiteReadinessResult | null;
  snapshotPublishedAt: string | null;
  status: string | null;
  title: string | null;
  visibility: string | null;
};

export async function getWebsiteAccessData(): Promise<WebsiteAccessData> {
  const profile = await requireTenantMember();
  const supabase = await createServerSupabaseClient();

  const { data: events, error } = await supabase
    .from("rsvp_events")
    .select(
      `
        id,
        title,
        event_slug,
        visibility,
        status,
        published_at,
        fallback_page_enabled,
        custom_frontend_enabled,
        custom_frontend_url,
        event_date,
        event_time,
        rsvp_close_at,
        venue_name,
        venue_address,
        event_content (
          content_json,
          published_content_json,
          published_at,
          published_by
        )
      `,
    )
    .eq("client_id", profile.client_id ?? "")
    .order("created_at", { ascending: false })
    .limit(1);

  if (error) {
    throw error;
  }

  const event = events?.[0] ?? null;
  const eventContent = Array.isArray(event?.event_content)
    ? (event.event_content[0] ?? null)
    : (event?.event_content ?? null);

  const readiness = eventContent
    ? evaluateEventWebsiteReadiness(
        mergeEventWebsiteContent(
          parseEventWebsiteContentJson(eventContent.content_json) ?? eventContent.content_json,
          {
            event: {
              eventDate: event?.event_date ?? null,
              eventTime: event?.event_time ?? null,
              eventType: null,
              rsvpCloseAt: event?.rsvp_close_at ?? null,
              venueAddress: event?.venue_address ?? null,
              venueName: event?.venue_name ?? null,
            },
          },
        ),
      )
    : null;

  return {
    customFrontendEnabled: event?.custom_frontend_enabled ?? false,
    customFrontendUrl: event?.custom_frontend_url ?? null,
    eventId: event?.id ?? null,
    eventSlug: event?.event_slug ?? null,
    fallbackPageEnabled: event?.fallback_page_enabled ?? false,
    hasPublishedSnapshot: Boolean(eventContent?.published_content_json),
    publishedAt: event?.published_at ?? null,
    publishedBy: eventContent?.published_by ?? null,
    publishState: event?.status === "published" && event?.published_at ? "published" : "draft",
    readiness,
    snapshotPublishedAt: eventContent?.published_at ?? null,
    status: event?.status ?? null,
    title: event?.title ?? null,
    visibility: event?.visibility ?? null,
  };
}

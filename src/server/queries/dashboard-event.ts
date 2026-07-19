import "server-only";

import {
  getEventWebsiteContentIssuePaths,
  isEmptyJsonObject,
  mergeEventWebsiteContent,
  parseEventWebsiteContentJson,
} from "@/lib/event-website/hydration";
import type { EventWebsiteGuestbookMessage } from "@/lib/event-website/types";
import { normalizePrivateAccessToken } from "@/lib/private-access";
import {
  getPublicAppUrl,
  getRsvpPreviewBaseDomain,
  resolvePublicRsvpLinkSet,
} from "@/lib/public-rsvp-url";
import type { EventWebsiteContent, EventWebsiteDefaultsContext } from "@/lib/event-website/types";
import { requireTenantMember } from "@/lib/permissions";
import type { Json } from "@/lib/supabase/types";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { resolveDashboardCustomWebsitePreview } from "@/server/services/custom-websites/resolve-custom-website";
import type { DashboardCustomWebsitePreviewDto } from "@/server/services/custom-websites/types";
import { logEventWebsiteOperation } from "@/server/services/event-website-operation-log";
import { listApprovedGuestbookMessages } from "@/server/services/event-website-guestbook";

export type DashboardEventWebsiteData = {
  contentIntegrity:
    | { status: "valid" }
    | { diagnosticId: string; status: "invalid" };
  eventId: string | null;
  eventSlug: string | null;
  eventWebsiteContent: EventWebsiteContent | null;
  eventContent: {
    contentJson: Json;
    coupleOrCelebrantNames: string | null;
    eventStory: string | null;
    giftNote: string | null;
    heroSubtitle: string | null;
    heroTitle: string | null;
    rsvpNote: string | null;
    scheduleNote: string | null;
    venueNote: string | null;
    publishedAt: string | null;
  } | null;
  eventDate: string | null;
  publishState: "draft" | "published";
  publishedRevision: number;
  previewChromeUrl: string | null;
  publicPageUrl: string | null;
  publishedAt: string | null;
  eventTime: string | null;
  eventType: string | null;
  guestbookMessages: EventWebsiteGuestbookMessage[];
  customWebsitePreview: DashboardCustomWebsitePreviewDto;
  maxGuestCount: number | null;
  rsvpCloseAt: string | null;
  savedAt: string | null;
  savedRevision: number;
  snapshotPublishedAt: string | null;
  status: string | null;
  title: string | null;
  venueAddress: string | null;
  venueName: string | null;
};

export async function getDashboardEventWebsiteData(): Promise<DashboardEventWebsiteData> {
  const profile = await requireTenantMember();
  const supabase = await createServerSupabaseClient();
  const clientId = profile.client_id;

  if (!clientId) {
    throw new Error("Client tenant profile is missing client_id.");
  }

  const [
    { data: client, error: clientError },
    { data: events, error: eventsError },
    { data: applications, error: applicationsError },
  ] = await Promise.all([
    supabase.from("clients").select("name, contact_name").eq("id", clientId).maybeSingle(),
    supabase
      .from("rsvp_events")
      .select(
        `
          id,
          event_slug,
          subdomain_slug,
          visibility,
          private_access_token,
          status,
          published_at,
          title,
          event_type,
          event_date,
          event_time,
          rsvp_close_at,
          venue_name,
          venue_address,
          max_guest_count,
          event_content (
            content_json,
            couple_or_celebrant_names,
            event_story,
            gift_note,
            hero_title,
            hero_subtitle,
            published_at,
            published_revision,
            rsvp_note,
            saved_at,
            saved_revision,
            schedule_note,
            venue_note
          )
        `,
      )
      .eq("client_id", clientId)
      .order("created_at", { ascending: false })
      .limit(1),
    supabase
      .from("rsvp_applications")
      .select("event_location")
      .eq("approved_client_id", clientId)
      .order("approved_at", { ascending: false })
      .limit(1),
  ]);

  if (clientError) throw clientError;
  if (eventsError) throw eventsError;
  if (applicationsError) throw applicationsError;

  const event = events?.[0] ?? null;
  const application = applications?.[0] ?? null;
  const eventContent = Array.isArray(event?.event_content)
    ? (event.event_content[0] ?? null)
    : (event?.event_content ?? null);
  const eventContentData = eventContent
    ? {
        contentJson: eventContent.content_json,
        coupleOrCelebrantNames: eventContent.couple_or_celebrant_names,
        eventStory: eventContent.event_story,
        giftNote: eventContent.gift_note,
        heroSubtitle: eventContent.hero_subtitle,
        publishedAt: eventContent.published_at,
        heroTitle: eventContent.hero_title,
        rsvpNote: eventContent.rsvp_note,
        scheduleNote: eventContent.schedule_note,
        venueNote: eventContent.venue_note,
      }
    : null;
  const defaultsContext: EventWebsiteDefaultsContext = {
    application,
    client: client
      ? {
          contactName: client.contact_name,
          name: client.name,
        }
      : null,
    event: {
      eventDate: event?.event_date ?? null,
      eventTime: event?.event_time ?? null,
      eventType: event?.event_type ?? null,
      maxGuestCount: event?.max_guest_count ?? null,
      rsvpCloseAt: event?.rsvp_close_at ?? null,
      title: event?.title ?? null,
      venueAddress: event?.venue_address ?? null,
      venueName: event?.venue_name ?? null,
    },
    eventContent: eventContentData,
    profile: {
      email: profile.email,
      fullName: profile.full_name,
    },
  };
  const rawContentJson = eventContent?.content_json ?? null;
  const parsedContentJson = parseEventWebsiteContentJson(rawContentJson);
  const isEmptyInitialContent = isEmptyJsonObject(rawContentJson);
  const hasInvalidPersistedContent = Boolean(
    eventContent && !isEmptyInitialContent && !parsedContentJson,
  );
  const diagnosticId = event?.id
    ? `event-content-${event.id.slice(0, 8)}-${eventContent?.saved_revision ?? 0}`
    : "event-content-unresolved";

  if (hasInvalidPersistedContent) {
    logEventWebsiteOperation("error", {
      category: "EVENT_CONTENT_INVALID",
      eventId: event?.id ?? "unresolved",
      issuePaths: getEventWebsiteContentIssuePaths(rawContentJson),
      operation: "dashboard_load",
      stage: "failed",
    });
  }

  const eventWebsiteContent = hasInvalidPersistedContent
    ? null
    : mergeEventWebsiteContent(parsedContentJson, defaultsContext);
  const publicLinkSet = event?.event_slug
    ? resolvePublicRsvpLinkSet({
        accessToken:
          event?.status === "published" && event?.visibility === "private"
            ? normalizePrivateAccessToken(event.private_access_token)
            : null,
        baseUrl: getPublicAppUrl(),
        slug: event.event_slug,
        subdomain: event.subdomain_slug ?? null,
        wildcardBaseDomain: getRsvpPreviewBaseDomain(),
      })
    : null;
  const publicPageUrl =
    event?.status === "published" && event?.published_at ? (publicLinkSet?.openUrl ?? null) : null;
  const [guestbookMessages, customWebsitePreview] = await Promise.all([
    event?.id && clientId
      ? listApprovedGuestbookMessages({
          clientId,
          eventId: event.id,
        })
      : Promise.resolve([]),
    resolveDashboardCustomWebsitePreview({
      accessToken:
        event?.status === "published" && event?.visibility === "private"
          ? normalizePrivateAccessToken(event.private_access_token)
          : null,
      clientId,
      event: event?.id
        ? {
            eventSlug: event.event_slug,
            id: event.id,
            subdomainSlug: event.subdomain_slug ?? null,
          }
        : null,
      savedRevision: eventContent?.saved_revision ?? 0,
    }),
  ]);

  return {
    contentIntegrity: hasInvalidPersistedContent
      ? { diagnosticId, status: "invalid" }
      : { status: "valid" },
    eventId: event?.id ?? null,
    eventSlug: event?.event_slug ?? null,
    eventContent: eventContentData,
    eventDate: event?.event_date ?? null,
    publishState: event?.status === "published" && event?.published_at ? "published" : "draft",
    publishedRevision: eventContent?.published_revision ?? 0,
    previewChromeUrl: publicLinkSet?.previewChromeUrl ?? null,
    publicPageUrl,
    publishedAt: event?.published_at ?? null,
    eventTime: event?.event_time ?? null,
    eventType: event?.event_type ?? null,
    eventWebsiteContent,
    guestbookMessages,
    customWebsitePreview,
    maxGuestCount: event?.max_guest_count ?? null,
    rsvpCloseAt: event?.rsvp_close_at ?? null,
    savedAt: eventContent?.saved_at ?? null,
    savedRevision: eventContent?.saved_revision ?? 0,
    snapshotPublishedAt: eventContent?.published_at ?? null,
    status: event?.status ?? null,
    title: event?.title ?? null,
    venueAddress: event?.venue_address ?? null,
    venueName: event?.venue_name ?? null,
  };
}

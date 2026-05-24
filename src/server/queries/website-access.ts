import "server-only";

import type { PostgrestError } from "@supabase/supabase-js";
import {
  buildChangeSummary,
  mapDbVisibilityToApp,
} from "@/components/dashboard/website-access/website-access-utils";
import type { WebsiteAccessInitialData } from "@/components/dashboard/website-access/website-access-types";
import { getEventWebsiteSavedAt } from "@/lib/event-website/readiness";
import { mergeEventWebsiteContent, parseEventWebsiteContentJson } from "@/lib/event-website/hydration";
import { requireTenantMember } from "@/lib/permissions";
import {
  buildPublicRsvpFormUrl,
  buildPublicRsvpUrl,
  getPublicAppUrl,
  isPublishedPublicRsvpReady,
} from "@/lib/public-rsvp-url";
import { createServerSupabaseClient } from "@/lib/supabase/server";

type WebsiteAccessDataRow = {
  draft_event_slug: string;
  draft_visibility: string;
  event_content:
    | {
        content_json: unknown;
        published_at: string | null;
        published_content_json: unknown;
      }
    | Array<{
        content_json: unknown;
        published_at: string | null;
        published_content_json: unknown;
      }>
    | null;
  event_date: string | null;
  event_slug: string;
  event_time: string | null;
  fallback_page_enabled: boolean;
  id: string;
  published_at: string | null;
  status: string;
  title: string | null;
  venue_address: string | null;
  venue_name: string | null;
  visibility: string;
  website_access_updated_at: string | null;
};

export type WebsiteAccessData = {
  publishState: WebsiteAccessInitialData["publishState"];
  workflowStatus: {
    description: string;
  };
};

export async function getWebsiteAccessData(): Promise<WebsiteAccessInitialData> {
  const profile = await requireTenantMember();
  const supabase = await createServerSupabaseClient();
  const event = await getWebsiteAccessEventRow(supabase, profile.client_id ?? "");

  if (!event) {
    return {
      canDownloadQr: false,
      canOpenWebsite: false,
      changesSummary: "Draft ready to publish",
      contentDraftSavedAt: null,
      draftSlug: null,
      draftVisibility: "private",
      eventId: null,
      hasAccessPendingChanges: false,
      hasContentPendingChanges: false,
      hasEverPublished: false,
      hasPendingChanges: false,
      hasSlugPendingChanges: false,
      lastEditedAt: null,
      publicBaseUrl: getPublicAppUrl(),
      publicUrl: null,
      publishState: "unpublished",
      publishedAt: null,
      publishedSlug: null,
      publishedVisibility: "private",
      rsvpUrl: null,
      snapshotPublishedAt: null,
      websiteAccessUpdatedAt: null,
    };
  }

  const eventContent = Array.isArray(event.event_content)
    ? (event.event_content[0] ?? null)
    : event.event_content;
  const mergedDraftContent = eventContent
    ? mergeEventWebsiteContent(
        parseEventWebsiteContentJson(eventContent.content_json) ?? eventContent.content_json,
        {
          event: {
            eventDate: event.event_date,
            eventTime: event.event_time,
            eventType: null,
            venueAddress: event.venue_address,
            venueName: event.venue_name,
          },
        },
      )
    : null;
  const contentDraftSavedAt = getEventWebsiteSavedAt(mergedDraftContent);
  const publishState =
    event.status === "published" && event.published_at && event.fallback_page_enabled
      ? "published"
      : "unpublished";
  const publishedVisibility = mapDbVisibilityToApp(event.visibility);
  const draftVisibility = mapDbVisibilityToApp(event.draft_visibility);
  const publishedSlug = event.event_slug ?? null;
  const draftSlug = event.draft_event_slug ?? null;
  const hasSlugPendingChanges = Boolean(draftSlug && publishedSlug && draftSlug !== publishedSlug);
  const hasAccessPendingChanges = draftVisibility !== publishedVisibility;
  const hasContentPendingChanges = isDraftNewerThanPublished(
    contentDraftSavedAt,
    eventContent?.published_at ?? null,
  );
  const hasPendingChanges =
    hasAccessPendingChanges || hasSlugPendingChanges || hasContentPendingChanges;
  const hasEverPublished = Boolean(
    eventContent?.published_content_json || event.published_at || eventContent?.published_at,
  );
  const publicBaseUrl = getPublicAppUrl();
  const hasPublishedSnapshot = Boolean(
    eventContent?.published_at && eventContent?.published_content_json,
  );
  const isShareable = isPublishedPublicRsvpReady({
    fallbackPageEnabled: event.fallback_page_enabled,
    hasPublishedSnapshot,
    publishedAt: event.published_at,
    slug: publishedSlug,
    status: event.status,
  });
  const publicUrl =
    isShareable && publishedSlug
      ? buildPublicRsvpUrl({ baseUrl: publicBaseUrl, slug: publishedSlug })
      : null;
  const rsvpUrl =
    isShareable && publishedSlug
      ? buildPublicRsvpFormUrl({ baseUrl: publicBaseUrl, slug: publishedSlug })
      : null;

  return {
    canDownloadQr: Boolean(rsvpUrl),
    canOpenWebsite: Boolean(publicUrl),
    changesSummary: buildChangeSummary({
      hasAccessPendingChanges,
      hasContentPendingChanges,
      hasSlugPendingChanges,
      isPublished: publishState === "published",
    }),
    contentDraftSavedAt,
    draftSlug,
    draftVisibility,
    eventId: event.id,
    hasAccessPendingChanges,
    hasContentPendingChanges,
    hasEverPublished,
    hasPendingChanges,
    hasSlugPendingChanges,
    lastEditedAt: event.website_access_updated_at ?? contentDraftSavedAt,
    publicBaseUrl,
    publicUrl,
    publishState,
    publishedAt: event.published_at ?? null,
    publishedSlug,
    publishedVisibility,
    rsvpUrl,
    snapshotPublishedAt: eventContent?.published_at ?? null,
    websiteAccessUpdatedAt: event.website_access_updated_at ?? null,
  };
}

async function getWebsiteAccessEventRow(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>,
  clientId: string,
): Promise<WebsiteAccessDataRow | null> {
  const primaryResult = await supabase
    .from("rsvp_events")
    .select(
      `
        id,
        title,
        event_slug,
        draft_event_slug,
        visibility,
        draft_visibility,
        status,
        published_at,
        fallback_page_enabled,
        website_access_updated_at,
        event_date,
        event_time,
        venue_name,
        venue_address,
        event_content (
          content_json,
          published_content_json,
          published_at
        )
      `,
    )
    .eq("client_id", clientId)
    .order("created_at", { ascending: false })
    .limit(1);

  if (!primaryResult.error) {
    return (primaryResult.data?.[0] ?? null) as WebsiteAccessDataRow | null;
  }

  if (!isMissingWebsiteAccessDraftColumnError(primaryResult.error)) {
    throw primaryResult.error;
  }

  const fallbackResult = await supabase
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
        created_at,
        updated_at,
        event_date,
        event_time,
        venue_name,
        venue_address,
        event_content (
          content_json,
          published_content_json,
          published_at
        )
      `,
    )
    .eq("client_id", clientId)
    .order("created_at", { ascending: false })
    .limit(1);

  if (fallbackResult.error) {
    throw fallbackResult.error;
  }

  const legacyEvent = fallbackResult.data?.[0];

  if (!legacyEvent) {
    return null;
  }

  return {
    draft_event_slug: legacyEvent.event_slug,
    draft_visibility: legacyEvent.visibility,
    event_content: legacyEvent.event_content,
    event_date: legacyEvent.event_date,
    event_slug: legacyEvent.event_slug,
    event_time: legacyEvent.event_time,
    fallback_page_enabled: legacyEvent.fallback_page_enabled,
    id: legacyEvent.id,
    published_at: legacyEvent.published_at,
    status: legacyEvent.status,
    title: legacyEvent.title,
    venue_address: legacyEvent.venue_address,
    venue_name: legacyEvent.venue_name,
    visibility: legacyEvent.visibility,
    website_access_updated_at: legacyEvent.updated_at ?? legacyEvent.created_at ?? null,
  };
}

function isMissingWebsiteAccessDraftColumnError(error: PostgrestError) {
  if (error.code !== "42703") {
    return false;
  }

  return ["draft_event_slug", "draft_visibility", "website_access_updated_at"].some((columnName) =>
    error.message.includes(columnName),
  );
}

function isDraftNewerThanPublished(savedAt?: string | null, publishedAt?: string | null) {
  const savedTime = parseIsoDateString(savedAt);
  const publishedTime = parseIsoDateString(publishedAt);

  if (savedTime === null || publishedTime === null) {
    return false;
  }

  return savedTime > publishedTime;
}

function parseIsoDateString(value?: string | null) {
  if (!value) {
    return null;
  }

  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? null : parsed;
}

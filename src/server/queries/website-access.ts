import "server-only";

import type { PostgrestError } from "@supabase/supabase-js";
import {
  buildChangeSummary,
  mapDbVisibilityToApp,
} from "@/components/dashboard/website-access/website-access-utils";
import type { WebsiteAccessInitialData } from "@/components/dashboard/website-access/website-access-types";
import { mergeEventWebsiteContent, parseEventWebsiteContentJson } from "@/lib/event-website/hydration";
import { getEventWebsiteSavedAt } from "@/lib/event-website/readiness";
import { requireTenantMember } from "@/lib/permissions";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  buildOfficialPublicRsvpUrl,
  getPublicAppUrl,
  getRsvpBaseDomain,
  getRsvpPreviewBaseDomain,
  isPublishedPublicRsvpReady,
  resolvePublicRsvpLinkSet,
  withRsvpAnchor,
} from "@/lib/public-rsvp-url";
import { createServerSupabaseClient } from "@/lib/supabase/server";

type WebsiteAccessDataRow = {
  draft_event_slug: string;
  draft_subdomain_slug: string | null;
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
  subdomain_slug: string | null;
  title: string | null;
  venue_address: string | null;
  venue_name: string | null;
  visibility: string;
  website_access_updated_at: string | null;
};

type WebsiteAccessEventRecord = {
  row: WebsiteAccessDataRow | null;
  subdomainFieldsInstalled: boolean;
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
  const eventRecord = await getWebsiteAccessEventRow(supabase, profile.client_id ?? "");
  const event = eventRecord.row;
  const publicBaseUrl = getPublicAppUrl();
  const wildcardBaseDomain = getRsvpPreviewBaseDomain() ?? "rsvp.webserbisyo.com";
  const wildcardDomainConfigured = Boolean(getRsvpBaseDomain());

  if (!event) {
    return {
      canDownloadQr: false,
      canOpenWebsite: false,
      changesSummary: "Draft ready to publish",
      copyPublicUrl: null,
      contentDraftSavedAt: null,
      customWebsiteConnected: false,
      draftSlug: null,
      draftSubdomain: null,
      draftVisibility: "private",
      eventId: null,
      fallbackPublicUrl: null,
      hasAccessPendingChanges: false,
      hasContentPendingChanges: false,
      hasEverPublished: false,
      hasPendingChanges: false,
      hasSlugPendingChanges: false,
      hasSubdomainPendingChanges: false,
      lastEditedAt: null,
      openPublicUrl: null,
      publicBaseUrl,
      publicUrl: null,
      publishState: "unpublished",
      publishedAt: null,
      publishedSlug: null,
      publishedSubdomain: null,
      publishedVisibility: "private",
      productionPublicUrl: null,
      qrPublicUrl: null,
      rsvpQrPublicUrl: null,
      snapshotPublishedAt: null,
      subdomainFieldsInstalled: false,
      websiteAccessUpdatedAt: null,
      wildcardBaseDomain,
      wildcardDomainConfigured,
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
  const publishedSubdomain = event.subdomain_slug ?? null;
  const draftSubdomain = event.draft_subdomain_slug ?? null;
  const hasSlugPendingChanges = Boolean(draftSlug && publishedSlug && draftSlug !== publishedSlug);
  const hasSubdomainPendingChanges = (draftSubdomain ?? null) !== (publishedSubdomain ?? null);
  const hasAccessPendingChanges = draftVisibility !== publishedVisibility;
  const hasContentPendingChanges = isDraftNewerThanPublished(
    contentDraftSavedAt,
    eventContent?.published_at ?? null,
  );
  const hasPendingChanges =
    hasAccessPendingChanges ||
    hasSlugPendingChanges ||
    hasSubdomainPendingChanges ||
    hasContentPendingChanges;
  const hasEverPublished = Boolean(
    eventContent?.published_content_json || event.published_at || eventContent?.published_at,
  );
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
  const linkSet =
    isShareable && publishedSlug
      ? resolvePublicRsvpLinkSet({
          baseUrl: publicBaseUrl,
          slug: publishedSlug,
          subdomain: eventRecord.subdomainFieldsInstalled ? publishedSubdomain : null,
          wildcardBaseDomain,
      })
      : null;
  const fallbackPublicUrl = linkSet && publishedSlug ? buildOfficialPublicRsvpUrl(publishedSlug) : null;
  const publicUrl = linkSet?.preferredProductionUrl ?? null;
  const openPublicUrl = publicUrl;
  const copyPublicUrl = publicUrl;
  const productionPublicUrl = linkSet?.preferredProductionUrl ?? null;
  const qrPublicUrl = publicUrl;
  const rsvpQrPublicUrl = withRsvpAnchor(publicUrl);
  const customWebsiteConnected = await isCustomWebsiteConnected({
    clientId: profile.client_id ?? "",
    eventId: event.id,
  });

  return {
    canDownloadQr: Boolean(qrPublicUrl),
    canOpenWebsite: Boolean(openPublicUrl),
    changesSummary: buildChangeSummary({
      hasAccessPendingChanges,
      hasContentPendingChanges,
      hasSlugPendingChanges,
      hasSubdomainPendingChanges,
      isPublished: publishState === "published",
    }),
    copyPublicUrl,
    contentDraftSavedAt,
    customWebsiteConnected,
    draftSlug,
    draftSubdomain,
    draftVisibility,
    eventId: event.id,
    fallbackPublicUrl,
    hasAccessPendingChanges,
    hasContentPendingChanges,
    hasEverPublished,
    hasPendingChanges,
    hasSlugPendingChanges,
    hasSubdomainPendingChanges,
    lastEditedAt: event.website_access_updated_at ?? contentDraftSavedAt,
    openPublicUrl,
    publicBaseUrl,
    publicUrl,
    publishState,
    publishedAt: event.published_at ?? null,
    publishedSlug,
    publishedSubdomain,
    publishedVisibility,
    productionPublicUrl,
    qrPublicUrl,
    rsvpQrPublicUrl,
    snapshotPublishedAt: eventContent?.published_at ?? null,
    subdomainFieldsInstalled: eventRecord.subdomainFieldsInstalled,
    websiteAccessUpdatedAt: event.website_access_updated_at ?? null,
    wildcardBaseDomain,
    wildcardDomainConfigured,
  };
}

async function isCustomWebsiteConnected(input: { clientId: string; eventId: string }) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("client_custom_websites")
    .select("id")
    .eq("client_id", input.clientId)
    .eq("event_id", input.eventId)
    .eq("custom_frontend_enabled", true)
    .not("custom_frontend_origin_url", "is", null)
    .maybeSingle();

  if (error) {
    return false;
  }

  return Boolean(data);
}

async function getWebsiteAccessEventRow(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>,
  clientId: string,
): Promise<WebsiteAccessEventRecord> {
  const primaryResult = await supabase
    .from("rsvp_events")
    .select(
      `
        id,
        title,
        event_slug,
        draft_event_slug,
        subdomain_slug,
        draft_subdomain_slug,
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
    return {
      row: (primaryResult.data?.[0] ?? null) as WebsiteAccessDataRow | null,
      subdomainFieldsInstalled: true,
    };
  }

  if (!isMissingWebsiteAccessSubdomainColumnError(primaryResult.error)) {
    if (!isMissingWebsiteAccessDraftColumnError(primaryResult.error)) {
      throw primaryResult.error;
    }

    return getDraftSchemaFallbackEventRow(supabase, clientId);
  }

  return getDraftSchemaFallbackEventRow(supabase, clientId);
}

async function getDraftSchemaFallbackEventRow(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>,
  clientId: string,
) {
  const fallbackResult = await supabase
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

  if (!fallbackResult.error) {
    const draftSchemaEvent = fallbackResult.data?.[0];

    if (!draftSchemaEvent) {
      return {
        row: null,
        subdomainFieldsInstalled: false,
      };
    }

    return {
      row: {
        ...draftSchemaEvent,
        draft_subdomain_slug: draftSchemaEvent.draft_event_slug ?? draftSchemaEvent.event_slug,
        subdomain_slug: draftSchemaEvent.event_slug,
      } as WebsiteAccessDataRow,
      subdomainFieldsInstalled: false,
    };
  }

  if (!isMissingWebsiteAccessDraftColumnError(fallbackResult.error)) {
    throw fallbackResult.error;
  }

  const legacyResult = await supabase
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

  if (legacyResult.error) {
    throw legacyResult.error;
  }

  const legacyEvent = legacyResult.data?.[0];

  if (!legacyEvent) {
    return {
      row: null,
      subdomainFieldsInstalled: false,
    };
  }

  return {
    row: {
      draft_event_slug: legacyEvent.event_slug,
      draft_subdomain_slug: legacyEvent.event_slug,
      draft_visibility: legacyEvent.visibility,
      event_content: legacyEvent.event_content,
      event_date: legacyEvent.event_date,
      event_slug: legacyEvent.event_slug,
      event_time: legacyEvent.event_time,
      fallback_page_enabled: legacyEvent.fallback_page_enabled,
      id: legacyEvent.id,
      published_at: legacyEvent.published_at,
      status: legacyEvent.status,
      subdomain_slug: legacyEvent.event_slug,
      title: legacyEvent.title,
      venue_address: legacyEvent.venue_address,
      venue_name: legacyEvent.venue_name,
      visibility: legacyEvent.visibility,
      website_access_updated_at: legacyEvent.updated_at ?? legacyEvent.created_at ?? null,
    },
    subdomainFieldsInstalled: false,
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

function isMissingWebsiteAccessSubdomainColumnError(error: PostgrestError) {
  if (error.code !== "42703") {
    return false;
  }

  return ["draft_subdomain_slug", "subdomain_slug"].some((columnName) =>
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

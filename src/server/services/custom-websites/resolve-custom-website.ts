import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { appendPrivateAccessToken } from "@/lib/private-access";
import {
  buildPublicRsvpPath,
  getPublicAppUrl,
  getRsvpPreviewBaseDomain,
  resolvePublicRsvpLinkSet,
} from "@/lib/public-rsvp-url";
import type { CustomWebsiteHealthStatus, DashboardCustomWebsitePreviewDto } from "./types";
import { issueEventWebsitePreviewToken } from "@/server/services/event-website-preview-token";

type CustomWebsitePreviewEvent = {
  eventSlug: string | null;
  id: string;
  subdomainSlug: string | null;
};

const CUSTOM_WEBSITE_PREVIEW_COLUMNS =
  "id, event_id, custom_frontend_origin_url, custom_frontend_enabled, platform_event_slug, preview_enabled, last_health_status, last_health_checked_at";

export async function resolveDashboardCustomWebsitePreview(input: {
  accessToken?: string | null;
  clientId: string;
  event: CustomWebsitePreviewEvent | null;
  savedRevision: number;
}): Promise<DashboardCustomWebsitePreviewDto> {
  const eventSlug = input.event?.eventSlug ?? null;
  const linkSet = eventSlug
    ? resolvePublicRsvpLinkSet({
        baseUrl: getPublicAppUrl(),
        slug: eventSlug,
        subdomain: input.event?.subdomainSlug ?? null,
        wildcardBaseDomain: getRsvpPreviewBaseDomain(),
      })
    : null;
  const emptyDto = buildDashboardPreviewDto({
    eventId: input.event?.id ?? null,
    eventSlug,
    healthStatus: "unknown",
    linkSet,
  });

  if (!input.event?.id) {
    return emptyDto;
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("client_custom_websites")
    .select(CUSTOM_WEBSITE_PREVIEW_COLUMNS)
    .eq("client_id", input.clientId)
    .eq("event_id", input.event.id)
    .maybeSingle();

  if (error || !data) {
    return emptyDto;
  }

  const originUrl = data.custom_frontend_origin_url;
  const healthStatus = normalizeHealthStatus(data.last_health_status);
  const canPreview = Boolean(
    data.custom_frontend_enabled &&
    data.preview_enabled &&
    originUrl &&
    (data.platform_event_slug ?? eventSlug) &&
    (healthStatus === "healthy" || healthStatus === "unknown"),
  );

  if (canPreview) {
    await supabase
      .from("client_custom_websites")
      .update({ last_previewed_at: new Date().toISOString() })
      .eq("id", data.id);
  }

  return buildDashboardPreviewDto({
    customPreviewUrl:
      canPreview && originUrl
        ? buildCustomPreviewUrl({
            accessToken: input.accessToken,
            eventSlug: data.platform_event_slug ?? eventSlug,
            previewToken: issueEventWebsitePreviewToken({
              clientId: input.clientId,
              eventId: input.event.id,
              eventSlug: data.platform_event_slug ?? eventSlug ?? "",
            }),
            savedRevision: input.savedRevision,
            originUrl,
          })
        : null,
    eventId: input.event.id,
    eventSlug: data.platform_event_slug ?? eventSlug,
    healthStatus,
    lastHealthCheckedAt: data.last_health_checked_at,
    linkSet,
    routeMode: canPreview ? "custom" : "default",
    savedRevision: input.savedRevision,
  });
}

function buildDashboardPreviewDto(input: {
  customPreviewUrl?: string | null;
  eventId: string | null;
  eventSlug: string | null;
  healthStatus: CustomWebsiteHealthStatus;
  lastHealthCheckedAt?: string | null;
  linkSet: ReturnType<typeof resolvePublicRsvpLinkSet> | null;
  routeMode?: "custom" | "default";
  savedRevision?: number;
}): DashboardCustomWebsitePreviewDto {
  const fallbackUrl =
    input.linkSet?.fallbackPathUrl ??
    (input.eventSlug ? buildPublicRsvpPath(input.eventSlug) : null);
  const customPreviewAvailable = Boolean(input.customPreviewUrl);

  return {
    customPreviewAvailable,
    customPreviewLabel: customPreviewAvailable
      ? "Custom preview"
      : input.healthStatus !== "healthy" && input.healthStatus !== "unknown"
        ? "Custom preview unavailable"
        : "Platform preview",
    customPreviewUrl: input.customPreviewUrl ?? null,
    eventId: input.eventId,
    fallbackUrl,
    healthStatus: input.healthStatus,
    lastHealthCheckedAt: input.lastHealthCheckedAt ?? null,
    platformEventSlug: input.eventSlug,
    publicWebsiteUrl: input.linkSet?.displayUrl ?? null,
    routeMode: input.routeMode ?? "default",
    savedRevision: input.savedRevision ?? 0,
  };
}

function buildCustomPreviewUrl(input: {
  accessToken?: string | null;
  eventSlug: string | null;
  previewToken: string;
  savedRevision: number;
  originUrl: string;
}) {
  const url = new URL(input.originUrl);

  if (input.eventSlug) {
    url.searchParams.set("eventSlug", input.eventSlug);
  }

  url.searchParams.set("preview", "dashboard");
  url.searchParams.set("previewToken", input.previewToken);
  url.searchParams.set("revision", String(input.savedRevision));

  return appendPrivateAccessToken(url.toString(), input.accessToken) ?? url.toString();
}

function normalizeHealthStatus(value: string | null): CustomWebsiteHealthStatus {
  if (
    value === "healthy" ||
    value === "frontend_unreachable" ||
    value === "event_not_found" ||
    value === "event_content_invalid" ||
    value === "preview_misconfigured" ||
    value === "contract_invalid"
  ) {
    return value;
  }

  return "unknown";
}

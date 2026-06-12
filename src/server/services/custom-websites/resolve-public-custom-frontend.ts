import "server-only";

import { cache } from "react";
import { PUBLIC_EVENT_RENDER_VISIBILITIES, PublicEventSlugSchema } from "@/lib/event-website/public-event";
import { hasPublishedPrivateAccess, normalizePrivateAccessToken } from "@/lib/private-access";
import { createAdminClient } from "@/lib/supabase/admin";
import type { CustomWebsiteHealthStatus } from "./types";

type PublishedEventLookupRow = {
  archived_at: string | null;
  client_id: string;
  event_slug: string;
  fallback_page_enabled: boolean;
  id: string;
  private_access_token: string | null;
  published_at: string | null;
  status: string;
  subdomain_slug: string | null;
  visibility: "private" | "public" | "unlisted";
};

type CustomWebsiteLookupRow = {
  custom_frontend_enabled: boolean;
  custom_frontend_origin_url: string | null;
  event_id: string;
  id: string;
  last_health_status: string | null;
  platform_event_slug: string | null;
  preview_enabled: boolean;
};

export type PublicCustomFrontendResolution = {
  clientId: string;
  customFrontendEnabled: boolean;
  customFrontendOriginUrl: string | null;
  customWebsiteId: string | null;
  eventId: string;
  eventSlug: string;
  healthStatus: CustomWebsiteHealthStatus;
  previewEnabled: boolean;
  subdomainSlug: string;
};

export const resolvePublicCustomFrontendBySubdomain = cache(
  async (
    subdomainSlugInput: string,
    accessTokenInput?: string | null,
  ): Promise<PublicCustomFrontendResolution | null> => {
    const parsedSlug = PublicEventSlugSchema.safeParse(subdomainSlugInput);

    if (!parsedSlug.success) {
      return null;
    }

    const subdomainSlug = parsedSlug.data;
    const accessToken = normalizePrivateAccessToken(accessTokenInput);
    const supabase = createAdminClient();
    const { data: event, error: eventError } = await supabase
      .from("rsvp_events")
      .select(
        `
          id,
          client_id,
          event_slug,
          subdomain_slug,
          status,
          published_at,
          fallback_page_enabled,
          private_access_token,
          visibility,
          archived_at
        `,
      )
      .eq("subdomain_slug", subdomainSlug)
      .eq("status", "published")
      .eq("fallback_page_enabled", true)
      .in("visibility", PUBLIC_EVENT_RENDER_VISIBILITIES)
      .is("archived_at", null)
      .maybeSingle();

    if (eventError) {
      throw eventError;
    }

    const publishedEvent = event as PublishedEventLookupRow | null;

    if (!publishedEvent?.id || !publishedEvent.event_slug || !publishedEvent.subdomain_slug) {
      return null;
    }

    if (
      !hasPublishedPrivateAccess({
        providedToken: accessToken,
        storedToken: publishedEvent.private_access_token,
        visibility: publishedEvent.visibility,
      })
    ) {
      return null;
    }

    const { data: customWebsite, error: customWebsiteError } = await supabase
      .from("client_custom_websites")
      .select(
        `
          id,
          event_id,
          custom_frontend_origin_url,
          custom_frontend_enabled,
          platform_event_slug,
          preview_enabled,
          last_health_status
        `,
      )
      .eq("event_id", publishedEvent.id)
      .maybeSingle();

    if (customWebsiteError) {
      throw customWebsiteError;
    }

    const customRow = customWebsite as CustomWebsiteLookupRow | null;

    return {
      clientId: publishedEvent.client_id,
      customFrontendEnabled: Boolean(
        customRow?.custom_frontend_enabled && customRow?.custom_frontend_origin_url,
      ),
      customFrontendOriginUrl: customRow?.custom_frontend_origin_url ?? null,
      customWebsiteId: customRow?.id ?? null,
      eventId: publishedEvent.id,
      eventSlug: customRow?.platform_event_slug ?? publishedEvent.event_slug,
      healthStatus: normalizeHealthStatus(customRow?.last_health_status ?? null),
      previewEnabled: customRow?.preview_enabled ?? true,
      subdomainSlug: publishedEvent.subdomain_slug,
    };
  },
);

function normalizeHealthStatus(value: string | null): CustomWebsiteHealthStatus {
  if (value === "healthy" || value === "unhealthy") {
    return value;
  }

  return "unknown";
}

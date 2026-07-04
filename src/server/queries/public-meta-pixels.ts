import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

export type PublicMetaPixelRoute = "application" | "event_page" | "rsvp_submit";

export type PublicMetaPixelConfig = {
  id: string;
  pixelId: string;
  trackingScope: string;
};

type PublicMetaPixelInput = {
  eventSlug?: string;
  route: PublicMetaPixelRoute;
};

export async function getPublicMetaPixelsForRoute(input: PublicMetaPixelInput) {
  const supabase = createAdminClient();
  const eventId = input.eventSlug ? await getPublishedEventId(input.eventSlug) : null;
  const scopes = getRouteScopes(input.route);
  const { data, error } = await supabase
    .from("meta_pixels")
    .select("id, pixel_id, tracking_scope, event_id")
    .eq("is_active", true)
    .in("tracking_scope", eventId ? [...scopes, "event"] : scopes);

  if (error) {
    throw error;
  }

  return (data ?? [])
    .filter((pixel) => pixel.tracking_scope !== "event" || pixel.event_id === eventId)
    .map((pixel) => ({
      id: pixel.id,
      pixelId: pixel.pixel_id,
      trackingScope: pixel.tracking_scope,
    }));
}

async function getPublishedEventId(eventSlug: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("rsvp_events")
    .select("id")
    .eq("event_slug", eventSlug)
    .eq("status", "published")
    .in("visibility", ["public", "unlisted"])
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data?.id ?? null;
}

function getRouteScopes(route: PublicMetaPixelRoute) {
  switch (route) {
    case "application":
      return ["global_public", "application"];
    case "event_page":
      return ["event_page"];
    case "rsvp_submit":
      return ["rsvp_submit"];
    default:
      return ["global_public"];
  }
}

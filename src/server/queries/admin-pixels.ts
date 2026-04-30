import "server-only";

import { requireAdmin } from "@/lib/permissions";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export type AdminMetaPixelScope =
  | "application"
  | "disabled"
  | "event"
  | "event_page"
  | "global_public"
  | "rsvp_submit";

export type AdminMetaPixelItem = {
  createdAt: string;
  eventId: string | null;
  eventLabel: string | null;
  id: string;
  isActive: boolean;
  maskedPixelId: string;
  name: string;
  notes: string | null;
  pixelId: string;
  trackingScope: AdminMetaPixelScope;
  trackingScopeLabel: string;
  updatedAt: string;
};

export type AdminMetaPixelEventOption = {
  id: string;
  label: string;
};

export type AdminMetaPixelsResult = {
  eventOptions: AdminMetaPixelEventOption[];
  generatedAt: string;
  pixels: AdminMetaPixelItem[];
};

export async function getAdminPixels(): Promise<AdminMetaPixelsResult> {
  await requireAdmin();
  const supabase = await createServerSupabaseClient();
  const [pixelsResult, eventsResult] = await Promise.all([
    supabase
      .from("meta_pixels")
      .select(
        "id, event_id, name, notes, pixel_id, is_active, tracking_scope, created_at, updated_at",
      )
      .order("created_at", { ascending: false }),
    supabase
      .from("rsvp_events")
      .select("id, title, event_slug, event_date")
      .order("event_date", { ascending: false }),
  ]);

  if (pixelsResult.error) {
    throw pixelsResult.error;
  }

  if (eventsResult.error) {
    throw eventsResult.error;
  }

  const eventOptions = (eventsResult.data ?? []).map((event) => ({
    id: event.id,
    label: buildEventLabel(event),
  }));
  const eventLabelById = new Map(eventOptions.map((event) => [event.id, event.label]));

  return {
    eventOptions,
    generatedAt: new Date().toISOString(),
    pixels: (pixelsResult.data ?? []).map((pixel) => ({
      createdAt: pixel.created_at,
      eventId: pixel.event_id,
      eventLabel: pixel.event_id ? (eventLabelById.get(pixel.event_id) ?? null) : null,
      id: pixel.id,
      isActive: pixel.is_active,
      maskedPixelId: maskPixelId(pixel.pixel_id),
      name: pixel.name,
      notes: pixel.notes,
      pixelId: pixel.pixel_id,
      trackingScope: normalizeScope(pixel.tracking_scope),
      trackingScopeLabel: formatScopeLabel(pixel.tracking_scope),
      updatedAt: pixel.updated_at,
    })),
  };
}

function normalizeScope(scope: string): AdminMetaPixelScope {
  switch (scope) {
    case "application":
    case "disabled":
    case "event":
    case "event_page":
    case "global_public":
    case "rsvp_submit":
      return scope;
    default:
      return "global_public";
  }
}

function formatScopeLabel(scope: string) {
  switch (scope) {
    case "global_public":
      return "Global / All public pages";
    case "application":
      return "Application page";
    case "event_page":
      return "RSVP event page";
    case "rsvp_submit":
      return "RSVP submitted / thank-you";
    case "event":
      return "Event-level";
    case "disabled":
      return "Disabled / draft";
    default:
      return "Global / All public pages";
  }
}

function maskPixelId(pixelId: string) {
  return `${"*".repeat(Math.max(0, pixelId.length - 4))}${pixelId.slice(-4)}`;
}

function buildEventLabel(event: { event_date: string | null; event_slug: string; title: string }) {
  const suffix = event.event_date ? ` · ${event.event_date}` : "";
  return `${event.title || event.event_slug}${suffix}`;
}

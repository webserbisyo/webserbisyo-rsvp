import "server-only";

import { requireTenantMember } from "@/lib/permissions";
import type { Json } from "@/lib/supabase/types";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export type DashboardEventWebsiteData = {
  eventContent: {
    contentJson: Json;
    coupleOrCelebrantNames: string | null;
    heroSubtitle: string | null;
    heroTitle: string | null;
    rsvpNote: string | null;
    scheduleNote: string | null;
    venueNote: string | null;
  } | null;
  eventDate: string | null;
  eventTime: string | null;
  eventType: string | null;
  maxGuestCount: number | null;
  rsvpCloseAt: string | null;
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

  const { data: events, error } = await supabase
    .from("rsvp_events")
    .select(
      `
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
          hero_title,
          hero_subtitle,
          schedule_note,
          venue_note,
          rsvp_note
        )
      `,
    )
    .eq("client_id", clientId)
    .order("created_at", { ascending: false })
    .limit(1);

  if (error) {
    throw error;
  }

  const event = events?.[0] ?? null;
  const eventContent = Array.isArray(event?.event_content)
    ? (event.event_content[0] ?? null)
    : (event?.event_content ?? null);

  return {
    eventContent: eventContent
      ? {
          contentJson: eventContent.content_json,
          coupleOrCelebrantNames: eventContent.couple_or_celebrant_names,
          heroSubtitle: eventContent.hero_subtitle,
          heroTitle: eventContent.hero_title,
          rsvpNote: eventContent.rsvp_note,
          scheduleNote: eventContent.schedule_note,
          venueNote: eventContent.venue_note,
        }
      : null,
    eventDate: event?.event_date ?? null,
    eventTime: event?.event_time ?? null,
    eventType: event?.event_type ?? null,
    maxGuestCount: event?.max_guest_count ?? null,
    rsvpCloseAt: event?.rsvp_close_at ?? null,
    title: event?.title ?? null,
    venueAddress: event?.venue_address ?? null,
    venueName: event?.venue_name ?? null,
  };
}

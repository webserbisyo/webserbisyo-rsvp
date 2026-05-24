import "server-only";

import {
  isValidPublicRsvpSlug,
  sanitizePublicRsvpSlug,
} from "@/lib/public-rsvp-slugs";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { TablesInsert } from "@/lib/supabase/types";
import { assertServiceData, assertServiceSuccess, ServiceError } from "./service-error";

export type CreateDraftEventInput = {
  clientId: string;
  eventDate?: string | null;
  eventLocation?: string | null;
  eventSlug?: string | null;
  eventType: string;
  maxGuestCount?: number | null;
  title: string;
};

function slugify(value: string): string {
  const sanitized = sanitizePublicRsvpSlug(value);

  if (isValidPublicRsvpSlug(sanitized)) {
    return sanitized;
  }

  const fallback = sanitizePublicRsvpSlug(sanitized ? `${sanitized}-event` : "event");
  return isValidPublicRsvpSlug(fallback) ? fallback : "event";
}

async function resolveUniqueSlug(baseSlug: string): Promise<string> {
  const supabase = await createServerSupabaseClient();
  const safeBase = slugify(baseSlug);

  if (!safeBase) {
    throw new ServiceError("Event slug cannot be empty.");
  }

  for (let attempt = 0; attempt < 25; attempt += 1) {
    const candidate = attempt === 0 ? safeBase : `${safeBase}-${attempt + 1}`;
    const { data, error } = await supabase
      .from("rsvp_events")
      .select("id")
      .eq("event_slug", candidate)
      .maybeSingle();

    assertServiceSuccess(error, "Failed to check event slug uniqueness.");

    if (!data) {
      return candidate;
    }
  }

  throw new ServiceError("Unable to generate a unique event slug.");
}

export async function createDraftEvent(input: CreateDraftEventInput) {
  const supabase = await createServerSupabaseClient();
  const slug = await resolveUniqueSlug(
    input.eventSlug ?? `${input.title}-${input.eventDate ?? input.eventType}`,
  );

  const eventRow: TablesInsert<"rsvp_events"> = {
    client_id: input.clientId,
    event_date: input.eventDate ?? null,
    event_slug: slug,
    event_type: input.eventType,
    max_guest_count: input.maxGuestCount ?? null,
    status: "draft",
    title: input.title,
    venue_address: input.eventLocation ?? null,
    visibility: "private",
  };

  const { data: event, error: eventError } = await supabase
    .from("rsvp_events")
    .insert(eventRow)
    .select("*")
    .single();

  assertServiceSuccess(eventError, "Failed to create draft RSVP event.");
  assertServiceData(event, "Draft event insert returned no row.");

  const contentRow: TablesInsert<"event_content"> = {
    content_json: {},
    event_id: event.id,
    hero_title: event.title,
  };

  const { data: content, error: contentError } = await supabase
    .from("event_content")
    .insert(contentRow)
    .select("*")
    .single();

  assertServiceSuccess(contentError, "Failed to create draft event content.");
  assertServiceData(content, "Draft event content insert returned no row.");

  return { content, event };
}

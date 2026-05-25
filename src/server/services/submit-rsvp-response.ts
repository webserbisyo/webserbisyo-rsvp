import "server-only";

import { isPublicRenderingEventTypeEnabled } from "@/config/event-type-availability";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Tables, TablesInsert } from "@/lib/supabase/types";
import {
  PublicRsvpResponseSchema,
  type PublicRsvpResponseInput,
} from "@/lib/validations/rsvp-response.schema";
import { assertServiceData, assertServiceSuccess, ServiceError } from "./service-error";
import { writeAuditLog } from "./write-audit-log";

type PublishedEventRow = Pick<
  Tables<"rsvp_events">,
  | "client_id"
  | "event_slug"
  | "fallback_page_enabled"
  | "id"
  | "published_at"
  | "rsvp_close_at"
  | "rsvp_open_at"
  | "status"
  | "event_type"
  | "visibility"
>;

type PublishedContentRow = Pick<Tables<"event_content">, "published_at" | "published_content_json">;

export async function submitRsvpResponse(input: PublicRsvpResponseInput) {
  const payload = PublicRsvpResponseSchema.parse(input);
  const supabase = createAdminClient();
  // Public RSVP writes intentionally use a server-only admin client after validation.
  // Dashboard reads stay on SSR + RLS so browser-facing code never receives service-role access.
  const event = await getPublishedEvent(payload.eventSlug);
  const eventContent = await getPublishedEventContent(event.id);
  const { parseEventWebsiteContentJson } = await import("@/lib/event-website/hydration");
  const content = parseEventWebsiteContentJson(eventContent.published_content_json);

  if (!content) {
    throw new ServiceError("RSVP form is not available for this event.");
  }

  if (!isPublicRenderingEventTypeEnabled(event.event_type)) {
    throw new ServiceError("RSVP form is not available for this event.");
  }

  if (!content.layout.enabledSections.rsvp_form) {
    throw new ServiceError("RSVP form is not available for this event.");
  }

  assertRsvpWindowIsOpen(event);

  const rsvpSettings = content.sections.rsvp_form;
  // TODO: Custom question answers are intentionally excluded from the public submit contract
  // until a storage model and dashboard read flow are defined for them.
  const companionRows = buildCompanionRows(payload, rsvpSettings);
  const partySize = payload.attendanceStatus === "attending" ? 1 + payload.companionCount : 1;
  const responsePayload: TablesInsert<"rsvp_responses"> = {
    attendance_status: payload.attendanceStatus,
    client_id: event.client_id,
    dietary_notes: rsvpSettings.foodAllergiesEnabled ? (payload.dietaryNotes ?? null) : null,
    email: payload.email ?? null,
    event_id: event.id,
    guest_name: payload.guestName,
    message: rsvpSettings.messageToHostEnabled ? (payload.message ?? null) : null,
    party_size: partySize,
    phone: payload.phone ?? null,
    source: "public_fallback_page",
  };

  const { data: response, error: responseError } = await supabase
    .from("rsvp_responses")
    .insert(responsePayload)
    .select("*")
    .single();

  assertServiceSuccess(responseError, "Failed to submit RSVP response.");
  assertServiceData(response, "RSVP response insert returned no row.");

  if (companionRows.length > 0) {
    const { error: companionsError } = await supabase.from("rsvp_response_companions").insert(
      companionRows.map((companion) => ({
        ...companion,
        response_id: response.id,
      })),
    );

    assertServiceSuccess(companionsError, "Failed to save RSVP companions.");
  }

  await writeAuditLog({
    action: "rsvp_response_submitted",
    clientId: event.client_id,
    entityId: response.id,
    entityType: "rsvp_responses",
    eventId: event.id,
    metadata: {
      attendance_status: response.attendance_status,
      companion_count: companionRows.length,
      party_size: response.party_size,
      source: response.source,
    },
  });

  return response;
}

async function getPublishedEvent(eventSlug: string): Promise<PublishedEventRow> {
  const supabase = createAdminClient();
  const { data: event, error } = await supabase
    .from("rsvp_events")
    .select(
      "id, client_id, event_slug, event_type, fallback_page_enabled, status, visibility, published_at, rsvp_open_at, rsvp_close_at",
    )
    .eq("event_slug", eventSlug)
    .eq("status", "published")
    .eq("fallback_page_enabled", true)
    .in("visibility", ["public", "unlisted", "private"])
    .is("archived_at", null)
    .maybeSingle();

  assertServiceSuccess(error, "Failed to load RSVP event.");

  if (!event?.published_at) {
    throw new ServiceError("RSVP event is not available.");
  }

  return event;
}

async function getPublishedEventContent(eventId: string): Promise<PublishedContentRow> {
  const supabase = createAdminClient();
  const { data: eventContent, error } = await supabase
    .from("event_content")
    .select("published_content_json, published_at")
    .eq("event_id", eventId)
    .maybeSingle();

  assertServiceSuccess(error, "Failed to load RSVP form settings.");

  if (!eventContent?.published_at || !eventContent.published_content_json) {
    throw new ServiceError("RSVP form is not available for this event.");
  }

  return eventContent;
}

function assertRsvpWindowIsOpen(event: PublishedEventRow) {
  const now = Date.now();

  if (event.rsvp_open_at && new Date(event.rsvp_open_at).getTime() > now) {
    throw new ServiceError("RSVP submissions are not open yet.");
  }

  if (event.rsvp_close_at && new Date(event.rsvp_close_at).getTime() < now) {
    throw new ServiceError("RSVP submissions are closed.");
  }
}

function buildCompanionRows(
  payload: PublicRsvpResponseInput,
  settings: {
    companionAgeEnabled: boolean;
    companionLimit: number;
    companionNameEnabled: boolean;
    plusOneEnabled: boolean;
  },
): Omit<TablesInsert<"rsvp_response_companions">, "response_id">[] {
  if (payload.attendanceStatus === "not_attending") {
    return [];
  }

  if (payload.companionCount === 0) {
    return [];
  }

  if (!settings.plusOneEnabled) {
    throw new ServiceError("Companions are not enabled for this event.");
  }

  if (payload.companionCount > settings.companionLimit) {
    throw new ServiceError(`This event allows up to ${settings.companionLimit} companions.`);
  }

  if (!settings.companionNameEnabled) {
    return [];
  }

  const companions = payload.companions ?? [];
  const rows: Omit<TablesInsert<"rsvp_response_companions">, "response_id">[] = [];

  for (let index = 0; index < payload.companionCount; index += 1) {
    const companion = companions[index];
    const fullName = companion?.fullName.trim();

    if (!companion || !fullName) {
      throw new ServiceError("Please enter each companion name.");
    }

    rows.push({
      age_label: settings.companionAgeEnabled ? (companion.ageLabel ?? null) : null,
      full_name: fullName,
    });
  }

  return rows;
}

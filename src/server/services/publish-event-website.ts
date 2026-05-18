import "server-only";

import { mergeEventWebsiteContent, normalizeEventWebsiteContentForSave } from "@/lib/event-website/hydration";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Json, TablesUpdate } from "@/lib/supabase/types";
import { ZodError } from "zod";
import { assertServiceData, ServiceError } from "./service-error";
import { writeAuditLog } from "./write-audit-log";

export type PublishEventWebsiteInput = {
  actorUserId: string;
  clientId: string;
  confirmWarnings?: boolean;
  eventId: string;
};

export type PublishEventWebsiteResult =
  {
    publishedAt: string;
    state: "published";
  };

export type UnpublishEventWebsiteInput = {
  actorUserId: string;
  clientId: string;
  eventId: string;
};

export type UnpublishEventWebsiteResult = {
  state: "unpublished";
};

export async function publishEventWebsite(
  input: PublishEventWebsiteInput,
): Promise<PublishEventWebsiteResult> {
  const supabase = createAdminClient();
  const { data: eventRecord, error } = await supabase
    .from("rsvp_events")
    .select(
      `
        id,
        client_id,
        event_slug,
        status,
        published_at,
        event_date,
        event_time,
        rsvp_close_at,
        venue_name,
        venue_address,
        event_content (
          id,
          content_json
        )
      `,
    )
    .eq("id", input.eventId)
    .eq("client_id", input.clientId)
    .single();

  if (error) {
    throw new ServiceError("Failed to load the event for publishing.", error);
  }

  assertServiceData(eventRecord, "The selected event could not be found.");

  if (eventRecord.status === "archived") {
    throw new ServiceError("Archived events cannot be published.");
  }

  if (!eventRecord.event_slug) {
    throw new ServiceError("This event is missing its public slug and cannot be published yet.");
  }

  const eventContent = Array.isArray(eventRecord.event_content)
    ? (eventRecord.event_content[0] ?? null)
    : eventRecord.event_content;

  assertServiceData(eventContent, "The Event Website draft content is missing.");

  let normalizedDraft;

  try {
    normalizedDraft = mergeEventWebsiteContent(normalizeEventWebsiteContentForSave(eventContent.content_json), {
      event: {
        eventDate: eventRecord.event_date,
        eventTime: eventRecord.event_time,
        eventType: null,
        rsvpCloseAt: eventRecord.rsvp_close_at,
        venueAddress: eventRecord.venue_address,
        venueName: eventRecord.venue_name,
      },
    });
  } catch (error) {
    if (error instanceof ZodError) {
      throw new ServiceError("The saved Event Website draft is invalid and cannot be published.");
    }

    throw error;
  }

  const publishedAt = new Date().toISOString();
  const contentRow: TablesUpdate<"event_content"> = {
    published_at: publishedAt,
    published_by: input.actorUserId,
    published_content_json: normalizedDraft as unknown as Json,
  };
  const eventRow: TablesUpdate<"rsvp_events"> = {
    published_at: publishedAt,
    status: "published",
  };

  const { data: contentUpdate, error: contentError } = await supabase
    .from("event_content")
    .update(contentRow)
    .eq("event_id", input.eventId)
    .select("id")
    .single();

  if (contentError) {
    throw new ServiceError("Failed to update the published Event Website snapshot.", contentError);
  }

  assertServiceData(contentUpdate, "Published Event Website snapshot update returned no row.");

  const { data: publishedEvent, error: eventUpdateError } = await supabase
    .from("rsvp_events")
    .update(eventRow)
    .eq("id", input.eventId)
    .eq("client_id", input.clientId)
    .select("id")
    .single();

  if (eventUpdateError) {
    throw new ServiceError("Failed to mark the Event Website as published.", eventUpdateError);
  }

  assertServiceData(publishedEvent, "Publish state update returned no event row.");

  await writeAuditLog({
    action: "event_website_published",
    actorUserId: input.actorUserId,
    clientId: input.clientId,
    entityId: eventContent.id,
    entityType: "event_content",
    eventId: input.eventId,
    metadata: {
      eventType: normalizedDraft.eventType,
      version: normalizedDraft.version,
    },
  });

  return {
    publishedAt,
    state: "published",
  };
}

export async function unpublishEventWebsite(
  input: UnpublishEventWebsiteInput,
): Promise<UnpublishEventWebsiteResult> {
  const supabase = createAdminClient();

  const { data: eventRecord, error } = await supabase
    .from("rsvp_events")
    .select(
      `
        id,
        client_id,
        event_content (
          id
        )
      `,
    )
    .eq("id", input.eventId)
    .eq("client_id", input.clientId)
    .single();

  if (error) {
    throw new ServiceError("Failed to load the event for unpublishing.", error);
  }

  assertServiceData(eventRecord, "The selected event could not be found.");

  const eventContent = Array.isArray(eventRecord.event_content)
    ? (eventRecord.event_content[0] ?? null)
    : eventRecord.event_content;

  assertServiceData(eventContent, "The Event Website content record is missing.");

  const { data: contentUpdate, error: contentError } = await supabase
    .from("event_content")
    .update({
      published_at: null,
      published_by: null,
    })
    .eq("event_id", input.eventId)
    .select("id")
    .single();

  if (contentError) {
    throw new ServiceError("Failed to clear published Event Website metadata.", contentError);
  }

  assertServiceData(contentUpdate, "Published metadata clear returned no row.");

  const { data: eventUpdate, error: eventError } = await supabase
    .from("rsvp_events")
    .update({
      published_at: null,
      status: "ready",
    })
    .eq("id", input.eventId)
    .eq("client_id", input.clientId)
    .select("id")
    .single();

  if (eventError) {
    throw new ServiceError("Failed to update the event publish state.", eventError);
  }

  assertServiceData(eventUpdate, "Event unpublish returned no event row.");

  await writeAuditLog({
    action: "event_website_unpublished",
    actorUserId: input.actorUserId,
    clientId: input.clientId,
    entityId: eventContent.id,
    entityType: "event_content",
    eventId: input.eventId,
  });

  return {
    state: "unpublished",
  };
}

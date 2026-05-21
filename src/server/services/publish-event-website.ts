import "server-only";

import type { PostgrestError } from "@supabase/supabase-js";
import { mergeEventWebsiteContent, normalizeEventWebsiteContentForSave } from "@/lib/event-website/hydration";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Json, TablesUpdate } from "@/lib/supabase/types";
import { ZodError } from "zod";
import { assertServiceData, ServiceError } from "./service-error";
import { writeAuditLog } from "./write-audit-log";

type EventContentRecord = {
  content_json: unknown;
  id: string;
  published_at: string | null;
  published_content_json: unknown;
};

type EventWebsiteRecord = {
  client_id: string;
  draft_event_slug: string;
  draft_visibility: string;
  event_content: EventContentRecord | EventContentRecord[] | null;
  event_date: string | null;
  event_slug: string;
  event_time: string | null;
  fallback_page_enabled: boolean;
  id: string;
  published_at: string | null;
  rsvp_close_at: string | null;
  status: string;
  venue_address: string | null;
  venue_name: string | null;
  visibility: string;
  websiteAccessSchemaMode: "draft_live" | "legacy";
};

export type UpdateWebsiteAccessDraftVisibilityInput = {
  actorUserId: string;
  clientId: string;
  draftVisibility: "private" | "public";
  eventId: string;
};

export type UpdateWebsiteAccessDraftVisibilityResult = {
  draftVisibility: "private" | "public";
  updatedAt: string | null;
};

export type UpdateWebsiteAccessDraftSlugInput = {
  actorUserId: string;
  clientId: string;
  draftSlug: string;
  eventId: string;
};

export type UpdateWebsiteAccessDraftSlugResult = {
  draftSlug: string;
  updatedAt: string | null;
};

export type PublishEventWebsiteInput = {
  actorUserId: string;
  clientId: string;
  confirmWarnings?: boolean;
  eventId: string;
};

export type PublishEventWebsiteResult = {
  previousPublishedSlug: string | null;
  publishedAt: string;
  publishedSlug: string;
  publishedVisibility: "private" | "public" | "unlisted";
  state: "published";
};

export type UnpublishEventWebsiteInput = {
  actorUserId: string;
  clientId: string;
  eventId: string;
};

export type UnpublishEventWebsiteResult = {
  previousPublishedSlug: string | null;
  state: "unpublished";
};

export async function updateWebsiteAccessDraftVisibility(
  input: UpdateWebsiteAccessDraftVisibilityInput,
): Promise<UpdateWebsiteAccessDraftVisibilityResult> {
  const supabase = createAdminClient();
  const eventRecord = await getOwnedEventRecord(supabase, input.eventId, input.clientId);

  assertWebsiteAccessDraftSchema(eventRecord);

  if (eventRecord.draft_visibility === input.draftVisibility) {
    return {
      draftVisibility: eventRecord.draft_visibility as "private" | "public",
      updatedAt: null,
    };
  }

  const { data: updatedEvent, error } = await supabase
    .from("rsvp_events")
    .update({
      draft_visibility: input.draftVisibility,
    })
    .eq("id", input.eventId)
    .eq("client_id", input.clientId)
    .select("draft_visibility, website_access_updated_at")
    .single();

  if (error) {
    throw new ServiceError("Failed to save the Website Access draft visibility.", error);
  }

  assertServiceData(updatedEvent, "Website Access draft visibility update returned no row.");

  await writeAuditLog({
    action: "website_access_draft_visibility_updated",
    actorUserId: input.actorUserId,
    clientId: input.clientId,
    entityId: input.eventId,
    entityType: "rsvp_events",
    eventId: input.eventId,
    metadata: {
      next_visibility: input.draftVisibility,
      previous_visibility: eventRecord.draft_visibility,
    },
  });

  return {
    draftVisibility: updatedEvent.draft_visibility as "private" | "public",
    updatedAt: updatedEvent.website_access_updated_at,
  };
}

export async function updateWebsiteAccessDraftSlug(
  input: UpdateWebsiteAccessDraftSlugInput,
): Promise<UpdateWebsiteAccessDraftSlugResult> {
  const supabase = createAdminClient();
  const eventRecord = await getOwnedEventRecord(supabase, input.eventId, input.clientId);

  assertWebsiteAccessDraftSchema(eventRecord);

  if (eventRecord.draft_event_slug === input.draftSlug) {
    return {
      draftSlug: eventRecord.draft_event_slug,
      updatedAt: null,
    };
  }

  await assertSlugIsAvailable(supabase, input.eventId, input.draftSlug);

  const { data: updatedEvent, error } = await supabase
    .from("rsvp_events")
    .update({
      draft_event_slug: input.draftSlug,
    })
    .eq("id", input.eventId)
    .eq("client_id", input.clientId)
    .select("draft_event_slug, website_access_updated_at")
    .single();

  if (error) {
    throw new ServiceError("Failed to save the Website Access draft URL.", error);
  }

  assertServiceData(updatedEvent, "Website Access draft URL update returned no row.");

  await writeAuditLog({
    action: "website_access_draft_slug_updated",
    actorUserId: input.actorUserId,
    clientId: input.clientId,
    entityId: input.eventId,
    entityType: "rsvp_events",
    eventId: input.eventId,
    metadata: {
      next_slug: input.draftSlug,
      previous_slug: eventRecord.draft_event_slug,
    },
  });

  return {
    draftSlug: updatedEvent.draft_event_slug,
    updatedAt: updatedEvent.website_access_updated_at,
  };
}

export async function publishEventWebsite(
  input: PublishEventWebsiteInput,
): Promise<PublishEventWebsiteResult> {
  const supabase = createAdminClient();
  const eventRecord = await getOwnedEventRecord(supabase, input.eventId, input.clientId, true);

  assertWebsiteAccessDraftSchema(eventRecord);

  if (eventRecord.status === "archived") {
    throw new ServiceError("Archived events cannot be published.");
  }

  if (!eventRecord.draft_event_slug) {
    throw new ServiceError("This event is missing its Website Access draft URL.");
  }

  await assertSlugIsAvailable(supabase, input.eventId, eventRecord.draft_event_slug);

  const eventContent = Array.isArray(eventRecord.event_content)
    ? (eventRecord.event_content[0] ?? null)
    : eventRecord.event_content;

  assertServiceData(eventContent, "The Event Website draft content is missing.");

  let normalizedDraft;

  try {
    normalizedDraft = mergeEventWebsiteContent(
      normalizeEventWebsiteContentForSave(eventContent.content_json),
      {
        event: {
          eventDate: eventRecord.event_date,
          eventTime: eventRecord.event_time,
          eventType: null,
          rsvpCloseAt: eventRecord.rsvp_close_at,
          venueAddress: eventRecord.venue_address,
          venueName: eventRecord.venue_name,
        },
      },
    );
  } catch (error) {
    if (error instanceof ZodError) {
      throw new ServiceError("The saved Event Website draft is invalid and cannot be published.");
    }

    throw error;
  }

  const publishedAt = new Date().toISOString();
  const previousPublishedSlug = eventRecord.published_at ? eventRecord.event_slug : null;
  const previousVisibility = eventRecord.visibility;
  const contentRow: TablesUpdate<"event_content"> = {
    published_at: publishedAt,
    published_by: input.actorUserId,
    published_content_json: normalizedDraft as unknown as Json,
  };
  const eventRow: TablesUpdate<"rsvp_events"> = {
    event_slug: eventRecord.draft_event_slug,
    published_at: publishedAt,
    status: "published",
    visibility: eventRecord.draft_visibility,
  };

  const { data: publishedEvent, error: eventUpdateError } = await supabase
    .from("rsvp_events")
    .update(eventRow)
    .eq("id", input.eventId)
    .eq("client_id", input.clientId)
    .select("id, event_slug, visibility")
    .single();

  if (eventUpdateError) {
    throw new ServiceError("Failed to mark the Event Website as published.", eventUpdateError);
  }

  assertServiceData(publishedEvent, "Publish state update returned no event row.");

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

  await writeAuditLog({
    action: "event_website_published",
    actorUserId: input.actorUserId,
    clientId: input.clientId,
    entityId: eventContent.id,
    entityType: "event_content",
    eventId: input.eventId,
    metadata: {
      next_slug: publishedEvent.event_slug,
      next_visibility: publishedEvent.visibility,
      previous_slug: eventRecord.event_slug,
      previous_visibility: previousVisibility,
      version: normalizedDraft.version,
    },
  });

  return {
    previousPublishedSlug,
    publishedAt,
    publishedSlug: publishedEvent.event_slug,
    publishedVisibility: publishedEvent.visibility as "private" | "public" | "unlisted",
    state: "published",
  };
}

export async function unpublishEventWebsite(
  input: UnpublishEventWebsiteInput,
): Promise<UnpublishEventWebsiteResult> {
  const supabase = createAdminClient();
  const eventRecord = await getOwnedEventRecord(supabase, input.eventId, input.clientId, true);
  const eventContent = Array.isArray(eventRecord.event_content)
    ? (eventRecord.event_content[0] ?? null)
    : eventRecord.event_content;

  assertServiceData(eventContent, "The Event Website content record is missing.");

  const previousPublishedSlug = eventRecord.event_slug ?? null;

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

  await writeAuditLog({
    action: "event_website_unpublished",
    actorUserId: input.actorUserId,
    clientId: input.clientId,
    entityId: eventContent.id,
    entityType: "event_content",
    eventId: input.eventId,
    metadata: {
      previous_slug: previousPublishedSlug,
      previous_visibility: eventRecord.visibility,
    },
  });

  return {
    previousPublishedSlug,
    state: "unpublished",
  };
}

async function getOwnedEventRecord(
  supabase: ReturnType<typeof createAdminClient>,
  eventId: string,
  clientId: string,
  includeContent = false,
): Promise<EventWebsiteRecord> {
  const primarySelect = includeContent
    ? `
        id,
        client_id,
        event_slug,
        draft_event_slug,
        visibility,
        draft_visibility,
        status,
        published_at,
        fallback_page_enabled,
        event_date,
        event_time,
        rsvp_close_at,
        venue_name,
        venue_address,
        event_content (
          id,
          content_json,
          published_content_json,
          published_at
        )
      `
    : `
        id,
        client_id,
        event_slug,
        draft_event_slug,
        visibility,
        draft_visibility,
        status,
        published_at,
        fallback_page_enabled,
        event_date,
        event_time,
        rsvp_close_at,
        venue_name,
        venue_address
      `;

  const { data: eventRecord, error } = await supabase
    .from("rsvp_events")
    .select(primarySelect)
    .eq("id", eventId)
    .eq("client_id", clientId)
    .single();

  if (!error) {
    assertServiceData(eventRecord, "The selected event could not be found.");
    return {
      ...(eventRecord as unknown as Omit<EventWebsiteRecord, "websiteAccessSchemaMode">),
      websiteAccessSchemaMode: "draft_live",
    };
  }

  if (!isMissingWebsiteAccessDraftColumnError(error)) {
    throw new ServiceError("Failed to load the event Website record.", error);
  }

  const fallbackSelect = includeContent
    ? `
        id,
        client_id,
        event_slug,
        visibility,
        status,
        published_at,
        fallback_page_enabled,
        event_date,
        event_time,
        rsvp_close_at,
        venue_name,
        venue_address,
        event_content (
          id,
          content_json,
          published_content_json,
          published_at
        )
      `
    : `
        id,
        client_id,
        event_slug,
        visibility,
        status,
        published_at,
        fallback_page_enabled,
        event_date,
        event_time,
        rsvp_close_at,
        venue_name,
        venue_address
      `;

  const { data: legacyEventRecord, error: legacyError } = await supabase
    .from("rsvp_events")
    .select(fallbackSelect)
    .eq("id", eventId)
    .eq("client_id", clientId)
    .single();

  if (legacyError) {
    throw new ServiceError("Failed to load the event Website record.", legacyError);
  }

  assertServiceData(legacyEventRecord, "The selected event could not be found.");
  const legacyEvent = legacyEventRecord as unknown as Omit<
    EventWebsiteRecord,
    "draft_event_slug" | "draft_visibility" | "websiteAccessSchemaMode"
  >;

  return {
    ...legacyEvent,
    draft_event_slug: legacyEvent.event_slug,
    draft_visibility: legacyEvent.visibility,
    websiteAccessSchemaMode: "legacy",
  };
}

async function assertSlugIsAvailable(
  supabase: ReturnType<typeof createAdminClient>,
  eventId: string,
  slug: string,
) {
  const { data: conflictingEvent, error } = await supabase
    .from("rsvp_events")
    .select("id")
    .neq("id", eventId)
    .or(`event_slug.eq.${slug},draft_event_slug.eq.${slug}`)
    .limit(1)
    .maybeSingle();

  if (error && isMissingWebsiteAccessDraftColumnError(error)) {
    const { data: legacyConflictingEvent, error: legacyError } = await supabase
      .from("rsvp_events")
      .select("id")
      .neq("id", eventId)
      .eq("event_slug", slug)
      .limit(1)
      .maybeSingle();

    if (legacyError) {
      throw new ServiceError("Failed to check Website Access URL availability.", legacyError);
    }

    if (legacyConflictingEvent) {
      throw new ServiceError("That URL name is already being used by another event.");
    }

    return;
  }

  if (error) {
    throw new ServiceError("Failed to check Website Access URL availability.", error);
  }

  if (conflictingEvent) {
    throw new ServiceError("That URL name is already being used by another event.");
  }
}

function assertWebsiteAccessDraftSchema(eventRecord: EventWebsiteRecord) {
  if (eventRecord.websiteAccessSchemaMode === "draft_live") {
    return;
  }

  throw new ServiceError(
    "Website Access draft fields are not installed on the connected database yet. Apply migration 20260521060125_website_access_draft_live_fields.sql first.",
  );
}

function isMissingWebsiteAccessDraftColumnError(error: PostgrestError) {
  if (error.code !== "42703") {
    return false;
  }

  return ["draft_event_slug", "draft_visibility", "website_access_updated_at"].some((columnName) =>
    error.message.includes(columnName),
  );
}

import "server-only";

import type { PostgrestError } from "@supabase/supabase-js";
import { ZodError } from "zod";
import {
  isDashboardBuilderEventTypeEnabled,
  unsupportedBuilderMessage,
} from "@/config/event-type-availability";
import { mergeEventWebsiteContent, normalizeEventWebsiteContentForSave } from "@/lib/event-website/hydration";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Json, TablesUpdate } from "@/lib/supabase/types";
import { ensurePrivateAccessToken, rotatePrivateAccessToken } from "./private-access-token";
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
  draft_subdomain_slug: string | null;
  draft_visibility: string;
  event_content: EventContentRecord | EventContentRecord[] | null;
  event_date: string | null;
  event_slug: string;
  event_time: string | null;
  event_type: string | null;
  fallback_page_enabled: boolean;
  id: string;
  private_access_token: string | null;
  private_access_token_rotated_at: string | null;
  published_at: string | null;
  rsvp_close_at: string | null;
  status: string;
  subdomain_slug: string | null;
  venue_address: string | null;
  venue_name: string | null;
  visibility: string;
  websiteAccessSchemaMode: "draft_live" | "legacy" | "slug_only";
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

export type UpdateWebsiteAccessDraftSubdomainInput = {
  actorUserId: string;
  clientId: string;
  draftSubdomain: string | null;
  eventId: string;
};

export type UpdateWebsiteAccessDraftSubdomainResult = {
  draftSubdomain: string | null;
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
  previousPublishedSubdomain: string | null;
  publishedAt: string;
  publishedSlug: string;
  publishedSubdomain: string | null;
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
  previousPublishedSubdomain: string | null;
  state: "unpublished";
};

export type RegeneratePrivateLinkInput = {
  actorUserId: string;
  clientId: string;
  eventId: string;
};

export type RegeneratePrivateLinkResult = {
  privateAccessToken: string;
  rotatedAt: string | null;
  updatedAt: string | null;
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

export async function updateWebsiteAccessDraftSubdomain(
  input: UpdateWebsiteAccessDraftSubdomainInput,
): Promise<UpdateWebsiteAccessDraftSubdomainResult> {
  const supabase = createAdminClient();
  const eventRecord = await getOwnedEventRecord(supabase, input.eventId, input.clientId);

  assertWebsiteAccessSubdomainSchema(eventRecord);

  if ((eventRecord.draft_subdomain_slug ?? null) === input.draftSubdomain) {
    return {
      draftSubdomain: eventRecord.draft_subdomain_slug,
      updatedAt: null,
    };
  }

  if (input.draftSubdomain) {
    await assertSubdomainIsAvailable(supabase, input.eventId, input.draftSubdomain);
  }

  const { data: updatedEvent, error } = await supabase
    .from("rsvp_events")
    .update({
      draft_subdomain_slug: input.draftSubdomain,
    })
    .eq("id", input.eventId)
    .eq("client_id", input.clientId)
    .select("draft_subdomain_slug, website_access_updated_at")
    .single();

  if (error) {
    if (isSubdomainUniqueViolation(error)) {
      throw new ServiceError("That RSVP subdomain is already being used by another event.");
    }

    throw new ServiceError("Failed to save the Website Access RSVP subdomain.", error);
  }

  assertServiceData(updatedEvent, "Website Access draft subdomain update returned no row.");

  await writeAuditLog({
    action: "website_access_draft_subdomain_updated",
    actorUserId: input.actorUserId,
    clientId: input.clientId,
    entityId: input.eventId,
    entityType: "rsvp_events",
    eventId: input.eventId,
    metadata: {
      next_subdomain: input.draftSubdomain,
      previous_subdomain: eventRecord.draft_subdomain_slug,
    },
  });

  return {
    draftSubdomain: updatedEvent.draft_subdomain_slug,
    updatedAt: updatedEvent.website_access_updated_at,
  };
}

export async function publishEventWebsite(
  input: PublishEventWebsiteInput,
): Promise<PublishEventWebsiteResult> {
  const supabase = createAdminClient();
  const eventRecord = await getOwnedEventRecord(supabase, input.eventId, input.clientId, true);
  if (!isDashboardBuilderEventTypeEnabled(eventRecord.event_type)) {
    throw new ServiceError(unsupportedBuilderMessage);
  }

  assertWebsiteAccessDraftSchema(eventRecord);

  if (eventRecord.status === "archived") {
    throw new ServiceError("Archived events cannot be published.");
  }

  if (!eventRecord.draft_event_slug) {
    throw new ServiceError("This event is missing its Website Access draft URL.");
  }

  await assertSlugIsAvailable(supabase, input.eventId, eventRecord.draft_event_slug);

  if (eventRecord.websiteAccessSchemaMode === "draft_live" && eventRecord.draft_subdomain_slug) {
    await assertSubdomainIsAvailable(supabase, input.eventId, eventRecord.draft_subdomain_slug);
  }

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
  const previousPublishedSubdomain =
    eventRecord.websiteAccessSchemaMode === "draft_live"
      ? (eventRecord.published_at ? eventRecord.subdomain_slug : null)
      : (eventRecord.published_at ? eventRecord.event_slug : null);
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
  const privateAccessToken =
    eventRecord.draft_visibility === "private"
      ? await ensurePrivateAccessToken({
          clientId: input.clientId,
          currentToken: eventRecord.private_access_token,
          eventId: input.eventId,
        })
      : null;
  const draftLiveEventRow: TablesUpdate<"rsvp_events"> =
    eventRecord.websiteAccessSchemaMode === "draft_live"
      ? {
          ...eventRow,
          ...(privateAccessToken ? { private_access_token: privateAccessToken } : {}),
          subdomain_slug: eventRecord.draft_subdomain_slug,
        }
      : {
          ...eventRow,
          ...(privateAccessToken ? { private_access_token: privateAccessToken } : {}),
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
  const eventUpdateQuery = supabase
    .from("rsvp_events")
    .update(draftLiveEventRow)
    .eq("id", input.eventId)
    .eq("client_id", input.clientId);
  const { data: publishedEvent, error: eventUpdateError } =
    eventRecord.websiteAccessSchemaMode === "draft_live"
      ? await eventUpdateQuery.select("id, event_slug, subdomain_slug, visibility").single()
      : await eventUpdateQuery.select("id, event_slug, visibility").single();

  if (eventUpdateError) {
    if (isSubdomainUniqueViolation(eventUpdateError)) {
      throw new ServiceError("That RSVP subdomain is already being used by another event.");
    }

    throw new ServiceError("Failed to mark the Event Website as published.", eventUpdateError);
  }

  assertServiceData(publishedEvent, "Publish state update returned no event row.");
  const normalizedPublishedEvent = publishedEvent as {
    event_slug: string;
    subdomain_slug?: string | null;
    visibility: string;
  };
  const publishedSubdomainValue =
    eventRecord.websiteAccessSchemaMode === "draft_live"
      ? (typeof normalizedPublishedEvent.subdomain_slug === "string"
          ? normalizedPublishedEvent.subdomain_slug
          : null)
      : normalizedPublishedEvent.event_slug;

  await writeAuditLog({
    action: "event_website_published",
    actorUserId: input.actorUserId,
    clientId: input.clientId,
    entityId: eventContent.id,
    entityType: "event_content",
    eventId: input.eventId,
    metadata: {
      next_slug: normalizedPublishedEvent.event_slug,
      next_subdomain: publishedSubdomainValue,
      next_visibility: normalizedPublishedEvent.visibility,
      previous_slug: eventRecord.event_slug,
      previous_subdomain: previousPublishedSubdomain,
      previous_visibility: previousVisibility,
      version: normalizedDraft.version,
    },
  });

  return {
    previousPublishedSlug,
    previousPublishedSubdomain,
    publishedAt,
    publishedSlug: normalizedPublishedEvent.event_slug,
    publishedSubdomain: publishedSubdomainValue,
    publishedVisibility: normalizedPublishedEvent.visibility as "private" | "public" | "unlisted",
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
  const previousPublishedSubdomain =
    eventRecord.websiteAccessSchemaMode === "draft_live"
      ? eventRecord.subdomain_slug ?? null
      : eventRecord.event_slug ?? null;

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
      previous_subdomain: previousPublishedSubdomain,
      previous_visibility: eventRecord.visibility,
    },
  });

  return {
    previousPublishedSlug,
    previousPublishedSubdomain,
    state: "unpublished",
  };
}

export async function regeneratePrivateLink(
  input: RegeneratePrivateLinkInput,
): Promise<RegeneratePrivateLinkResult> {
  const supabase = createAdminClient();
  const eventRecord = await getOwnedEventRecord(supabase, input.eventId, input.clientId);

  assertWebsiteAccessDraftSchema(eventRecord);

  if (eventRecord.status !== "published" || !eventRecord.published_at) {
    throw new ServiceError("Publish the website before regenerating the private link.");
  }

  if (eventRecord.visibility !== "private") {
    throw new ServiceError(
      "Private link regeneration is available only while Private Link is live.",
    );
  }

  return rotatePrivateAccessToken({
    actorUserId: input.actorUserId,
    clientId: input.clientId,
    eventId: input.eventId,
    previousToken: eventRecord.private_access_token,
  });
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
        event_type,
        draft_event_slug,
        draft_subdomain_slug,
        subdomain_slug,
        private_access_token,
        private_access_token_rotated_at,
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
        event_type,
        draft_event_slug,
        draft_subdomain_slug,
        subdomain_slug,
        private_access_token,
        private_access_token_rotated_at,
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

  if (!isMissingWebsiteAccessSubdomainColumnError(error)) {
    if (!isMissingWebsiteAccessDraftColumnError(error)) {
      throw new ServiceError("Failed to load the event Website record.", error);
    }

    return getDraftSchemaFallbackRecord(supabase, eventId, clientId, includeContent);
  }

  return getDraftSchemaFallbackRecord(supabase, eventId, clientId, includeContent);
}

async function getDraftSchemaFallbackRecord(
  supabase: ReturnType<typeof createAdminClient>,
  eventId: string,
  clientId: string,
  includeContent: boolean,
): Promise<EventWebsiteRecord> {
  const fallbackSelect = includeContent
    ? `
        id,
        client_id,
        event_slug,
        draft_event_slug,
        private_access_token,
        private_access_token_rotated_at,
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
        private_access_token,
        private_access_token_rotated_at,
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

  const { data: draftSchemaEventRecord, error: draftSchemaError } = await supabase
    .from("rsvp_events")
    .select(fallbackSelect)
    .eq("id", eventId)
    .eq("client_id", clientId)
    .single();

  if (!draftSchemaError) {
    assertServiceData(draftSchemaEventRecord, "The selected event could not be found.");
    const draftSchemaEvent = draftSchemaEventRecord as unknown as Omit<
      EventWebsiteRecord,
      "draft_subdomain_slug" | "subdomain_slug" | "websiteAccessSchemaMode"
    >;

    return {
      ...draftSchemaEvent,
      draft_subdomain_slug: draftSchemaEvent.draft_event_slug,
      subdomain_slug: draftSchemaEvent.event_slug,
      websiteAccessSchemaMode: "slug_only",
    };
  }

  if (!isMissingWebsiteAccessDraftColumnError(draftSchemaError)) {
    throw new ServiceError("Failed to load the event Website record.", draftSchemaError);
  }

  const legacySelect = includeContent
    ? `
        id,
        client_id,
        event_slug,
        event_type,
        private_access_token,
        private_access_token_rotated_at,
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
        private_access_token,
        private_access_token_rotated_at,
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

  const legacyEventQuery = supabase.from("rsvp_events") as ReturnType<typeof supabase.from> & {
    select: (columns: string) => {
      eq: (column: string, value: string) => {
        eq: (column: string, value: string) => {
          single: () => Promise<{ data: unknown; error: PostgrestError | null }>;
        };
      };
    };
  };

  const { data: legacyEventRecord, error: legacyError } = await legacyEventQuery
    .select(legacySelect)
    .eq("id", eventId)
    .eq("client_id", clientId)
    .single();

  if (legacyError) {
    throw new ServiceError("Failed to load the event Website record.", legacyError);
  }

  assertServiceData(legacyEventRecord, "The selected event could not be found.");
  const legacyEvent = legacyEventRecord as unknown as {
    client_id: string;
    event_content: EventContentRecord | EventContentRecord[] | null;
    event_date: string | null;
    event_slug: string;
    event_time: string | null;
    event_type: string | null;
    fallback_page_enabled: boolean;
    id: string;
    private_access_token: string | null;
    private_access_token_rotated_at: string | null;
    published_at: string | null;
    rsvp_close_at: string | null;
    status: string;
    venue_address: string | null;
    venue_name: string | null;
    visibility: string;
  };

  return {
    ...legacyEvent,
    draft_event_slug: legacyEvent.event_slug,
    draft_subdomain_slug: legacyEvent.event_slug,
    draft_visibility: legacyEvent.visibility,
    subdomain_slug: legacyEvent.event_slug,
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

async function assertSubdomainIsAvailable(
  supabase: ReturnType<typeof createAdminClient>,
  eventId: string,
  subdomain: string,
) {
  const { data: conflictingEvent, error } = await supabase
    .from("rsvp_events")
    .select("id")
    .neq("id", eventId)
    .or(`subdomain_slug.eq.${subdomain},draft_subdomain_slug.eq.${subdomain}`)
    .limit(1)
    .maybeSingle();

  if (error && isMissingWebsiteAccessSubdomainColumnError(error)) {
    throw new ServiceError(
      "RSVP subdomain fields are not installed on the connected database yet. Apply migration 20260524100000_add_rsvp_subdomain_fields.sql first.",
    );
  }

  if (error) {
    throw new ServiceError("Failed to check RSVP subdomain availability.", error);
  }

  if (conflictingEvent) {
    throw new ServiceError("That RSVP subdomain is already being used by another event.");
  }
}

function assertWebsiteAccessDraftSchema(eventRecord: EventWebsiteRecord) {
  if (eventRecord.websiteAccessSchemaMode === "draft_live" || eventRecord.websiteAccessSchemaMode === "slug_only") {
    return;
  }

  throw new ServiceError(
    "Website Access draft fields are not installed on the connected database yet. Apply migration 20260521060125_website_access_draft_live_fields.sql first.",
  );
}

function assertWebsiteAccessSubdomainSchema(eventRecord: EventWebsiteRecord) {
  if (eventRecord.websiteAccessSchemaMode === "draft_live") {
    return;
  }

  throw new ServiceError(
    "RSVP subdomain fields are not installed on the connected database yet. Apply migration 20260524100000_add_rsvp_subdomain_fields.sql first.",
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

function isMissingWebsiteAccessSubdomainColumnError(error: PostgrestError) {
  if (error.code !== "42703") {
    return false;
  }

  return ["draft_subdomain_slug", "subdomain_slug"].some((columnName) =>
    error.message.includes(columnName),
  );
}

function isSubdomainUniqueViolation(error: PostgrestError) {
  return error.code === "23505" && /subdomain_slug/i.test(error.message);
}

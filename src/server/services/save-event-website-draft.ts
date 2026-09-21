import "server-only";

import {
  isDashboardBuilderEventTypeEnabled,
  unsupportedBuilderMessage,
} from "@/config/event-type-availability";
import { createAdminClient } from "@/lib/supabase/admin";
import { buildEventWebsiteCanonicalEventPatchInput } from "@/lib/event-website/canonical";
import { validateEventWebsiteContentJson } from "@/lib/event-website/hydration";
import type { EventWebsiteContent } from "@/lib/event-website/types";
import {
  EventWebsiteCanonicalEventPatchSchema,
} from "@/lib/validations/event-website.schema";
import type { Json } from "@/lib/supabase/types";
import { logEventWebsiteOperation } from "./event-website-operation-log";
import {
  logImpersonatedAction,
  resolveRpcActorForClient,
} from "./resolve-impersonation-actor";
import { assertServiceData, ServiceError } from "./service-error";

export type SaveEventWebsiteDraftInput = {
  actorUserId: string;
  clientId: string;
  clientSequence: number;
  content: EventWebsiteContent;
  eventId: string;
  expectedRevision: number;
  /** Set when a Super Admin is masquerading as this client. */
  isImpersonating?: boolean;
  /** The real admin profile ID (only when masquerading). */
  realAdminUserId?: string;
};

export type SaveEventWebsiteDraftResult =
  | {
      clientSequence: number;
      content: EventWebsiteContent;
      contentId: string;
      eventId: string;
      savedAt: string;
      savedRevision: number;
      status: "saved";
    }
  | {
      clientSequence: number;
      eventId: string;
      serverRevision: number;
      status: "conflict";
    };

export async function saveEventWebsiteDraft(
  input: SaveEventWebsiteDraftInput,
): Promise<SaveEventWebsiteDraftResult> {
  const validatedContent = validateEventWebsiteContentJson(input.content);

  if (!validatedContent.success) {
    logEventWebsiteOperation("error", {
      category: "validation",
      clientSequence: input.clientSequence,
      eventId: input.eventId,
      expectedRevision: input.expectedRevision,
      issuePaths: validatedContent.error.issues.map((issue) =>
        issue.path.length > 0 ? issue.path.map(String).join(".") : "root",
      ),
      operation: "draft_save",
      stage: "failed",
    });
    throw validatedContent.error;
  }

  const supabase = createAdminClient();
  const { data: eventRecord, error: eventLookupError } = await supabase
    .from("rsvp_events")
    .select("id, client_id, event_type")
    .eq("id", input.eventId)
    .eq("client_id", input.clientId)
    .single();

  if (eventLookupError) {
    throw new ServiceError("Failed to load the Event Website record.", eventLookupError);
  }

  assertServiceData(eventRecord, "The Event Website record could not be resolved.");
  if (!isDashboardBuilderEventTypeEnabled(eventRecord.event_type)) {
    throw new ServiceError(unsupportedBuilderMessage);
  }

  const canonicalPatchResult = EventWebsiteCanonicalEventPatchSchema.safeParse(
    buildEventWebsiteCanonicalEventPatchInput(validatedContent.data),
  );

  if (!canonicalPatchResult.success) {
    throw new ServiceError(getCanonicalPatchErrorMessage(canonicalPatchResult.error));
  }

  // Resolve the correct RPC actor: when an admin is masquerading, delegate
  // to the client's primary owner so the Postgres tenant check passes.
  const resolvedActor = await resolveRpcActorForClient(
    input.actorUserId,
    input.clientId,
    input.isImpersonating,
    input.realAdminUserId,
  );

  const { data, error } = await supabase.rpc("save_event_website_draft_revision", {
    p_actor_user_id: resolvedActor.rpcActorUserId,
    p_canonical_event_patch: canonicalPatchResult.data as unknown as Json,
    p_client_id: input.clientId,
    p_client_sequence: input.clientSequence,
    p_content: validatedContent.data as unknown as Json,
    p_event_id: input.eventId,
    p_expected_revision: input.expectedRevision,
  });

  if (error) {
    throw new ServiceError(
      formatSupabaseWriteError("Failed to save the Event Website draft.", error),
      error,
    );
  }

  assertServiceData(data, "Event Website draft save returned no result.");

  // Log the impersonated write operation for the audit trail
  await logImpersonatedAction("event_website_draft_saved_impersonated", resolvedActor, {
    clientId: input.clientId,
    entityType: "event_content",
    eventId: input.eventId,
    extraMetadata: {
      client_sequence: input.clientSequence,
      expected_revision: input.expectedRevision,
    },
  });

  return parseDraftSaveResult(data, { ...input, content: validatedContent.data });
}

function parseDraftSaveResult(
  value: Json,
  input: SaveEventWebsiteDraftInput,
): SaveEventWebsiteDraftResult {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new ServiceError("Event Website draft save returned an invalid result.");
  }

  if (value.status === "conflict" && typeof value.serverRevision === "number") {
    return {
      clientSequence: input.clientSequence,
      eventId: input.eventId,
      serverRevision: value.serverRevision,
      status: "conflict",
    };
  }

  if (
    value.status !== "saved" ||
    typeof value.contentId !== "string" ||
    typeof value.savedAt !== "string" ||
    typeof value.savedRevision !== "number" ||
    !value.content ||
    typeof value.content !== "object" ||
    Array.isArray(value.content)
  ) {
    throw new ServiceError("Event Website draft save returned an invalid result.");
  }

  return {
    clientSequence: input.clientSequence,
    content: value.content as unknown as EventWebsiteContent,
    contentId: value.contentId,
    eventId: input.eventId,
    savedAt: value.savedAt,
    savedRevision: value.savedRevision,
    status: "saved",
  };
}

function formatSupabaseWriteError(message: string, error: unknown) {
  if (!error || typeof error !== "object") {
    return message;
  }

  const messagePart = "message" in error && typeof error.message === "string" ? error.message : "";
  const detailsPart = "details" in error && typeof error.details === "string" ? error.details : "";
  const hintPart = "hint" in error && typeof error.hint === "string" ? error.hint : "";
  const suffix = [messagePart, detailsPart, hintPart].filter(Boolean).join(" ");

  return suffix ? `${message} ${suffix}` : message;
}

function getCanonicalPatchErrorMessage(error: {
  issues: Array<{ message: string; path: PropertyKey[] }>;
}) {
  const issue = error.issues[0];

  if (!issue) {
    return "Invalid canonical event fields.";
  }

  const [path] = issue.path;

  if (path === "rsvp_close_at") {
    return issue.message === "RSVP deadline must be on or before the ceremony start."
      ? issue.message
      : "Invalid RSVP deadline.";
  }

  if (path === "event_date") {
    return "Invalid ceremony date.";
  }

  if (path === "event_time") {
    return "Invalid ceremony time.";
  }

  if (path === "venue_name") {
    return "Invalid venue name.";
  }

  if (path === "venue_address") {
    return "Invalid venue address.";
  }

  return issue.message || "Invalid canonical event fields.";
}

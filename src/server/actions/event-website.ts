"use server";

import { revalidatePath } from "next/cache";
import { z, ZodError } from "zod";
import {
  isDashboardBuilderEventTypeEnabled,
  unsupportedBuilderMessage,
} from "@/config/event-type-availability";
import { normalizeEventWebsiteContentForSave } from "@/lib/event-website/hydration";
import { AuthenticationError, PermissionError, requireTenantMember } from "@/lib/permissions";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { saveEventWebsiteDraft } from "@/server/services/save-event-website-draft";
import { ServiceError } from "@/server/services/service-error";
import { logEventWebsiteOperation } from "@/server/services/event-website-operation-log";
import { uploadEventWebsiteGiftImage } from "@/server/services/upload-event-website-gift-image";
import { actionFailure, actionSuccess, parseActionInput } from "./action-utils";

const SaveEventWebsiteActionSchema = z.object({
  clientSequence: z.number().int().nonnegative(),
  content: z.unknown(),
  eventId: z.uuid(),
  expectedRevision: z.number().int().nonnegative(),
  mutationId: z.string().uuid(),
});

const GetLatestEventWebsiteDraftActionSchema = z.object({
  eventId: z.uuid(),
});

const GiftImageUploadActionSchema = z.object({
  file: z.custom<File>((value) => value instanceof File && value.size > 0, {
    message: "Upload a valid image file.",
  }),
  optionId: z.string().trim().min(1).max(120),
  title: z.string().trim().max(80).optional(),
});

export async function saveEventWebsiteAction(input: unknown) {
  let eventId = "unresolved";
  let clientSequence: number | undefined;
  let expectedRevision: number | undefined;

  try {
    const profile = await requireTenantMember();
    const payload = parseActionInput(SaveEventWebsiteActionSchema, input);
    eventId = payload.eventId;
    clientSequence = payload.clientSequence;
    expectedRevision = payload.expectedRevision;
    logEventWebsiteOperation("info", {
      clientSequence,
      eventId,
      expectedRevision,
      operation: "draft_save",
      stage: "started",
    });
    const supabase = await createServerSupabaseClient();
    const { data: event, error } = await supabase
      .from("rsvp_events")
      .select("id, client_id, event_type")
      .eq("id", payload.eventId)
      .eq("client_id", profile.client_id ?? "")
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!profile.client_id || !event || event.client_id !== profile.client_id) {
      throw new PermissionError("The requested event does not belong to the current tenant.");
    }

    if (!isDashboardBuilderEventTypeEnabled(event.event_type)) {
      throw new ServiceError(unsupportedBuilderMessage);
    }

    const normalizedContent = normalizeEventWebsiteContentForSave(payload.content);
    const result = await saveEventWebsiteDraft({
      actorUserId: profile.id,
      clientId: profile.client_id,
      clientSequence,
      content: normalizedContent,
      eventId: event.id,
      expectedRevision,
    });

    if (result.status === "conflict") {
      logEventWebsiteOperation("warn", {
        clientSequence,
        eventId,
        expectedRevision,
        operation: "draft_save",
        returnedRevision: result.serverRevision,
        stage: "conflict",
      });
      return actionSuccess(result);
    }

    revalidatePath("/dashboard/event");
    revalidatePath("/dashboard/website-access");
    revalidatePath("/dashboard");

    logEventWebsiteOperation("info", {
      clientSequence,
      eventId,
      expectedRevision,
      operation: "draft_save",
      returnedRevision: result.savedRevision,
      stage: "succeeded",
    });
    return actionSuccess({ ...result, mutationId: payload.mutationId });
  } catch (error) {
    const failure = classifyDraftSaveFailure(error);
    logEventWebsiteOperation("error", {
      category: failure.category,
      clientSequence,
      eventId,
      expectedRevision,
      operation: "draft_save",
      stage: failure.category === "authorization" ? "authorization_failed" : "failed",
    });
    return {
      error: failure.message,
      errorCategory: failure.category,
      ok: false as const,
      retryable: failure.retryable,
    };
  }
}

/** Returns the latest authoritative draft only after the same tenant ownership check used for saves. */
export async function getLatestEventWebsiteDraftAction(input: unknown) {
  try {
    const profile = await requireTenantMember();
    const payload = parseActionInput(GetLatestEventWebsiteDraftActionSchema, input);
    if (!profile.client_id) {
      throw new PermissionError("The current tenant could not be resolved.");
    }

    const supabase = await createServerSupabaseClient();
    const { data: event, error } = await supabase
      .from("rsvp_events")
      .select("id, client_id, event_content ( content_json, saved_at, saved_revision )")
      .eq("id", payload.eventId)
      .eq("client_id", profile.client_id)
      .maybeSingle();

    if (error) throw error;
    if (!event || event.client_id !== profile.client_id) {
      throw new PermissionError("The requested event does not belong to the current tenant.");
    }

    const eventContent = Array.isArray(event.event_content)
      ? (event.event_content[0] ?? null)
      : event.event_content;
    if (!eventContent) throw new ServiceError("The Event Website draft could not be resolved.");

    return actionSuccess({
      content: normalizeEventWebsiteContentForSave(eventContent.content_json),
      savedAt: eventContent.saved_at ?? new Date(0).toISOString(),
      savedRevision: eventContent.saved_revision ?? 0,
    });
  } catch (error) {
    return actionFailure(error);
  }
}

function classifyDraftSaveFailure(error: unknown) {
  if (error instanceof ZodError) {
    return {
      category: "validation",
      message: "Please check the Event Website fields.",
      retryable: false,
    } as const;
  }

  if (error instanceof AuthenticationError || error instanceof PermissionError) {
    return {
      category: "authorization",
      message: error.message,
      retryable: false,
    } as const;
  }

  if (error instanceof ServiceError) {
    const code = getErrorCode(error.cause);
    const retryable = Boolean(code && (/^08/.test(code) || /^53/.test(code) || code === "57P01"));
    return {
      category: retryable ? "temporary" : "permanent",
      message: error.message,
      retryable,
    } as const;
  }

  return {
    category: "temporary",
    message: "Event Website draft could not be saved.",
    retryable: true,
  } as const;
}

function getErrorCode(error: unknown) {
  return error && typeof error === "object" && "code" in error
    ? String((error as { code?: unknown }).code ?? "")
    : "";
}

export async function uploadEventWebsiteGiftImageAction(input: unknown) {
  try {
    const profile = await requireTenantMember();
    const payload = parseActionInput(GiftImageUploadActionSchema, input);

    if (!profile.client_id) {
      throw new PermissionError("The current tenant could not be resolved.");
    }

    const image = await uploadEventWebsiteGiftImage({
      clientId: profile.client_id,
      file: payload.file,
      optionId: payload.optionId,
      title: payload.title,
    });

    return actionSuccess({ image });
  } catch (error) {
    return actionFailure(error);
  }
}

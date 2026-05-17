"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { PermissionError, requireTenantMember } from "@/lib/permissions";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  publishEventWebsite,
  unpublishEventWebsite,
} from "@/server/services/publish-event-website";
import { actionFailure, actionSuccess, parseActionInput } from "./action-utils";

const PublishEventWebsiteActionSchema = z.object({
  confirmWarnings: z.boolean().optional(),
  eventId: z.uuid(),
});

const UnpublishEventWebsiteActionSchema = z.object({
  eventId: z.uuid(),
});

export async function publishEventWebsiteAction(input: unknown) {
  try {
    const profile = await requireTenantMember();
    const payload = parseActionInput(PublishEventWebsiteActionSchema, input);
    const event = await requireOwnedEvent(payload.eventId, profile.client_id ?? "");
    const result = await publishEventWebsite({
      actorUserId: profile.id,
      clientId: profile.client_id ?? "",
      confirmWarnings: payload.confirmWarnings,
      eventId: event.id,
    });

    revalidatePath("/dashboard/website-access");
    if (event.event_slug) {
      revalidatePath(`/r/${event.event_slug}`);
    }

    return actionSuccess(result);
  } catch (error) {
    return actionFailure(error);
  }
}

export async function unpublishEventWebsiteAction(input: unknown) {
  try {
    const profile = await requireTenantMember();
    const payload = parseActionInput(UnpublishEventWebsiteActionSchema, input);
    const event = await requireOwnedEvent(payload.eventId, profile.client_id ?? "");
    const result = await unpublishEventWebsite({
      actorUserId: profile.id,
      clientId: profile.client_id ?? "",
      eventId: event.id,
    });

    revalidatePath("/dashboard/website-access");
    if (event.event_slug) {
      revalidatePath(`/r/${event.event_slug}`);
    }

    return actionSuccess(result);
  } catch (error) {
    return actionFailure(error);
  }
}

async function requireOwnedEvent(eventId: string, clientId: string) {
  const supabase = await createServerSupabaseClient();
  const { data: event, error } = await supabase
    .from("rsvp_events")
    .select("id, client_id, event_slug")
    .eq("id", eventId)
    .eq("client_id", clientId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!clientId || !event || event.client_id !== clientId) {
    throw new PermissionError("The requested event does not belong to the current tenant.");
  }

  return event;
}

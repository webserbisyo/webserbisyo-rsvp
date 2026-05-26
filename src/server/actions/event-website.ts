"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import {
  isDashboardBuilderEventTypeEnabled,
  unsupportedBuilderMessage,
} from "@/config/event-type-availability";
import { normalizeEventWebsiteContentForSave } from "@/lib/event-website/hydration";
import { PermissionError, requireTenantMember } from "@/lib/permissions";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { saveEventWebsiteDraft } from "@/server/services/save-event-website-draft";
import { ServiceError } from "@/server/services/service-error";
import { actionFailure, actionSuccess, parseActionInput } from "./action-utils";

const SaveEventWebsiteActionSchema = z.object({
  content: z.unknown(),
  eventId: z.uuid(),
});

export async function saveEventWebsiteAction(input: unknown) {
  try {
    const profile = await requireTenantMember();
    const payload = parseActionInput(SaveEventWebsiteActionSchema, input);
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
    const contentToSave = {
      ...normalizedContent,
      meta: {
        ...normalizedContent.meta,
        savedAt: new Date().toISOString(),
        savedBy: profile.id,
      },
    };
    const content = await saveEventWebsiteDraft({
      actorUserId: profile.id,
      clientId: profile.client_id,
      content: contentToSave,
      eventId: event.id,
    });

    revalidatePath("/dashboard/event");
    revalidatePath("/dashboard/website-access");

    return actionSuccess({
      content: contentToSave,
      contentId: content.id,
      eventId: content.event_id,
    });
  } catch (error) {
    return actionFailure(error);
  }
}

"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/permissions";
import { EventContentSchema } from "@/lib/validations/event.schema";
import { saveEventContent } from "@/server/services/save-event-content";
import { actionFailure, actionSuccess, parseActionInput } from "./action-utils";

const SaveEventContentActionSchema = EventContentSchema.extend({
  eventId: z.uuid(),
});

export async function saveEventContentAction(input: unknown) {
  try {
    const admin = await requireAdmin();
    const payload = parseActionInput(SaveEventContentActionSchema, input);
    const content = await saveEventContent(payload, admin.id);

    revalidatePath("/admin/clients");
    revalidatePath("/dashboard/page-content");

    return actionSuccess({
      contentId: content.id,
      eventId: content.event_id,
    });
  } catch (error) {
    return actionFailure(error);
  }
}

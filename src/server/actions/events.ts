"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/permissions";
import { EventSchema } from "@/lib/validations/event.schema";
import { saveEvent } from "@/server/services/save-event";
import { actionFailure, actionSuccess, parseActionInput } from "./action-utils";

const SaveEventActionSchema = EventSchema.extend({
  eventId: z.uuid(),
});

export async function saveEventAction(input: unknown) {
  try {
    const admin = await requireAdmin();
    const payload = parseActionInput(SaveEventActionSchema, input);
    const event = await saveEvent(payload, admin.id);

    revalidatePath("/admin/clients");
    revalidatePath("/dashboard/event");

    return actionSuccess({
      eventId: event.id,
      status: event.status,
    });
  } catch (error) {
    return actionFailure(error);
  }
}

"use server";

import { revalidatePath } from "next/cache";
import { PermissionError, requireTenantMember } from "@/lib/permissions";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { UpdateDashboardGuestLimitSchema } from "@/lib/validations/dashboard-home.schema";
import { updateDashboardGuestLimit } from "@/server/services/update-dashboard-guest-limit";
import { actionFailure, actionSuccess, parseActionInput } from "./action-utils";

export async function updateDashboardGuestLimitAction(input: unknown) {
  try {
    const profile = await requireTenantMember();
    const payload = parseActionInput(UpdateDashboardGuestLimitSchema, input);
    const event = await requireOwnedEvent(payload.eventId, profile.client_id ?? "");
    const updatedEvent = await updateDashboardGuestLimit({
      actorUserId: profile.id,
      clientId: profile.client_id ?? "",
      eventId: event.id,
      guestLimit: payload.guestLimit,
    });

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/event");

    return actionSuccess({
      eventId: updatedEvent.id,
      guestLimit: updatedEvent.max_guest_count,
    });
  } catch (error) {
    return actionFailure(error);
  }
}

async function requireOwnedEvent(eventId: string, clientId: string) {
  const supabase = await createServerSupabaseClient();
  const { data: event, error } = await supabase
    .from("rsvp_events")
    .select("id, client_id")
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

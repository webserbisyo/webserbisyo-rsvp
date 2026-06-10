import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import type { UpdateDashboardGuestLimitInput } from "@/lib/validations/dashboard-home.schema";
import { UpdateDashboardGuestLimitSchema } from "@/lib/validations/dashboard-home.schema";
import { assertServiceData, assertServiceSuccess, ServiceError } from "./service-error";
import { writeAuditLog } from "./write-audit-log";

export async function updateDashboardGuestLimit(
  input: UpdateDashboardGuestLimitInput & {
    actorUserId: string;
    clientId: string;
  },
) {
  const payload = UpdateDashboardGuestLimitSchema.parse(input);
  const supabase = createAdminClient();

  // Enforce headcount floor
  const { data: responses, error: countError } = await supabase
    .from("rsvp_responses")
    .select("party_size")
    .eq("event_id", payload.eventId)
    .eq("client_id", input.clientId)
    .eq("attendance_status", "attending")
    .eq("review_status", "approved")
    .is("archived_at", null);

  assertServiceSuccess(countError, "Failed to verify current attending guest headcount.");

  const currentHeadcount = (responses ?? []).reduce((sum, row) => sum + (row.party_size ?? 0), 0);

  if (payload.guestLimit < currentHeadcount) {
    throw new ServiceError(
      `Guest limit cannot be lower than the currently active attending headcount (${currentHeadcount}). Please reject or remove responses first.`,
    );
  }

  const { data: event, error } = await supabase
    .from("rsvp_events")
    .update({
      max_guest_count: payload.guestLimit,
    })
    .eq("id", payload.eventId)
    .eq("client_id", input.clientId)
    .select("id, client_id, max_guest_count")
    .single();

  assertServiceSuccess(error, "Failed to update guest limit.");
  assertServiceData(event, "Guest limit update returned no row.");

  await writeAuditLog({
    action: "dashboard_guest_limit_updated",
    actorUserId: input.actorUserId,
    clientId: event.client_id,
    entityId: event.id,
    entityType: "rsvp_events",
    eventId: event.id,
    metadata: {
      max_guest_count: event.max_guest_count,
    },
  });

  return event;
}

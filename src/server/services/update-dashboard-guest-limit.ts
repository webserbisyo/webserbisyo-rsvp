import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import type { UpdateDashboardGuestLimitInput } from "@/lib/validations/dashboard-home.schema";
import { UpdateDashboardGuestLimitSchema } from "@/lib/validations/dashboard-home.schema";
import { assertServiceData, assertServiceSuccess } from "./service-error";
import { writeAuditLog } from "./write-audit-log";

export async function updateDashboardGuestLimit(
  input: UpdateDashboardGuestLimitInput & {
    actorUserId: string;
    clientId: string;
  },
) {
  const payload = UpdateDashboardGuestLimitSchema.parse(input);
  const supabase = createAdminClient();
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

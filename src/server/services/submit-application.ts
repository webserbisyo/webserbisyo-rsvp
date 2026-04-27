import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import type { ApplicationInput } from "@/lib/validations/application.schema";
import { ApplicationSchema } from "@/lib/validations/application.schema";
import { assertServiceData, assertServiceSuccess } from "./service-error";
import { writeAuditLog } from "./write-audit-log";

export async function submitApplication(input: ApplicationInput) {
  const payload = ApplicationSchema.parse(input);
  const supabase = createAdminClient();

  const { data: application, error } = await supabase
    .from("rsvp_applications")
    .insert({
      email: payload.email,
      estimated_guest_count: payload.estimatedGuestCount ?? null,
      event_date: payload.eventDate ?? null,
      event_location: payload.eventLocation ?? null,
      event_type: payload.eventType,
      full_name: payload.fullName,
      message: payload.message ?? null,
      phone: payload.phone ?? null,
      preferred_plan: payload.preferredPlan,
      status: "submitted",
    })
    .select("*")
    .single();

  assertServiceSuccess(error, "Failed to submit RSVP application.");
  assertServiceData(application, "RSVP application insert returned no row.");

  await writeAuditLog({
    action: "application_submitted",
    entityId: application.id,
    entityType: "rsvp_applications",
    metadata: {
      event_type: application.event_type,
      preferred_plan: application.preferred_plan,
    },
  });

  return application;
}

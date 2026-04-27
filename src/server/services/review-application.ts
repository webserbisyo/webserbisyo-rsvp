import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import type { ReviewApplicationInput } from "@/lib/validations/approval.schema";
import { ReviewApplicationSchema } from "@/lib/validations/approval.schema";
import { assertServiceData, assertServiceSuccess } from "./service-error";
import { writeAuditLog } from "./write-audit-log";

export async function reviewApplication(input: ReviewApplicationInput, actorUserId: string) {
  const payload = ReviewApplicationSchema.parse(input);
  const now = new Date().toISOString();
  const supabase = createAdminClient();

  const { data: application, error } = await supabase
    .from("rsvp_applications")
    .update({
      rejected_at: payload.status === "rejected" ? now : null,
      review_notes: payload.reviewNotes ?? null,
      reviewed_at: now,
      status: payload.status,
    })
    .eq("id", payload.applicationId)
    .select("*")
    .single();

  assertServiceSuccess(error, "Failed to review RSVP application.");
  assertServiceData(application, "RSVP application review returned no row.");

  await writeAuditLog({
    action: payload.status === "rejected" ? "application_rejected" : "application_reviewing",
    actorUserId,
    entityId: application.id,
    entityType: "rsvp_applications",
    metadata: {
      status: application.status,
    },
  });

  return application;
}

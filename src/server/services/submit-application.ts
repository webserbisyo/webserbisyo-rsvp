import "server-only";

import { ZodError, ZodIssueCode } from "zod";

import { generateApplicationReferenceCode } from "@/lib/apply/reference";
import { assertApplicationEventTypeEnabled } from "@/config/event-type-availability";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Tables, TablesInsert } from "@/lib/supabase/types";
import type { ApplicationInput } from "@/lib/validations/application.schema";
import { ApplicationSchema } from "@/lib/validations/application.schema";
import { sendMetaCapiLead } from "./send-meta-capi-lead";
import { assertServiceData, assertServiceSuccess } from "./service-error";
import { writeAuditLog } from "./write-audit-log";

type SubmitApplicationContext = {
  clientIpAddress?: string | null;
  clientUserAgent?: string | null;
  eventSourceUrl?: string | null;
};

type SafeSupabaseError = {
  code?: string;
  message?: string;
};

function isReferenceCodeConflict(error: unknown): error is SafeSupabaseError {
  if (!error || typeof error !== "object") {
    return false;
  }

  const candidate = error as SafeSupabaseError;

  return (
    candidate.code === "23505" &&
    typeof candidate.message === "string" &&
    candidate.message.includes("rsvp_applications_reference_code_key")
  );
}

export async function submitApplication(
  input: ApplicationInput,
  context?: SubmitApplicationContext,
) {
  const payload = ApplicationSchema.parse(input);
  assertApplicationEventTypeEnabled(payload.eventType);

  const normalizedEmail = payload.email.trim().toLowerCase();
  const supabase = createAdminClient();

  const [
    { count: clientCount, error: clientCountError },
    { count: appCount, error: appCountError },
  ] = await Promise.all([
    supabase
      .from("clients")
      .select("*", { count: "exact", head: true })
      .eq("contact_email", normalizedEmail),
    supabase
      .from("rsvp_applications")
      .select("*", { count: "exact", head: true })
      .eq("email", normalizedEmail)
      .in("status", ["submitted", "reviewing"]),
  ]);

  assertServiceSuccess(clientCountError, "Failed to verify email availability.");
  assertServiceSuccess(appCountError, "Failed to verify email availability.");

  if ((clientCount && clientCount > 0) || (appCount && appCount > 0)) {
    throw new ZodError([
      {
        code: ZodIssueCode.custom,
        path: ["email"],
        message:
          "This email is already linked to an application or account. Please use a different email, log in, or message WebSerbisyo if this is yours.",
      },
    ]);
  }

  let application: Tables<"rsvp_applications"> | null = null;

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const result = await insertApplication({
      email: payload.email,
      estimated_guest_count: payload.estimatedGuestCount ?? null,
      event_date: payload.eventDate ?? null,
      event_location: payload.eventLocation ?? null,
      event_type: payload.eventType,
      fb_fbc: payload.fbFbc ?? null,
      fb_fbp: payload.fbFbp ?? null,
      full_name: payload.fullName,
      message: payload.message ?? null,
      phone: payload.phone ?? null,
      preferred_manual_payment_option: payload.preferredManualPaymentOption ?? null,
      preferred_plan: payload.preferredPlan,
      reference_code: generateApplicationReferenceCode(),
      status: "submitted",
    });

    if (!result.error) {
      application = result.data;
      break;
    }

    if (!isReferenceCodeConflict(result.error)) {
      assertServiceSuccess(result.error, "Failed to submit RSVP application.");
    }
  }

  assertServiceData(application, "RSVP application insert returned no row.");

  await writeAuditLog({
    action: "application_submitted",
    entityId: application.id,
    entityType: "rsvp_applications",
    metadata: {
      event_type: application.event_type,
      preferred_manual_payment_option: application.preferred_manual_payment_option,
      preferred_plan: application.preferred_plan,
      reference_code: application.reference_code,
    },
  });

  await sendMetaCapiLead({
    applicationId: application.id,
    clientIpAddress: context?.clientIpAddress ?? null,
    clientUserAgent: context?.clientUserAgent ?? null,
    email: application.email,
    eventSourceUrl: context?.eventSourceUrl ?? null,
    fbc: application.fb_fbc,
    fbp: application.fb_fbp,
    fullName: application.full_name,
    phone: application.phone,
    preferredPlan: application.preferred_plan,
    referenceCode: application.reference_code,
  });

  return application;
}

async function insertApplication(payload: ApplicationInsertPayload) {
  const supabase = createAdminClient();

  return supabase.from("rsvp_applications").insert(payload).select("*").single();
}

type ApplicationInsertPayload = TablesInsert<"rsvp_applications">;

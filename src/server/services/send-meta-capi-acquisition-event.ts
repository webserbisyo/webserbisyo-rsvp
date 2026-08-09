import "server-only";

import { sendMetaCapiEvent, type MetaCapiCustomData } from "@/lib/meta/capi";
import { getMetaCapiRuntimeConfig } from "@/lib/meta/capi-config";
import {
  getPlanValue,
  isMetaAcquisitionEventEnabled,
  type MetaAcquisitionEventInput,
} from "@/lib/meta/acquisition-events";
import { resolveMetaPixelForContext } from "@/lib/meta/pixel-resolution";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Json } from "@/lib/supabase/types";
import { writeAuditLog } from "./write-audit-log";

export type SendMetaCapiAcquisitionEventInput = MetaAcquisitionEventInput & {
  clientIpAddress: string | null;
  clientUserAgent: string | null;
  eventSourceUrl: string;
};

export async function sendMetaCapiAcquisitionEvent(input: SendMetaCapiAcquisitionEventInput) {
  const config = getMetaCapiRuntimeConfig();

  if (!isMetaAcquisitionEventEnabled(input.eventName, config)) {
    return recordResult(input, { eventId: input.eventId, reason: "disabled", status: "skipped" });
  }

  const pixelId = await getApplicationPixelId();
  const identity = "referenceCode" in input ? await getApplicationIdentity(input.referenceCode) : null;
  const result = await sendMetaCapiEvent({
    actionSource: "website",
    amount: "plan" in input ? getPlanValue(input.plan) : 0,
    clientIpAddress: input.clientIpAddress,
    clientUserAgent: input.clientUserAgent,
    currency: "PHP",
    customData: buildCustomData(input),
    email: identity?.email,
    eventId: input.eventId,
    eventName: input.eventName,
    externalId: "referenceCode" in input ? input.referenceCode : undefined,
    fbc: input.fbc,
    fbp: input.fbp,
    fullName: identity?.fullName,
    pixelId,
    phone: identity?.phone,
    sourceUrl: input.eventSourceUrl,
  });

  return recordResult(input, result);
}

async function getApplicationPixelId() {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("meta_pixels")
    .select("id, pixel_id, tracking_scope, updated_at")
    .eq("is_active", true)
    .in("tracking_scope", ["application", "global_public"]);

  if (error) {
    return process.env.META_PIXEL_ID?.trim() || null;
  }

  return (
    resolveMetaPixelForContext(
      (data ?? []).map((row) => ({
        id: row.id,
        pixelId: row.pixel_id,
        trackingScope: row.tracking_scope,
        updatedAt: row.updated_at,
      })),
      "application_funnel",
    )?.pixelId ??
    process.env.META_PIXEL_ID?.trim() ??
    null
  );
}

function buildCustomData(input: MetaAcquisitionEventInput): MetaCapiCustomData {
  if (input.eventName === "CompleteRegistration") {
    return { content_category: "webserbisyo_application", content_name: "Application completed", source_route: input.sourcePath };
  }
  if (input.eventName === "ViewContent") {
    return { content_category: "webserbisyo_marketing", content_name: input.sourcePath === "/" ? "landing" : "pricing", source_route: input.sourcePath };
  }
  if (input.eventName === "PageView") {
    return { content_category: "webserbisyo_marketing", content_name: "page_view", source_route: input.sourcePath };
  }
  if (input.eventName === "StartApplicationClick") {
    return {
      content_category: "webserbisyo_application",
      content_name: "Start application",
      destination: input.destination,
      source: input.source,
      source_route: input.sourcePath,
    };
  }

  if (input.eventName === "Contact") {
    return {
      content_category: "webserbisyo_contact",
      content_name: "Messenger contact",
      source: input.source,
      source_route: input.sourcePath,
    };
  }

  return {
    content_category: "webserbisyo_application",
    content_name: `${input.plan.toUpperCase()} Plan Application`,
    currency: "PHP",
    plan: input.plan,
    source: "source" in input ? input.source : undefined,
    source_route: input.sourcePath,
    value: getPlanValue(input.plan),
  };
}

async function getApplicationIdentity(referenceCode: string) {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("rsvp_applications")
    .select("email, full_name, phone")
    .eq("reference_code", referenceCode)
    .maybeSingle();

  return data ? { email: data.email, fullName: data.full_name, phone: data.phone } : null;
}

async function recordResult(
  input: SendMetaCapiAcquisitionEventInput,
  result: Awaited<ReturnType<typeof sendMetaCapiEvent>>,
) {
  try {
    await writeAuditLog({
      action: `meta_capi_${input.eventName.toLowerCase()}_${result.status}`,
      entityType: "meta_acquisition_event",
      eventId: null,
      metadata: {
        event_id: input.eventId,
        event_name: input.eventName,
        http_status: result.httpStatus ?? null,
        provider: "meta",
        reason: result.reason ?? null,
        status: result.status,
      } satisfies Json,
    });
  } catch {
    // Acquisition telemetry must never fail a visitor action.
  }

  return result;
}

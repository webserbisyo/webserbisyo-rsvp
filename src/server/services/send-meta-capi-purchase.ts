import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import type { Json } from "@/lib/supabase/types";
import { getMetaCapiRuntimeConfig } from "@/lib/meta/capi-config";
import { sendMetaCapiEvent } from "@/lib/meta";
import { resolveMetaPixelForContext } from "@/lib/meta/pixel-resolution";
import { writeAuditLog } from "./write-audit-log";

export type SendMetaCapiPurchaseInput = {
  actorUserId: string;
  amount: number;
  clientId: string;
  clientIpAddress?: string | null;
  clientUserAgent?: string | null;
  customerEmail?: string | null;
  customerFullName?: string | null;
  customerPhone?: string | null;
  eventId: string;
  externalId?: string | null;
  fbc?: string | null;
  fbp?: string | null;
  paymentId: string;
  sourceUrl?: string | null;
};

export async function sendMetaCapiPurchase(input: SendMetaCapiPurchaseInput) {
  const config = getMetaCapiRuntimeConfig();
  const pixelId = await getMetaCapiPixelId();
  const eventId = `Purchase:${input.paymentId}`;

  if (!config.purchaseEnabled) {
    const result = {
      eventId,
      reason: "disabled",
      status: "skipped" as const,
    };

    await safeWriteAuditLog({
      action: `meta_capi_purchase_${result.status}`,
      actorUserId: input.actorUserId,
      clientId: input.clientId,
      entityId: input.paymentId,
      entityType: "payments",
      eventId: input.eventId,
      metadata: toAuditMetadata(result),
    });

    return result;
  }

  const result = await sendMetaCapiEvent({
    amount: input.amount,
    clientIpAddress: input.clientIpAddress,
    clientUserAgent: input.clientUserAgent,
    currency: "PHP",
    email: input.customerEmail,
    eventId,
    eventName: "Purchase",
    externalId: input.externalId,
    fbc: input.fbc,
    fbp: input.fbp,
    fullName: input.customerFullName,
    phone: input.customerPhone,
    pixelId,
    sourceUrl: input.sourceUrl,
  });

  await safeWriteAuditLog({
    action: `meta_capi_purchase_${result.status}`,
    actorUserId: input.actorUserId,
    clientId: input.clientId,
    entityId: input.paymentId,
    entityType: "payments",
    eventId: input.eventId,
    metadata: toAuditMetadata(result),
  });

  return result;
}

async function getMetaCapiPixelId() {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("meta_pixels")
    .select("id, pixel_id, tracking_scope, updated_at")
    .eq("is_active", true)
    .in("tracking_scope", ["global_public", "application"]);

  if (error) {
    return process.env.META_PIXEL_ID ?? null;
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
    process.env.META_PIXEL_ID ??
    null
  );
}

async function safeWriteAuditLog(input: Parameters<typeof writeAuditLog>[0]) {
  try {
    await writeAuditLog(input);
  } catch {
    // CAPI telemetry must never roll back or fail payment confirmation.
  }
}

function toAuditMetadata(value: unknown): Json {
  return JSON.parse(JSON.stringify(value)) as Json;
}

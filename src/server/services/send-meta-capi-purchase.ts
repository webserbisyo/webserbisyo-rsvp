import "server-only";

import { getServerCanonicalMetaAcquisitionUrl } from "@/lib/meta/acquisition-origin";
import { getMetaCapiRuntimeConfig } from "@/lib/meta/capi-config";
import { getPurchaseEventTime } from "@/lib/meta/purchase-event-time";
import { sendMetaCapiEvent } from "@/lib/meta";
import { resolveMetaPixelForContext } from "@/lib/meta/pixel-resolution";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Json } from "@/lib/supabase/types";
import {
  claimMetaCapiPurchaseDelivery,
  completeMetaCapiPurchaseDelivery,
} from "./meta-capi-delivery";
import { writeAuditLog } from "./write-audit-log";

export type SendMetaCapiPurchaseInput = {
  actorUserId: string;
  amount: number;
  clientIpAddress?: string | null;
  clientUserAgent?: string | null;
  clientId: string;
  currency: string;
  customerEmail?: string | null;
  customerFullName?: string | null;
  customerPhone?: string | null;
  eventId: string;
  externalId?: string | null;
  fbc?: string | null;
  fbp?: string | null;
  paymentId: string;
  paidAt?: string | null;
};

export async function sendMetaCapiPurchase(input: SendMetaCapiPurchaseInput) {
  const config = getMetaCapiRuntimeConfig();
  const eventId = `Purchase:${input.paymentId}`;

  if (!config.purchaseEnabled) {
    return recordPurchaseResult(input, {
      eventId,
      reason: "disabled",
      status: "skipped" as const,
    });
  }

  const claim = await claimMetaCapiPurchaseDelivery({
    eventId,
    paymentId: input.paymentId,
  });

  if (claim.state !== "claimed") {
    return recordPurchaseResult(
      input,
      {
        eventId,
        reason: claim.state,
        status: "skipped" as const,
      },
      claim,
    );
  }

  await safeWriteAuditLog({
    action: "meta_capi_purchase_claimed",
    actorUserId: input.actorUserId,
    clientId: input.clientId,
    entityId: input.paymentId,
    entityType: "payments",
    eventId: input.eventId,
    metadata: {
      delivery_attempt: claim.attempts,
      delivery_state: "claimed",
      event_id: eventId,
      event_name: "Purchase",
      provider: "meta",
    },
  });

  const result = await sendMetaCapiEvent({
    actionSource: "website",
    amount: input.amount,
    clientIpAddress: input.clientIpAddress,
    clientUserAgent: input.clientUserAgent,
    currency: input.currency,
    email: input.customerEmail,
    eventId,
    eventName: "Purchase",
    eventTime: getPurchaseEventTime(input.paidAt),
    externalId: input.externalId,
    fbc: input.fbc,
    fbp: input.fbp,
    fullName: input.customerFullName,
    phone: input.customerPhone,
    pixelId: await getMetaCapiPixelId(),
    sourceUrl: getServerCanonicalMetaAcquisitionUrl("/apply/success"),
  });

  try {
    await completeMetaCapiPurchaseDelivery({
      claimToken: claim.claimToken,
      deliveryId: claim.deliveryId,
      failureCode: result.failureCode ?? null,
      outcome: result.status === "sent" ? "sent" : "failed",
    });
  } catch {
    // A later stale-claim retry retains the deterministic Meta event ID.
  }

  return recordPurchaseResult(input, result, claim);
}

async function recordPurchaseResult(
  input: SendMetaCapiPurchaseInput,
  result: Awaited<ReturnType<typeof sendMetaCapiEvent>>,
  claim?:
    | Exclude<Awaited<ReturnType<typeof claimMetaCapiPurchaseDelivery>>, { state: "claimed" }>
    | {
        attempts: number;
        deliveryId: string;
        state: "claimed";
      },
) {
  await safeWriteAuditLog({
    action: `meta_capi_purchase_${result.status}`,
    actorUserId: input.actorUserId,
    clientId: input.clientId,
    entityId: input.paymentId,
    entityType: "payments",
    eventId: input.eventId,
    metadata: {
      delivery_attempt: claim?.attempts ?? null,
      delivery_state:
        claim?.state === "claimed"
          ? result.status === "sent"
            ? "sent"
            : "failed"
          : (claim?.state ?? "disabled"),
      event_id: result.eventId,
      event_name: "Purchase",
      payment_id: input.paymentId,
      provider: "meta",
      result: toAuditMetadata(result),
    },
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

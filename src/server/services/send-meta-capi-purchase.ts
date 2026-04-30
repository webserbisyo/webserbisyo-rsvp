import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import type { Json } from "@/lib/supabase/types";
import { sendMetaCapiEvent } from "@/lib/meta";
import { writeAuditLog } from "./write-audit-log";

export type SendMetaCapiPurchaseInput = {
  actorUserId: string;
  amount: number;
  clientId: string;
  customerEmail?: string | null;
  customerPhone?: string | null;
  eventId: string;
  paymentId: string;
};

export async function sendMetaCapiPurchase(input: SendMetaCapiPurchaseInput) {
  const pixelId = await getMetaCapiPixelId();
  const eventId = `Purchase:${input.paymentId}`;
  const result = await sendMetaCapiEvent({
    amount: input.amount,
    currency: "PHP",
    email: input.customerEmail,
    eventId,
    eventName: "Purchase",
    phone: input.customerPhone,
    pixelId,
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
    .select("pixel_id")
    .eq("is_active", true)
    .in("tracking_scope", ["global_public", "application", "rsvp_submit"])
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    return process.env.META_PIXEL_ID ?? null;
  }

  return data?.pixel_id ?? process.env.META_PIXEL_ID ?? null;
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

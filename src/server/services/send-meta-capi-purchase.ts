import "server-only";

import { sendMetaCapiEvent } from "@/lib/meta";
import { writeAuditLog } from "./write-audit-log";

export type SendMetaCapiPurchaseInput = {
  actorUserId: string;
  amount: number;
  clientId: string;
  eventId: string;
  paymentId: string;
};

export async function sendMetaCapiPurchase(input: SendMetaCapiPurchaseInput) {
  const result = await sendMetaCapiEvent({
    amount: input.amount,
    currency: "PHP",
    eventId: input.eventId,
    pixelId: process.env.META_PIXEL_ID ?? null,
    testEventCode: process.env.META_TEST_EVENT_CODE ?? null,
  });

  await writeAuditLog({
    action: "meta_capi_purchase_skipped",
    actorUserId: input.actorUserId,
    clientId: input.clientId,
    entityId: input.paymentId,
    entityType: "payments",
    eventId: input.eventId,
    metadata: result,
  });

  return result;
}

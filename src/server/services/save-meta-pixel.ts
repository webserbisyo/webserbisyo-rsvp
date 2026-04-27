import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import type { MetaPixelInput } from "@/lib/validations/meta-pixel.schema";
import { MetaPixelSchema } from "@/lib/validations/meta-pixel.schema";
import { assertServiceData, assertServiceSuccess } from "./service-error";
import { writeAuditLog } from "./write-audit-log";

export type SaveMetaPixelInput = MetaPixelInput & {
  pixelConfigId?: string;
};

export async function saveMetaPixel(input: SaveMetaPixelInput, actorUserId: string) {
  const { pixelConfigId, ...pixelInput } = input;
  const payload = MetaPixelSchema.parse(pixelInput);
  const supabase = createAdminClient();
  const row = {
    access_token_encrypted: payload.accessTokenEncrypted ?? null,
    client_id: payload.clientId ?? null,
    event_id: payload.eventId ?? null,
    is_active: payload.isActive ?? true,
    pixel_id: payload.pixelId,
    tracking_scope: payload.trackingScope,
  };

  const query = pixelConfigId
    ? supabase.from("meta_pixels").update(row).eq("id", pixelConfigId)
    : supabase.from("meta_pixels").insert(row);

  const { data, error } = await query
    .select("id, client_id, event_id, pixel_id, is_active, tracking_scope, created_at, updated_at")
    .single();

  assertServiceSuccess(error, "Failed to save Meta Pixel configuration.");
  assertServiceData(data, "Meta Pixel save returned no row.");

  await writeAuditLog({
    action: "meta_pixel_saved",
    actorUserId,
    clientId: data.client_id,
    entityId: data.id,
    entityType: "meta_pixels",
    eventId: data.event_id,
    metadata: {
      tracking_scope: data.tracking_scope,
    },
  });

  return data;
}

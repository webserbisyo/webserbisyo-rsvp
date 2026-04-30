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
    event_id: payload.eventId ?? null,
    is_active: payload.isActive ?? true,
    name: payload.name,
    notes: payload.notes ?? null,
    pixel_id: payload.pixelId,
    tracking_scope: payload.trackingScope,
  };

  const query = pixelConfigId
    ? supabase.from("meta_pixels").update(row).eq("id", pixelConfigId)
    : supabase.from("meta_pixels").insert(row);

  const { data, error } = await query
    .select(
      "id, client_id, event_id, name, notes, pixel_id, is_active, tracking_scope, created_at, updated_at",
    )
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

export async function toggleMetaPixel(
  pixelConfigId: string,
  isActive: boolean,
  actorUserId: string,
) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("meta_pixels")
    .update({ is_active: isActive })
    .eq("id", pixelConfigId)
    .select("id, client_id, event_id, is_active, tracking_scope")
    .single();

  assertServiceSuccess(error, "Failed to update Meta Pixel status.");
  assertServiceData(data, "Meta Pixel status update returned no row.");

  await writeAuditLog({
    action: isActive ? "meta_pixel_enabled" : "meta_pixel_disabled",
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

export async function deleteMetaPixel(pixelConfigId: string, actorUserId: string) {
  const supabase = createAdminClient();
  const { data: pixel, error: loadError } = await supabase
    .from("meta_pixels")
    .select("id, client_id, event_id, name, tracking_scope")
    .eq("id", pixelConfigId)
    .single();

  assertServiceSuccess(loadError, "Failed to load Meta Pixel configuration.");
  assertServiceData(pixel, "Meta Pixel configuration does not exist.");

  const { error } = await supabase.from("meta_pixels").delete().eq("id", pixelConfigId);

  assertServiceSuccess(error, "Failed to delete Meta Pixel configuration.");

  await writeAuditLog({
    action: "meta_pixel_deleted",
    actorUserId,
    clientId: pixel.client_id,
    entityId: pixel.id,
    entityType: "meta_pixels",
    eventId: pixel.event_id,
    metadata: {
      name: pixel.name,
      tracking_scope: pixel.tracking_scope,
    },
  });

  return pixel;
}

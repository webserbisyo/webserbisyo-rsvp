"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/permissions";
import { MetaPixelSchema } from "@/lib/validations/meta-pixel.schema";
import { getAdminPixels } from "@/server/queries/admin-pixels";
import { deleteMetaPixel, saveMetaPixel, toggleMetaPixel } from "@/server/services/save-meta-pixel";
import { actionFailure, actionSuccess, parseActionInput } from "./action-utils";

const SaveMetaPixelActionSchema = MetaPixelSchema.extend({
  pixelConfigId: z.uuid().optional(),
});

const ToggleMetaPixelActionSchema = z.object({
  isActive: z.boolean(),
  pixelConfigId: z.uuid(),
});

const DeleteMetaPixelActionSchema = z.object({
  pixelConfigId: z.uuid(),
});

export async function fetchAdminPixelsAction() {
  try {
    await requireAdmin();
    const result = await getAdminPixels();

    return actionSuccess(result);
  } catch (error) {
    return actionFailure(error);
  }
}

export async function saveMetaPixelAction(input: unknown) {
  try {
    const admin = await requireAdmin();
    const payload = parseActionInput(SaveMetaPixelActionSchema, input);
    const pixel = await saveMetaPixel(payload, admin.id);

    revalidatePath("/admin/meta-pixels");

    return actionSuccess({
      pixelConfigId: pixel.id,
      trackingScope: pixel.tracking_scope,
    });
  } catch (error) {
    return actionFailure(error);
  }
}

export async function toggleMetaPixelAction(input: unknown) {
  try {
    const admin = await requireAdmin();
    const payload = parseActionInput(ToggleMetaPixelActionSchema, input);
    const pixel = await toggleMetaPixel(payload.pixelConfigId, payload.isActive, admin.id);

    revalidatePath("/admin/meta-pixels");

    return actionSuccess({
      isActive: pixel.is_active,
      pixelConfigId: pixel.id,
    });
  } catch (error) {
    return actionFailure(error);
  }
}

export async function deleteMetaPixelAction(input: unknown) {
  try {
    const admin = await requireAdmin();
    const payload = parseActionInput(DeleteMetaPixelActionSchema, input);
    const pixel = await deleteMetaPixel(payload.pixelConfigId, admin.id);

    revalidatePath("/admin/meta-pixels");

    return actionSuccess({
      pixelConfigId: pixel.id,
    });
  } catch (error) {
    return actionFailure(error);
  }
}

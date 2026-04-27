"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/permissions";
import { MetaPixelSchema } from "@/lib/validations/meta-pixel.schema";
import { saveMetaPixel } from "@/server/services/save-meta-pixel";
import { actionFailure, actionSuccess, parseActionInput } from "./action-utils";

const SaveMetaPixelActionSchema = MetaPixelSchema.extend({
  pixelConfigId: z.uuid().optional(),
});

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

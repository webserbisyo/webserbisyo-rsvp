import "server-only";

import path from "node:path";
import type { EventWebsiteImageAsset } from "@/lib/event-website/types";
import {
  EVENT_WEBSITE_GIFT_MEDIA_ALLOWED_TYPES,
  EVENT_WEBSITE_GIFT_MEDIA_BUCKET,
  EVENT_WEBSITE_GIFT_MEDIA_MAX_SIZE,
  EVENT_WEBSITE_GIFT_MEDIA_MAX_SIZE_LABEL,
} from "@/lib/event-website/gift-media";
import { createAdminClient } from "@/lib/supabase/admin";
import { ServiceError, assertServiceData, assertServiceSuccess } from "./service-error";

const ALLOWED_GIFT_MEDIA_TYPES = new Set(EVENT_WEBSITE_GIFT_MEDIA_ALLOWED_TYPES);

export async function uploadEventWebsiteGiftImage(input: {
  clientId: string;
  file: File;
  optionId: string;
  title?: string;
}): Promise<EventWebsiteImageAsset> {
  const { clientId, file, optionId, title } = input;

  if (
    !ALLOWED_GIFT_MEDIA_TYPES.has(
      file.type as (typeof EVENT_WEBSITE_GIFT_MEDIA_ALLOWED_TYPES)[number],
    )
  ) {
    throw new ServiceError("Upload a PNG, JPG, or WEBP image.");
  }

  if (file.size > EVENT_WEBSITE_GIFT_MEDIA_MAX_SIZE) {
    throw new ServiceError(`Image must be ${EVENT_WEBSITE_GIFT_MEDIA_MAX_SIZE_LABEL} or smaller.`);
  }

  const extension = path.extname(file.name).toLowerCase() || ".png";
  const safeOptionId = optionId.replace(/[^a-z0-9_-]/gi, "-").toLowerCase();
  const objectPath = `event-website-gifts/${clientId}/${safeOptionId}/${Date.now()}-${crypto.randomUUID()}${extension}`;
  const supabase = createAdminClient();
  const { data, error } = await supabase.storage
    .from(EVENT_WEBSITE_GIFT_MEDIA_BUCKET)
    .upload(objectPath, file, {
      cacheControl: "3600",
      contentType: file.type,
      upsert: false,
    });

  assertServiceSuccess(error, "Failed to upload gift image.");
  assertServiceData(data, "Gift image upload returned no file path.");

  const publicUrl = supabase.storage.from(EVENT_WEBSITE_GIFT_MEDIA_BUCKET).getPublicUrl(data.path)
    .data.publicUrl;

  return {
    alt: title?.trim() ? `${title.trim()} gift image` : undefined,
    path: data.path,
    url: publicUrl,
  };
}

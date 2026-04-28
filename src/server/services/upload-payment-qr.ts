import "server-only";

import path from "node:path";
import { createAdminClient } from "@/lib/supabase/admin";
import { ServiceError, assertServiceData, assertServiceSuccess } from "./service-error";

const PAYMENT_QR_BUCKET = "payment-qr-images";
const MAX_PAYMENT_QR_SIZE = 5 * 1024 * 1024;
const ALLOWED_PAYMENT_QR_TYPES = new Set(["image/jpeg", "image/jpg", "image/png", "image/webp"]);

export async function uploadPaymentQr(file: File, provider: "gcash" | "maya") {
  if (!ALLOWED_PAYMENT_QR_TYPES.has(file.type)) {
    throw new ServiceError("QR image must be PNG, JPG, or WebP.");
  }

  if (file.size > MAX_PAYMENT_QR_SIZE) {
    throw new ServiceError("QR image is too large. Max size is 5 MB.");
  }

  const extension = path.extname(file.name).toLowerCase() || ".png";
  const objectPath = `${provider}/${Date.now()}-${crypto.randomUUID()}${extension}`;
  const supabase = createAdminClient();
  const { data, error } = await supabase.storage.from(PAYMENT_QR_BUCKET).upload(objectPath, file, {
    cacheControl: "3600",
    contentType: file.type,
    upsert: false,
  });

  assertServiceSuccess(error, "Failed to upload QR image.");
  assertServiceData(data, "QR upload returned no file path.");

  return data.path;
}

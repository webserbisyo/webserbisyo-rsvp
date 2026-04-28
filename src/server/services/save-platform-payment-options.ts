import "server-only";

import type { PaymentOptionsInput } from "@/lib/validations/payment-options.schema";
import { PaymentOptionsSchema } from "@/lib/validations/payment-options.schema";
import { createAdminClient } from "@/lib/supabase/admin";
import { assertServiceSuccess } from "./service-error";
import { uploadPaymentQr } from "./upload-payment-qr";
import { writeAuditLog } from "./write-audit-log";

export async function savePlatformPaymentOptions(input: PaymentOptionsInput, actorUserId: string) {
  const payload = PaymentOptionsSchema.parse(input);
  const supabase = createAdminClient();

  const [gcashQrPath, mayaQrPath] = await Promise.all([
    payload.gcash.qrFile
      ? uploadPaymentQr(payload.gcash.qrFile, "gcash")
      : Promise.resolve(undefined),
    payload.maya.qrFile ? uploadPaymentQr(payload.maya.qrFile, "maya") : Promise.resolve(undefined),
  ]);

  const { error: paymentOptionsError } = await supabase.from("platform_payment_options").upsert(
    [
      {
        account_name: payload.gcash.accountName ?? null,
        account_number: payload.gcash.accountNumber ?? null,
        is_enabled: payload.gcash.isEnabled,
        provider: "gcash",
        qr_image_path: gcashQrPath ?? payload.gcash.qrImagePath ?? null,
        updated_by: actorUserId,
      },
      {
        account_name: payload.maya.accountName ?? null,
        account_number: payload.maya.accountNumber ?? null,
        is_enabled: payload.maya.isEnabled,
        provider: "maya",
        qr_image_path: mayaQrPath ?? payload.maya.qrImagePath ?? null,
        updated_by: actorUserId,
      },
    ],
    {
      onConflict: "provider",
    },
  );

  assertServiceSuccess(paymentOptionsError, "Failed to save manual payment options.");

  const { data: existingSettings, error: existingSettingsError } = await supabase
    .from("platform_public_settings")
    .select("id")
    .maybeSingle();

  assertServiceSuccess(existingSettingsError, "Failed to load public settings.");

  if (existingSettings?.id) {
    const { error: settingsUpdateError } = await supabase
      .from("platform_public_settings")
      .update({
        messenger_page_url: payload.messengerPageUrl ?? null,
        updated_by: actorUserId,
      })
      .eq("id", existingSettings.id);

    assertServiceSuccess(settingsUpdateError, "Failed to save public settings.");
  } else {
    const { error: settingsInsertError } = await supabase.from("platform_public_settings").insert({
      messenger_page_url: payload.messengerPageUrl ?? null,
      updated_by: actorUserId,
    });

    assertServiceSuccess(settingsInsertError, "Failed to create public settings.");
  }

  await writeAuditLog({
    action: "platform_payment_options_saved",
    actorUserId,
    entityType: "platform_payment_options",
    metadata: {
      enabled_payment_options: ["gcash", "maya"].filter((provider) =>
        provider === "gcash" ? payload.gcash.isEnabled : payload.maya.isEnabled,
      ),
      messenger_page_url: payload.messengerPageUrl ?? null,
    },
  });

  return {
    enabledPaymentOptions: ["gcash", "maya"].filter((provider) =>
      provider === "gcash" ? payload.gcash.isEnabled : payload.maya.isEnabled,
    ),
    messengerPageUrl: payload.messengerPageUrl ?? null,
  };
}

import "server-only";

import { requireAdmin } from "@/lib/permissions";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";

type PaymentOptionRow = Pick<
  Database["public"]["Tables"]["platform_payment_options"]["Row"],
  "account_name" | "account_number" | "is_enabled" | "provider" | "qr_image_path"
>;

type ProviderSettings = {
  accountName: string;
  accountNumber: string;
  isEnabled: boolean;
  provider: "gcash" | "maya";
  qrImagePath: string | null;
  qrImageUrl: string | null;
};

export type AdminPaymentOptionsView = {
  gcash: ProviderSettings;
  maya: ProviderSettings;
  messengerPageUrl: string;
};

const PAYMENT_QR_BUCKET = "payment-qr-images";

function toProviderSettings(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>,
  row: PaymentOptionRow | undefined,
  provider: "gcash" | "maya",
): ProviderSettings {
  const path = row?.qr_image_path ?? null;
  const publicUrl = path
    ? supabase.storage.from(PAYMENT_QR_BUCKET).getPublicUrl(path).data.publicUrl
    : null;

  return {
    accountName: row?.account_name ?? "",
    accountNumber: row?.account_number ?? "",
    isEnabled: row?.is_enabled ?? false,
    provider,
    qrImagePath: path,
    qrImageUrl: publicUrl,
  };
}

export async function getAdminPaymentOptions(): Promise<AdminPaymentOptionsView> {
  await requireAdmin();

  const supabase = await createServerSupabaseClient();
  const [
    { data: paymentOptions, error: paymentOptionsError },
    { data: settings, error: settingsError },
  ] = await Promise.all([
    supabase
      .from("platform_payment_options")
      .select("account_name, account_number, is_enabled, provider, qr_image_path")
      .in("provider", ["gcash", "maya"]),
    supabase.from("platform_public_settings").select("messenger_page_url").maybeSingle(),
  ]);

  if (paymentOptionsError) {
    throw paymentOptionsError;
  }

  if (settingsError) {
    throw settingsError;
  }

  const optionMap = new Map(paymentOptions?.map((option) => [option.provider, option]));

  return {
    gcash: toProviderSettings(supabase, optionMap.get("gcash"), "gcash"),
    maya: toProviderSettings(supabase, optionMap.get("maya"), "maya"),
    messengerPageUrl: settings?.messenger_page_url ?? "",
  };
}

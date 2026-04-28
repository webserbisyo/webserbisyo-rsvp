import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import type { Tables } from "@/lib/supabase/types";
import {
  type PublicApplyConfig,
  toPublicPaymentOptionDto,
} from "@/lib/apply/public-payment-option-dto";
import { isApplicationReferenceCode } from "@/lib/apply/reference";

const PAYMENT_QR_BUCKET = "payment-qr-images";

function getPaymentQrPublicUrl(path: string | null) {
  if (!path) {
    return null;
  }

  const supabase = createAdminClient();
  const { data } = supabase.storage.from(PAYMENT_QR_BUCKET).getPublicUrl(path);

  return data.publicUrl;
}

export async function getPublicApplyConfig(): Promise<PublicApplyConfig> {
  const supabase = createAdminClient();
  const [
    { data: paymentOptions, error: paymentOptionsError },
    { data: settings, error: settingsError },
  ] = await Promise.all([
    supabase
      .from("platform_payment_options")
      .select("account_name, account_number, is_enabled, provider, qr_image_path")
      .eq("is_enabled", true)
      .order("provider"),
    supabase.from("platform_public_settings").select("messenger_page_url").maybeSingle(),
  ]);

  if (paymentOptionsError) {
    throw paymentOptionsError;
  }

  if (settingsError) {
    throw settingsError;
  }

  return {
    messengerPageUrl: settings?.messenger_page_url ?? null,
    paymentOptions: (paymentOptions ?? []).map((option) =>
      toPublicPaymentOptionDto(option, getPaymentQrPublicUrl(option.qr_image_path)),
    ),
  };
}

export type PublicApplicationSuccessSummary = Pick<
  Tables<"rsvp_applications">,
  "preferred_manual_payment_option" | "preferred_plan" | "reference_code"
>;

export async function getPublicApplicationSuccessSummary(
  referenceCode: string | null | undefined,
): Promise<PublicApplicationSuccessSummary | null> {
  if (!isApplicationReferenceCode(referenceCode)) {
    return null;
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("rsvp_applications")
    .select("preferred_manual_payment_option, preferred_plan, reference_code")
    .eq("reference_code", referenceCode)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

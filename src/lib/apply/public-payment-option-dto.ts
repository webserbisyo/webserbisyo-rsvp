import { z } from "zod";
import type { Tables } from "@/lib/supabase/types";
import type { ManualPaymentOptionSchema } from "@/lib/validations/application.schema";

export type ManualPaymentOption = z.infer<typeof ManualPaymentOptionSchema>;

export type PublicPaymentOption = {
  accountName: string | null;
  accountNumber: string | null;
  label: string;
  provider: ManualPaymentOption;
  qrImageUrl: string | null;
};

export type PublicApplyConfig = {
  messengerPageUrl: string | null;
  paymentOptions: PublicPaymentOption[];
};

export const PAYMENT_OPTION_LABELS: Record<ManualPaymentOption, string> = {
  gcash: "GCash",
  maya: "Maya",
};

export function getPaymentOptionLabel(provider: ManualPaymentOption | null | undefined) {
  return provider ? PAYMENT_OPTION_LABELS[provider] : null;
}

export function toPublicPaymentOptionDto(
  option: Pick<
    Tables<"platform_payment_options">,
    "account_name" | "account_number" | "provider" | "qr_image_path"
  >,
  qrImageUrl: string | null,
): PublicPaymentOption {
  return {
    accountName: option.account_name,
    accountNumber: option.account_number,
    label: PAYMENT_OPTION_LABELS[option.provider as ManualPaymentOption],
    provider: option.provider as ManualPaymentOption,
    qrImageUrl,
  };
}

import "server-only";

import { addDays, subDays } from "date-fns";
import { requireTenantMember } from "@/lib/permissions";
import { createAdminClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { Tables } from "@/lib/supabase/types";
import type {
  BillingPageData,
  BillingPaymentStatus,
  BillingPlanType,
  BillingServiceState,
} from "@/components/dashboard/billing/billing-types";

const DEFAULT_CURRENCY = "PHP";
const DEFAULT_RENEWAL_WINDOW_DAYS = 30;
const PAYMENT_QR_BUCKET = "payment-qr-images";

const PLAN_COPY: Record<
  Exclude<BillingPlanType, "unknown">,
  { description: string; name: string }
> = {
  max: {
    description:
      "Max includes designer-created monogram details, richer animations, and a more customized event website experience than Pro.",
    name: "Max",
  },
  pro: {
    description:
      "Pro includes a polished event website with refined standard styling, essential animations, and a clean guest-friendly RSVP experience.",
    name: "Pro",
  },
};

const SERVICE_STATE_DESCRIPTIONS: Record<BillingServiceState, string> = {
  active: "Your website and RSVP dashboard will be active through your service period.",
  ending_soon:
    "Your service period is ending soon. Contact WebSerbisyo to renew or extend your coverage.",
  expired:
    "Your service period has ended. Contact WebSerbisyo to reactivate your website and dashboard.",
  missing_date:
    "Your service period is being finalized. Contact WebSerbisyo if this looks incorrect.",
  refunded: "Your service access may be affected by a refund. Contact WebSerbisyo for assistance.",
  unpaid: "Your service period starts after payment confirmation.",
};

type ClientRow = Pick<
  Tables<"clients">,
  "hosting_ends_at" | "hosting_starts_at" | "id" | "plan_type" | "renewal_required_at" | "status"
>;

type PaymentRow = Pick<
  Tables<"payments">,
  | "amount_due"
  | "amount_paid"
  | "created_at"
  | "currency"
  | "hosting_ends_at"
  | "hosting_starts_at"
  | "id"
  | "paid_at"
  | "payment_method"
  | "payment_status"
  | "plan_type"
  | "reference_number"
  | "renewal_required_at"
  | "updated_at"
>;

type PackageSettingsRow = Pick<
  Tables<"platform_package_settings">,
  "currency" | "default_amount" | "default_hosting_days" | "is_active" | "renewal_notice_days"
>;

type PaymentOptionRow = Pick<
  Tables<"platform_payment_options">,
  "account_name" | "account_number" | "is_enabled" | "provider" | "qr_image_path"
>;

export async function getBillingPageData(): Promise<BillingPageData> {
  const profile = await requireTenantMember();
  const clientId = profile.client_id;

  if (!clientId) {
    throw new Error("Client tenant profile is missing client_id.");
  }

  const supabase = await createServerSupabaseClient();
  const adminSupabase = createAdminClient();

  const [{ data: client, error: clientError }, { data: paymentRows, error: paymentError }] =
    await Promise.all([
      supabase
        .from("clients")
        .select("id, status, plan_type, hosting_starts_at, hosting_ends_at, renewal_required_at")
        .eq("id", clientId)
        .maybeSingle(),
      supabase
        .from("payments")
        .select(
          "id, plan_type, amount_due, amount_paid, currency, payment_status, payment_method, reference_number, paid_at, hosting_starts_at, hosting_ends_at, renewal_required_at, updated_at, created_at",
        )
        .eq("client_id", clientId)
        .order("updated_at", { ascending: false })
        .order("paid_at", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(1),
    ]);

  if (clientError) {
    throw clientError;
  }

  if (paymentError) {
    throw paymentError;
  }

  if (!client) {
    throw new Error("Billing could not load the current tenant client record.");
  }

  const latestPayment = paymentRows?.[0] ?? null;
  const planType = normalizePlanType(latestPayment?.plan_type ?? client.plan_type);

  const [packageSettings, refunds, messengerUrl, paymentOptions] = await Promise.all([
    safeLoadPackageSettings(adminSupabase, planType),
    safeLoadRefunds(adminSupabase, clientId, latestPayment?.id ?? null),
    safeLoadMessengerUrl(adminSupabase),
    safeLoadPaymentOptions(adminSupabase),
  ]);

  const refundTotal = refunds.reduce((sum, refund) => sum + (refund.amount ?? 0), 0);
  const totalPackageAmount = latestPayment?.amount_due ?? packageSettings?.default_amount ?? null;
  const amountPaid = latestPayment
    ? Math.max((latestPayment.amount_paid ?? 0) - refundTotal, 0)
    : 0;
  const remainingBalance =
    totalPackageAmount === null ? null : Math.max(totalPackageAmount - amountPaid, 0);
  const paymentStatus = deriveBillingPaymentStatus({
    amountDue: latestPayment?.amount_due ?? totalPackageAmount,
    amountPaid: latestPayment?.amount_paid ?? 0,
    paymentStatus: latestPayment?.payment_status ?? null,
    refundTotal,
  });
  const servicePeriod = resolveServicePeriod({
    client,
    latestPayment,
    packageSettings,
  });
  const serviceState = deriveServiceState({
    latestPayment,
    refundTotal,
    servicePeriod,
  });

  return {
    amountPaid,
    clientId: client.id,
    currency: latestPayment?.currency ?? packageSettings?.currency ?? DEFAULT_CURRENCY,
    latestPayment: latestPayment
      ? {
          amount:
            latestPayment.amount_paid && latestPayment.amount_paid > 0
              ? latestPayment.amount_paid
              : latestPayment.amount_due,
          confirmedAt: shouldShowConfirmedAt(latestPayment.payment_status)
            ? latestPayment.paid_at
            : null,
          method: latestPayment.payment_method,
          reference: latestPayment.reference_number,
          status: paymentStatus,
        }
      : null,
    paymentInstructions: buildPaymentInstructions({
      adminSupabase,
      options: paymentOptions,
      paymentStatus,
    }),
    paymentStatus,
    planDescription: getPlanDescription(planType),
    planName: getPlanName(planType),
    planType,
    remainingBalance,
    serviceDescription: SERVICE_STATE_DESCRIPTIONS[serviceState],
    servicePeriod,
    serviceState,
    support: {
      isEnabled: Boolean(messengerUrl),
      label: "Contact Support",
      url: messengerUrl,
    },
    totalPackageAmount,
  };
}

function buildPaymentInstructions({
  adminSupabase,
  options,
  paymentStatus,
}: {
  adminSupabase: ReturnType<typeof createAdminClient>;
  options: PaymentOptionRow[];
  paymentStatus: BillingPaymentStatus;
}): BillingPageData["paymentInstructions"] {
  if (paymentStatus === "confirmed") {
    return {
      description: "Your payment is complete. No further action needed.",
      options: [],
      title: "Payment complete",
    };
  }

  if (paymentStatus === "refunded") {
    return {
      description:
        "Your billing record includes a refund. Contact WebSerbisyo for updated payment instructions.",
      options: [],
      title: "Refund recorded",
    };
  }

  const availableOptions = options
    .filter((option) => option.is_enabled)
    .map((option) => ({
      accountName: option.account_name,
      accountNumber: option.account_number,
      provider: option.provider,
      qrImagePath: option.qr_image_path,
      qrImageUrl: getPaymentQrPublicUrl(adminSupabase, option.qr_image_path),
    }));

  return {
    description: "Please settle your remaining balance using one of the available payment options.",
    options: availableOptions,
    title: paymentStatus === "partial" ? "Remaining balance" : "Payment instructions",
  };
}

function deriveBillingPaymentStatus(input: {
  amountDue: number | null;
  amountPaid: number;
  paymentStatus: string | null;
  refundTotal: number;
}): BillingPaymentStatus {
  if (!input.paymentStatus) {
    return "unpaid";
  }

  if (input.paymentStatus === "refunded" || input.refundTotal > 0) {
    return "refunded";
  }

  if (input.paymentStatus === "pending") {
    return input.amountPaid > 0 ? "partial" : "pending";
  }

  if (input.paymentStatus === "paid") {
    if (input.amountDue !== null && input.amountPaid > 0 && input.amountPaid < input.amountDue) {
      return "partial";
    }

    return "confirmed";
  }

  if (["cancelled", "failed"].includes(input.paymentStatus)) {
    return "unpaid";
  }

  return "missing";
}

function deriveServiceState(input: {
  latestPayment: PaymentRow | null;
  refundTotal: number;
  servicePeriod: BillingPageData["servicePeriod"];
}): BillingServiceState {
  if (input.latestPayment?.payment_status === "refunded" || input.refundTotal > 0) {
    return "refunded";
  }

  if (
    !input.latestPayment ||
    ["pending", "failed", "cancelled"].includes(input.latestPayment.payment_status)
  ) {
    return "unpaid";
  }

  if (input.latestPayment.payment_status !== "paid") {
    return "unpaid";
  }

  if (!input.servicePeriod.startsAt || !input.servicePeriod.endsAt) {
    return "missing_date";
  }

  const now = Date.now();
  const endsAt = parseDate(input.servicePeriod.endsAt);

  if (!endsAt) {
    return "missing_date";
  }

  if (now >= endsAt.getTime()) {
    return "expired";
  }

  const renewalAt = parseDate(input.servicePeriod.renewalAt);

  if (renewalAt && now >= renewalAt.getTime()) {
    return "ending_soon";
  }

  return "active";
}

function getPlanDescription(planType: BillingPlanType) {
  return (
    PLAN_COPY[planType as keyof typeof PLAN_COPY]?.description ??
    "Your billing package will appear here once it has been finalized."
  );
}

function getPlanName(planType: BillingPlanType) {
  return PLAN_COPY[planType as keyof typeof PLAN_COPY]?.name ?? "Package pending";
}

function normalizePlanType(value: string | null | undefined): BillingPlanType {
  if (value === "pro" || value === "max") {
    return value;
  }

  return "unknown";
}

function parseDate(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function resolveServicePeriod(input: {
  client: ClientRow;
  latestPayment: PaymentRow | null;
  packageSettings: PackageSettingsRow | null;
}): BillingPageData["servicePeriod"] {
  const startsAt =
    input.latestPayment?.hosting_starts_at ??
    input.client.hosting_starts_at ??
    (input.latestPayment?.payment_status === "paid" ? input.latestPayment.paid_at : null) ??
    null;

  const endsAt =
    input.latestPayment?.hosting_ends_at ??
    input.client.hosting_ends_at ??
    computeEndsAt(startsAt, input.packageSettings?.default_hosting_days ?? null);

  return {
    endsAt,
    renewalAt: resolveRenewalAt({
      endsAt,
      packageSettings: input.packageSettings,
      rawRenewalAt:
        input.latestPayment?.renewal_required_at ?? input.client.renewal_required_at ?? null,
      startsAt,
    }),
    startsAt,
  };
}

function resolveRenewalAt(input: {
  endsAt: string | null;
  packageSettings: PackageSettingsRow | null;
  rawRenewalAt: string | null;
  startsAt: string | null;
}) {
  const startsAt = parseDate(input.startsAt);
  const endsAt = parseDate(input.endsAt);
  const renewalAt = parseDate(input.rawRenewalAt);

  if (
    renewalAt &&
    endsAt &&
    renewalAt.getTime() < endsAt.getTime() &&
    (!startsAt || renewalAt.getTime() > startsAt.getTime())
  ) {
    return renewalAt.toISOString();
  }

  if (!endsAt) {
    return null;
  }

  const fallbackDays = getSafeRenewalWindowDays(input.packageSettings);
  return subDays(endsAt, fallbackDays).toISOString();
}

function computeEndsAt(startsAt: string | null, defaultHostingDays: number | null) {
  const startsAtDate = parseDate(startsAt);

  if (!startsAtDate || !defaultHostingDays || defaultHostingDays <= 0) {
    return null;
  }

  return addDays(startsAtDate, defaultHostingDays).toISOString();
}

function getSafeRenewalWindowDays(packageSettings: PackageSettingsRow | null) {
  const renewalNoticeDays = packageSettings?.renewal_notice_days ?? null;
  const defaultHostingDays = packageSettings?.default_hosting_days ?? null;

  if (
    renewalNoticeDays &&
    renewalNoticeDays > 0 &&
    defaultHostingDays &&
    renewalNoticeDays < defaultHostingDays
  ) {
    return renewalNoticeDays;
  }

  return DEFAULT_RENEWAL_WINDOW_DAYS;
}

async function safeLoadMessengerUrl(adminSupabase: ReturnType<typeof createAdminClient>) {
  try {
    const { data, error } = await adminSupabase
      .from("platform_public_settings")
      .select("messenger_page_url")
      .maybeSingle();

    if (error) {
      throw error;
    }

    return data?.messenger_page_url ?? null;
  } catch (error) {
    logBillingAuxiliaryError("messenger url", error);
    return null;
  }
}

async function safeLoadPackageSettings(
  adminSupabase: ReturnType<typeof createAdminClient>,
  planType: BillingPlanType,
) {
  if (planType === "unknown") {
    return null;
  }

  try {
    const { data, error } = await adminSupabase
      .from("platform_package_settings")
      .select("default_amount, currency, default_hosting_days, renewal_notice_days, is_active")
      .eq("plan_type", planType)
      .eq("is_active", true)
      .maybeSingle();

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    logBillingAuxiliaryError("package settings", error);
    return null;
  }
}

async function safeLoadPaymentOptions(adminSupabase: ReturnType<typeof createAdminClient>) {
  try {
    const { data, error } = await adminSupabase
      .from("platform_payment_options")
      .select("provider, account_name, account_number, is_enabled, qr_image_path")
      .eq("is_enabled", true)
      .order("provider");

    if (error) {
      throw error;
    }

    return data ?? [];
  } catch (error) {
    logBillingAuxiliaryError("payment options", error);
    return [];
  }
}

function getPaymentQrPublicUrl(
  adminSupabase: ReturnType<typeof createAdminClient>,
  path: string | null,
) {
  if (!path) {
    return null;
  }

  const { data } = adminSupabase.storage.from(PAYMENT_QR_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

async function safeLoadRefunds(
  adminSupabase: ReturnType<typeof createAdminClient>,
  clientId: string,
  paymentId: string | null,
) {
  if (!paymentId) {
    return [];
  }

  try {
    const { data, error } = await adminSupabase
      .from("payment_refunds")
      .select("payment_id, amount, confirmed_at")
      .eq("client_id", clientId)
      .eq("payment_id", paymentId)
      .order("confirmed_at", { ascending: false });

    if (error) {
      throw error;
    }

    return data ?? [];
  } catch (error) {
    logBillingAuxiliaryError("payment refunds", error);
    return [];
  }
}

function shouldShowConfirmedAt(paymentStatus: string | null) {
  return paymentStatus === "paid" || paymentStatus === "refunded";
}

function logBillingAuxiliaryError(scope: string, error: unknown) {
  console.error(`Failed to load dashboard billing ${scope}.`, error);
}

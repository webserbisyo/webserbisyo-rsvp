import "server-only";

import { requireAdmin } from "@/lib/permissions";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export type AdminPackageSetting = {
  currency: string;
  defaultAmount: number | null;
  defaultHostingDays: number | null;
  isActive: boolean;
  planType: "pro" | "max";
  renewalNoticeDays: number | null;
};

export type AdminPackageSettingsView = {
  max: AdminPackageSetting;
  pro: AdminPackageSetting;
};

export async function getAdminPackageSettings(): Promise<AdminPackageSettingsView> {
  await requireAdmin();

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("platform_package_settings")
    .select(
      "plan_type, default_amount, currency, default_hosting_days, renewal_notice_days, is_active",
    )
    .in("plan_type", ["pro", "max"]);

  if (error) {
    throw error;
  }

  const rows = new Map((data ?? []).map((row) => [row.plan_type, row]));

  return {
    max: toPackageSetting(rows.get("max"), "max"),
    pro: toPackageSetting(rows.get("pro"), "pro"),
  };
}

function toPackageSetting(
  row:
    | {
        currency: string;
        default_amount: number | null;
        default_hosting_days: number | null;
        is_active: boolean;
        renewal_notice_days: number | null;
      }
    | undefined,
  planType: "pro" | "max",
): AdminPackageSetting {
  return {
    currency: row?.currency ?? "PHP",
    defaultAmount: row?.default_amount ?? null,
    defaultHostingDays: row?.default_hosting_days ?? null,
    isActive: row?.is_active ?? true,
    planType,
    renewalNoticeDays: row?.renewal_notice_days ?? null,
  };
}

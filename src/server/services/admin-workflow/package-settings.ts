import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import type { Tables, TablesInsert } from "@/lib/supabase/types";
import type { SavePackageSettingsInput } from "@/lib/validations/admin-workflow.schema";
import { ServiceError, assertServiceSuccess } from "@/server/services/service-error";
import { writeAuditLog } from "@/server/services/write-audit-log";

export type PackagePlanType = "pro" | "max";

export type PackageSettingRecord = Pick<
  Tables<"platform_package_settings">,
  | "created_at"
  | "currency"
  | "default_amount"
  | "default_hosting_days"
  | "id"
  | "is_active"
  | "plan_type"
  | "renewal_notice_days"
  | "updated_at"
  | "updated_by"
>;

const PACKAGE_SETTINGS_COLUMNS =
  "id, plan_type, default_amount, currency, default_hosting_days, renewal_notice_days, is_active, updated_by, created_at, updated_at";

export async function getPackageSettingsMap() {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("platform_package_settings")
    .select(PACKAGE_SETTINGS_COLUMNS)
    .in("plan_type", ["pro", "max"]);

  assertServiceSuccess(error, "Failed to load package settings.");

  return new Map((data ?? []).map((row) => [row.plan_type as PackagePlanType, row]));
}

export async function getRequiredPackageSettings(planType: PackagePlanType) {
  const settingsMap = await getPackageSettingsMap();
  const settings = settingsMap.get(planType);

  if (!settings || !settings.is_active) {
    throw new ServiceError(
      `${formatPlanLabel(planType)} package settings are inactive. Update /admin/settings before continuing.`,
    );
  }

  if (
    settings.default_amount === null ||
    settings.default_hosting_days === null ||
    settings.renewal_notice_days === null
  ) {
    throw new ServiceError(
      `${formatPlanLabel(planType)} package settings are incomplete. Update /admin/settings before continuing.`,
    );
  }

  return {
    ...settings,
    currency: settings.currency,
    defaultAmount: settings.default_amount,
    defaultHostingDays: settings.default_hosting_days,
    renewalNoticeDays: settings.renewal_notice_days,
  };
}

export async function savePackageSettings(input: SavePackageSettingsInput, actorUserId: string) {
  const supabase = createAdminClient();
  const rows: TablesInsert<"platform_package_settings">[] = [
    {
      default_amount: input.pro.defaultAmount,
      default_hosting_days: input.pro.defaultHostingDays,
      is_active: input.pro.isActive,
      plan_type: "pro",
      renewal_notice_days: input.pro.renewalNoticeDays,
      updated_by: actorUserId,
    },
    {
      default_amount: input.max.defaultAmount,
      default_hosting_days: input.max.defaultHostingDays,
      is_active: input.max.isActive,
      plan_type: "max",
      renewal_notice_days: input.max.renewalNoticeDays,
      updated_by: actorUserId,
    },
  ];

  const { data, error } = await supabase
    .from("platform_package_settings")
    .upsert(rows, { onConflict: "plan_type" })
    .select(PACKAGE_SETTINGS_COLUMNS);

  assertServiceSuccess(error, "Failed to save package settings.");

  await writeAuditLog({
    action: "platform_package_settings_saved",
    actorUserId,
    entityType: "platform_package_settings",
    metadata: {
      max: {
        default_amount: input.max.defaultAmount,
        default_hosting_days: input.max.defaultHostingDays,
        is_active: input.max.isActive,
        renewal_notice_days: input.max.renewalNoticeDays,
      },
      pro: {
        default_amount: input.pro.defaultAmount,
        default_hosting_days: input.pro.defaultHostingDays,
        is_active: input.pro.isActive,
        renewal_notice_days: input.pro.renewalNoticeDays,
      },
    },
  });

  const nextRows = data ?? [];
  const settingsMap = new Map(nextRows.map((row) => [row.plan_type as PackagePlanType, row]));
  const pro = settingsMap.get("pro");
  const max = settingsMap.get("max");

  if (!pro || !max) {
    throw new ServiceError("Package settings could not be reloaded after saving.");
  }

  return {
    max,
    pro,
  };
}

function formatPlanLabel(planType: PackagePlanType) {
  return planType === "max" ? "Max" : "Pro";
}

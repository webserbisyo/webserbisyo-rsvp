export const CLIENT_ACCESS_ENABLED_STATUSES = ["active", "paused", "expired"] as const;

export type ClientAccessEnabledStatus = (typeof CLIENT_ACCESS_ENABLED_STATUSES)[number];

const CLIENT_ACCESS_ENABLED_STATUS_SET = new Set<string>(CLIENT_ACCESS_ENABLED_STATUSES);

export function clientStatusAllowsDashboardAccess(
  status: string | null | undefined,
): status is ClientAccessEnabledStatus {
  return typeof status === "string" && CLIENT_ACCESS_ENABLED_STATUS_SET.has(status);
}

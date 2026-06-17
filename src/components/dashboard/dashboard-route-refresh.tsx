"use client";

import { type DashboardSyncEventName, useDashboardRefresh } from "@/lib/dashboard/dashboard-sync";

type DashboardRouteRefreshProps = {
  eventId?: string | null;
  events?: DashboardSyncEventName[];
  refreshOnFocus?: boolean;
  refreshOnVisibility?: boolean;
};

export function DashboardRouteRefresh({
  eventId = null,
  events,
  refreshOnFocus = false,
  refreshOnVisibility = false,
}: DashboardRouteRefreshProps) {
  useDashboardRefresh({
    eventId,
    events,
    refreshOnFocus,
    refreshOnVisibility,
  });

  return null;
}

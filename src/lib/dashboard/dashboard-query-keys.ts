import type { DashboardView } from "./dashboard-routes";

export type DashboardResponsesFilters = {
  tab?: string | null;
};

export const dashboardKeys = {
  all: ["dashboard"] as const,
  billing: () => [...dashboardKeys.all, "billing"] as const,
  bootstrap: () => [...dashboardKeys.all, "bootstrap"] as const,
  event: () => [...dashboardKeys.all, "event"] as const,
  home: () => [...dashboardKeys.all, "home"] as const,
  responses: (filters?: DashboardResponsesFilters) =>
    filters ? ([...dashboardKeys.all, "responses", filters] as const) : ([...dashboardKeys.all, "responses"] as const),
  settings: () => [...dashboardKeys.all, "settings"] as const,
  websiteAccess: () => [...dashboardKeys.all, "website-access"] as const,
};

export function dashboardQueryKeyForView(view: DashboardView) {
  switch (view) {
    case "billing":
      return dashboardKeys.billing();
    case "event":
      return dashboardKeys.event();
    case "responses":
      return dashboardKeys.responses();
    case "settings":
      return dashboardKeys.settings();
    case "websiteAccess":
      return dashboardKeys.websiteAccess();
    case "home":
    default:
      return dashboardKeys.home();
  }
}

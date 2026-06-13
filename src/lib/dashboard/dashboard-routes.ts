export type DashboardView =
  | "billing"
  | "event"
  | "home"
  | "responses"
  | "settings"
  | "websiteAccess";

export const DASHBOARD_ROUTE_BY_VIEW: Record<DashboardView, string> = {
  billing: "/dashboard/billing",
  event: "/dashboard/event",
  home: "/dashboard",
  responses: "/dashboard/responses",
  settings: "/dashboard/settings",
  websiteAccess: "/dashboard/website-access",
};

export function getDashboardViewForPathname(pathname: string): DashboardView | null {
  const normalizedPathname = normalizeDashboardPathname(pathname);

  switch (normalizedPathname) {
    case "/dashboard":
      return "home";
    case "/dashboard/event":
      return "event";
    case "/dashboard/responses":
      return "responses";
    case "/dashboard/website-access":
      return "websiteAccess";
    case "/dashboard/billing":
      return "billing";
    case "/dashboard/settings":
      return "settings";
    default:
      return null;
  }
}

export function getDashboardHrefForView(view: DashboardView) {
  return DASHBOARD_ROUTE_BY_VIEW[view];
}

export function isDashboardSpaPath(pathname: string) {
  return getDashboardViewForPathname(pathname) !== null;
}

function normalizeDashboardPathname(pathname: string) {
  if (pathname.length > 1 && pathname.endsWith("/")) {
    return pathname.slice(0, -1);
  }

  return pathname;
}

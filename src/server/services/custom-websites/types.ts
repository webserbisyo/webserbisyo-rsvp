export type CustomWebsiteRouteMode = "custom" | "default";
export type CustomWebsiteHealthStatus =
  | "contract_invalid"
  | "event_content_invalid"
  | "event_not_found"
  | "frontend_unreachable"
  | "healthy"
  | "preview_misconfigured"
  | "unknown";

export type DashboardCustomWebsitePreviewDto = {
  customPreviewAvailable: boolean;
  customPreviewLabel: string;
  customPreviewUrl: string | null;
  eventId: string | null;
  fallbackUrl: string | null;
  healthStatus: CustomWebsiteHealthStatus;
  lastHealthCheckedAt: string | null;
  platformEventSlug: string | null;
  savedRevision: number;
  publicWebsiteUrl: string | null;
  routeMode: CustomWebsiteRouteMode;
};

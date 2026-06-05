export type CustomWebsiteRouteMode = "custom" | "default";
export type CustomWebsiteHealthStatus = "healthy" | "unhealthy" | "unknown";

export type DashboardCustomWebsitePreviewDto = {
  customPreviewAvailable: boolean;
  customPreviewLabel: string;
  customPreviewUrl: string | null;
  eventId: string | null;
  fallbackUrl: string | null;
  healthStatus: CustomWebsiteHealthStatus;
  lastHealthCheckedAt: string | null;
  platformEventSlug: string | null;
  publicWebsiteUrl: string | null;
  routeMode: CustomWebsiteRouteMode;
};

import type { BillingPageData } from "@/components/dashboard/billing/billing-types";
import type { WebsiteAccessInitialData } from "@/components/dashboard/website-access/website-access-types";
import type { DashboardHomeData } from "@/server/queries/dashboard";
import type { DashboardEventWebsiteData } from "@/server/queries/dashboard-event";
import type { DashboardResponsesData } from "@/server/queries/responses";
import type { SettingsPageData } from "@/server/queries/settings";

export type DashboardBootstrapDto = {
  clientId: string;
  displayName?: string;
  email: string;
  planType: string | null;
  profileId: string;
};

export type DashboardHomeDto = DashboardHomeData;
export type DashboardEventDto = DashboardEventWebsiteData;
export type DashboardResponsesDto = DashboardResponsesData;
export type DashboardWebsiteAccessDto = WebsiteAccessInitialData;
export type DashboardBillingDto = BillingPageData;
export type DashboardSettingsDto = SettingsPageData;

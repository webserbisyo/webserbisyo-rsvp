"use client";

import { ErrorState } from "@/components/feedback/error-state";
import { DashboardViewLoading } from "@/components/dashboard/dashboard-view-loading";
import { WebsiteAccessPage } from "@/components/dashboard/website-access/website-access-page";
import { useDashboardWebsiteAccessQuery } from "@/lib/dashboard/dashboard-queries";

export default function DashboardWebsiteAccessView() {
  const query = useDashboardWebsiteAccessQuery();

  if (!query.data) {
    if (query.isError) {
      return (
        <ErrorState
          title="Website Access could not be loaded"
          description="Refresh the page or try again after checking your event website setup."
        />
      );
    }

    return <DashboardViewLoading view="websiteAccess" />;
  }

  return <WebsiteAccessPage initialData={query.data} />;
}

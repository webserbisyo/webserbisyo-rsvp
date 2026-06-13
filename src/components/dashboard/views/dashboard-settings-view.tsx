"use client";

import { ErrorState } from "@/components/feedback/error-state";
import { DashboardViewLoading } from "@/components/dashboard/dashboard-view-loading";
import { SettingsPage } from "@/components/dashboard/settings/settings-page";
import { useDashboardSettingsQuery } from "@/lib/dashboard/dashboard-queries";

export default function DashboardSettingsView() {
  const query = useDashboardSettingsQuery();

  if (!query.data) {
    if (query.isError) {
      return (
        <ErrorState
          title="Settings could not be loaded"
          description="Refresh the page or try again after checking your connection."
        />
      );
    }

    return <DashboardViewLoading view="settings" />;
  }

  return <SettingsPage data={query.data} />;
}

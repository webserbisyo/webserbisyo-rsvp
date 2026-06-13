"use client";

import { ErrorState } from "@/components/feedback/error-state";
import { DashboardViewLoading } from "@/components/dashboard/dashboard-view-loading";
import type { DashboardClientViewProps } from "@/components/dashboard/dashboard-view-router";
import { EventWebsiteWorkspace } from "@/components/dashboard/event/event-website-workspace";
import { useDashboardEventQuery } from "@/lib/dashboard/dashboard-queries";

export default function DashboardEventView({ searchParams }: DashboardClientViewProps) {
  const query = useDashboardEventQuery();
  const requestedSection = searchParams.get("section");

  if (!query.data) {
    if (query.isError) {
      return (
        <ErrorState
          title="Event Website could not be loaded"
          description="Refresh the page or try again after checking your connection."
        />
      );
    }

    return <DashboardViewLoading view="event" />;
  }

  return (
    <div className="event-website-page pb-24 md:pb-8">
      <EventWebsiteWorkspace
        eventWebsiteData={query.data}
        initialSelectedSection={requestedSection}
      />
    </div>
  );
}

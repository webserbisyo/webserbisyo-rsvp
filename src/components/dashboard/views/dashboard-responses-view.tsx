"use client";

import { DashboardViewLoading } from "@/components/dashboard/dashboard-view-loading";
import type { DashboardClientViewProps } from "@/components/dashboard/dashboard-view-router";
import { RsvpResponsesPage } from "@/components/dashboard/responses/rsvp-responses-page";
import type { RsvpResponsesTab } from "@/components/dashboard/responses/rsvp-responses-types";
import { useDashboardResponsesQuery } from "@/lib/dashboard/dashboard-queries";

export default function DashboardResponsesView({ searchParams }: DashboardClientViewProps) {
  const query = useDashboardResponsesQuery();
  const initialActiveTab = normalizeResponsesTab(searchParams.get("tab") ?? undefined);

  if (!query.data) {
    if (query.isError) {
      return (
        <RsvpResponsesPage
          errorMessage="Refresh the page or try again after checking the current event setup."
          eventSlug={null}
          eventTitle={null}
          hasCurrentEvent={false}
          initialActiveTab={initialActiveTab}
          initialResponses={[]}
        />
      );
    }

    return <DashboardViewLoading view="responses" />;
  }

  return (
    <RsvpResponsesPage
      errorMessage={null}
      eventSlug={query.data.currentEvent?.event_slug ?? null}
      eventTitle={query.data.currentEvent?.title ?? null}
      hasCurrentEvent={query.data.currentEvent !== null}
      initialActiveTab={initialActiveTab}
      initialResponses={query.data.responses}
    />
  );
}

function normalizeResponsesTab(tab: string | undefined): RsvpResponsesTab {
  switch (tab) {
    case "attending":
    case "guestbook":
    case "messages":
    case "needs_review":
    case "not_attending":
    case "rejected":
      return tab;
    case "needs-review":
      return "needs_review";
    case "not-attending":
      return "not_attending";
    default:
      return "all";
  }
}

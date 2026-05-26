import { RsvpResponsesPage } from "@/components/dashboard/responses/rsvp-responses-page";
import type { RsvpResponsesTab } from "@/components/dashboard/responses/rsvp-responses-types";
import { getDashboardResponses } from "@/server/queries/responses";

type DashboardResponsesPageProps = {
  searchParams?: Promise<{
    tab?: string | string[];
  }>;
};

export default async function DashboardResponsesPage({
  searchParams,
}: DashboardResponsesPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const data = await loadDashboardResponses(resolvedSearchParams);

  return (
    <RsvpResponsesPage
      errorMessage={data.errorMessage}
      eventSlug={data.eventSlug}
      eventTitle={data.eventTitle}
      hasCurrentEvent={data.hasCurrentEvent}
      initialActiveTab={data.initialActiveTab}
      initialResponses={data.initialResponses}
    />
  );
}

async function loadDashboardResponses(searchParams?: {
  tab?: string | string[];
}) {
  try {
    const data = await getDashboardResponses();

    return {
      errorMessage: null,
      eventSlug: data.currentEvent?.event_slug ?? null,
      eventTitle: data.currentEvent?.title ?? null,
      hasCurrentEvent: data.currentEvent !== null,
      initialActiveTab: normalizeResponsesTab(searchParams?.tab),
      initialResponses: data.responses,
    };
  } catch {
    return {
      errorMessage: "Refresh the page or try again after checking the current event setup.",
      eventSlug: null,
      eventTitle: null,
      hasCurrentEvent: false,
      initialActiveTab: "all" as const,
      initialResponses: [],
    };
  }
}

function normalizeResponsesTab(tab: string | string[] | undefined): RsvpResponsesTab {
  const value = Array.isArray(tab) ? tab[0] : tab;

  switch (value) {
    case "attending":
    case "guestbook":
    case "messages":
    case "needs_review":
    case "not_attending":
      return value;
    case "needs-review":
      return "needs_review";
    case "not-attending":
      return "not_attending";
    default:
      return "all";
  }
}

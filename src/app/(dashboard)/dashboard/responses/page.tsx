import { RsvpResponsesPage } from "@/components/dashboard/responses/rsvp-responses-page";
import { getDashboardResponses } from "@/server/queries/responses";

export default async function DashboardResponsesPage() {
  const data = await loadDashboardResponses();

  return (
    <RsvpResponsesPage
      errorMessage={data.errorMessage}
      eventSlug={data.eventSlug}
      eventTitle={data.eventTitle}
      hasCurrentEvent={data.hasCurrentEvent}
      initialResponses={data.initialResponses}
    />
  );
}

async function loadDashboardResponses() {
  try {
    const data = await getDashboardResponses();

    return {
      errorMessage: null,
      eventSlug: data.currentEvent?.event_slug ?? null,
      eventTitle: data.currentEvent?.title ?? null,
      hasCurrentEvent: data.currentEvent !== null,
      initialResponses: data.responses,
    };
  } catch {
    return {
      errorMessage: "Refresh the page or try again after checking the current event setup.",
      eventSlug: null,
      eventTitle: null,
      hasCurrentEvent: false,
      initialResponses: [],
    };
  }
}

import { RsvpResponsesPage } from "@/components/dashboard/responses/rsvp-responses-page";
import { getDashboardResponses } from "@/server/queries/responses";

export default async function DashboardResponsesPage() {
  const data = await loadDashboardResponses();

  return (
    <RsvpResponsesPage
      errorMessage={data.errorMessage}
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
      hasCurrentEvent: data.currentEvent !== null,
      initialResponses: data.responses,
    };
  } catch {
    return {
      errorMessage: "Refresh the page or try again after checking the current event setup.",
      hasCurrentEvent: false,
      initialResponses: [],
    };
  }
}

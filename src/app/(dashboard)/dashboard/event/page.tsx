import { EventWebsiteWorkspace } from "@/components/dashboard/event/event-website-workspace";
import { getDashboardEventWebsiteData } from "@/server/queries/dashboard-event";

export default async function DashboardEventPage() {
  const eventWebsiteData = await getDashboardEventWebsiteData();

  return (
    <div className="event-website-page event-website-workspace pb-24 md:pb-8">
      <EventWebsiteWorkspace eventWebsiteData={eventWebsiteData} />
    </div>
  );
}

import { EventWebsiteWorkspace } from "@/components/dashboard/event/event-website-workspace";
import { getDashboardEventWebsiteData } from "@/server/queries/dashboard-event";

type DashboardEventPageProps = {
  searchParams?: Promise<{
    section?: string | string[];
  }>;
};

export default async function DashboardEventPage({ searchParams }: DashboardEventPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const eventWebsiteData = await getDashboardEventWebsiteData();
  const requestedSection = Array.isArray(resolvedSearchParams?.section)
    ? resolvedSearchParams?.section[0]
    : resolvedSearchParams?.section;

  return (
    <div className="event-website-page event-website-workspace pb-24 md:pb-8">
      <EventWebsiteWorkspace
        eventWebsiteData={eventWebsiteData}
        initialSelectedSection={requestedSection ?? null}
        key={requestedSection ?? "host_info"}
      />
    </div>
  );
}

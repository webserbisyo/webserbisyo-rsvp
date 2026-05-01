import { CalendarDays } from "lucide-react";
import { ClientPageContainer } from "@/components/client-dashboard/shell/client-page-container";
import { ClientEmptyState } from "@/components/client-dashboard/ui/client-empty-state";
import { ClientPageHeader } from "@/components/client-dashboard/ui/client-page-header";

export default function DashboardEventDetailsPage() {
  return (
    <ClientPageContainer>
      <ClientPageHeader
        title="Event Details"
        description="Event details management will be configured here."
      />
      <ClientEmptyState
        icon={<CalendarDays className="size-6" />}
        title="Event details will live here"
        description="Core event setup such as the event title, date, venue, and related summary cards will be introduced in a later implementation phase."
      />
    </ClientPageContainer>
  );
}

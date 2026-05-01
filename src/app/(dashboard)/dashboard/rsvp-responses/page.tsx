import { Users } from "lucide-react";
import { ClientPageContainer } from "@/components/client-dashboard/shell/client-page-container";
import { ClientEmptyState } from "@/components/client-dashboard/ui/client-empty-state";
import { ClientPageHeader } from "@/components/client-dashboard/ui/client-page-header";

export default function DashboardRsvpResponsesPage() {
  return (
    <ClientPageContainer>
      <ClientPageHeader
        title="RSVP Responses"
        description="Coming soon. Guest responses require future guest/response schema."
      />
      <ClientEmptyState
        badgeLabel="Soon"
        icon={<Users className="size-6" />}
        title="RSVP responses are placeholder-only for now"
        description="Guest response management, filtering, exports, and response analytics must wait until the future guest and response schema is designed and approved."
      />
    </ClientPageContainer>
  );
}

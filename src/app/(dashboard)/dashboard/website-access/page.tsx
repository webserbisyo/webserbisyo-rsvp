import { Globe } from "lucide-react";
import { ClientPageContainer } from "@/components/client-dashboard/shell/client-page-container";
import { ClientEmptyState } from "@/components/client-dashboard/ui/client-empty-state";
import { ClientPageHeader } from "@/components/client-dashboard/ui/client-page-header";

export default function DashboardWebsiteAccessPage() {
  return (
    <ClientPageContainer>
      <ClientPageHeader
        title="Website Access"
        description="RSVP website link, visibility, and QR tools will be configured after schema confirmation."
      />
      <ClientEmptyState
        icon={<Globe className="size-6" />}
        title="Website access remains placeholder-only"
        description="Public links, visibility states, QR tooling, and any private-access workflow will stay deferred until the underlying schema and product rules are confirmed."
      />
    </ClientPageContainer>
  );
}

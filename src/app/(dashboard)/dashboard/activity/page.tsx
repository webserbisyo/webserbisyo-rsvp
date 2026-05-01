import { Activity } from "lucide-react";
import { ClientPageContainer } from "@/components/client-dashboard/shell/client-page-container";
import { ClientEmptyState } from "@/components/client-dashboard/ui/client-empty-state";
import { ClientPageHeader } from "@/components/client-dashboard/ui/client-page-header";

export default function DashboardActivityPage() {
  return (
    <ClientPageContainer>
      <ClientPageHeader
        title="Activity"
        description="Activity and email logs will be shown here."
      />
      <ClientEmptyState
        icon={<Activity className="size-6" />}
        title="Activity history will appear here"
        description="Client-visible timeline entries, onboarding touchpoints, and related email or workflow logs will be surfaced here in a future implementation phase."
      />
    </ClientPageContainer>
  );
}

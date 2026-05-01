import { Settings } from "lucide-react";
import { ClientPageContainer } from "@/components/client-dashboard/shell/client-page-container";
import { ClientEmptyState } from "@/components/client-dashboard/ui/client-empty-state";
import { ClientPageHeader } from "@/components/client-dashboard/ui/client-page-header";

export default function DashboardSettingsPage() {
  return (
    <ClientPageContainer>
      <ClientPageHeader
        title="Settings"
        description="Client dashboard settings will be configured here."
      />
      <ClientEmptyState
        icon={<Settings className="size-6" />}
        title="Settings placeholders are ready"
        description="Client profile preferences, access controls, and future account options will be wired into this space after the supporting workflows are approved."
      />
    </ClientPageContainer>
  );
}

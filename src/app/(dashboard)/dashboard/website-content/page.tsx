import { LayoutTemplate } from "lucide-react";
import { ClientPageContainer } from "@/components/client-dashboard/shell/client-page-container";
import { ClientEmptyState } from "@/components/client-dashboard/ui/client-empty-state";
import { ClientPageHeader } from "@/components/client-dashboard/ui/client-page-header";

export default function DashboardWebsiteContentPage() {
  return (
    <ClientPageContainer>
      <ClientPageHeader
        title="Website Content"
        description="Website content preview and editing will be configured here."
      />
      <ClientEmptyState
        icon={<LayoutTemplate className="size-6" />}
        title="Website content tools are staged"
        description="Preview controls, section editing, and guided content management will be added here once the shell foundation is approved."
      />
    </ClientPageContainer>
  );
}

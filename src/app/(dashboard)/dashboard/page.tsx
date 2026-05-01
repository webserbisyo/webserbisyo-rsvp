import { House } from "lucide-react";
import { ClientPageContainer } from "@/components/client-dashboard/shell/client-page-container";
import { ClientEmptyState } from "@/components/client-dashboard/ui/client-empty-state";
import { ClientPageHeader } from "@/components/client-dashboard/ui/client-page-header";

export default function DashboardPage() {
  return (
    <ClientPageContainer>
      <ClientPageHeader title="Home" description="Client dashboard home foundation." />
      <ClientEmptyState
        icon={<House className="size-6" />}
        title="The client shell foundation is ready"
        description="This space will evolve into a guided overview for event progress, website access, payment status, and next-step prompts in a later phase."
      />
    </ClientPageContainer>
  );
}

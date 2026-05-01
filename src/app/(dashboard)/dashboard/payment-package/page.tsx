import { CreditCard } from "lucide-react";
import { ClientPageContainer } from "@/components/client-dashboard/shell/client-page-container";
import { ClientEmptyState } from "@/components/client-dashboard/ui/client-empty-state";
import { ClientPageHeader } from "@/components/client-dashboard/ui/client-page-header";

export default function DashboardPaymentPackagePage() {
  return (
    <ClientPageContainer>
      <ClientPageHeader
        title="Payment / Package"
        description="Payment and package details will be configured here."
      />
      <ClientEmptyState
        icon={<CreditCard className="size-6" />}
        title="Payment and package details will be added here"
        description="Plan summaries, billing checkpoints, and supporting payment guidance will be introduced later without reusing the platform admin presentation."
      />
    </ClientPageContainer>
  );
}

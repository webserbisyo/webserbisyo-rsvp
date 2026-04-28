import type { Metadata } from "next";
import { EmptyState } from "@/components/feedback/empty-state";
import { PageContainer } from "@/components/app-shell/page-container";
import { PageHeader } from "@/components/app-shell/page-header";

export const metadata: Metadata = {
  title: "Payments",
};

export default function AdminPaymentsPage() {
  return (
    <PageContainer>
      <PageHeader
        title="Payments"
        description="Manual package payment review shell for future Pro and Max confirmations."
      />
      <EmptyState
        title="No payments loaded"
        description="Payment records and review actions are deferred until the approval workflow is connected."
      />
    </PageContainer>
  );
}

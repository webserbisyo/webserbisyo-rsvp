import type { Metadata } from "next";
import { ComingSoonCard } from "@/components/feedback/coming-soon-card";
import { PageContainer } from "@/components/app-shell/page-container";
import { PageHeader } from "@/components/app-shell/page-header";

export const metadata: Metadata = {
  title: "Clients",
};

export default function AdminClientsPage() {
  return (
    <PageContainer>
      <PageHeader
        title="Clients"
        description="Approved clients will appear here after application review and provisioning are connected."
      />
      <ComingSoonCard description="Client records are intentionally not fetched in this shell foundation." />
    </PageContainer>
  );
}

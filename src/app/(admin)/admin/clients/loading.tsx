import { PageContainer } from "@/components/app-shell/page-container";
import { PageHeader } from "@/components/app-shell/page-header";
import { LoadingSkeleton } from "@/components/feedback/loading-skeleton";

export default function AdminClientsLoading() {
  return (
    <PageContainer>
      <PageHeader
        title="Clients"
        description="Manage approved RSVP clients, hosting coverage, event lifecycle, and cleanup readiness."
      />
      <LoadingSkeleton rows={4} variant="list" />
    </PageContainer>
  );
}

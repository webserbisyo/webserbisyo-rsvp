import { PageContainer } from "@/components/app-shell/page-container";
import { LoadingSkeleton } from "@/components/feedback/loading-skeleton";

export default function AdminClientDetailLoading() {
  return (
    <PageContainer>
      <LoadingSkeleton rows={4} />
    </PageContainer>
  );
}

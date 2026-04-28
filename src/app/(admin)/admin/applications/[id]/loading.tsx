import { PageContainer } from "@/components/app-shell/page-container";
import { LoadingSkeleton } from "@/components/feedback/loading-skeleton";
import { Skeleton } from "@/components/ui/skeleton";

export default function AdminApplicationDetailLoading() {
  return (
    <PageContainer>
      <div className="space-y-4">
        <Skeleton className="h-9 w-44" />
        <div className="space-y-3">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-8 w-52" />
          <Skeleton className="h-4 w-72" />
          <div className="flex gap-2">
            <Skeleton className="h-6 w-28" />
            <Skeleton className="h-6 w-16" />
            <Skeleton className="h-6 w-24" />
          </div>
        </div>
      </div>
      <LoadingSkeleton rows={4} variant="cards" />
      <LoadingSkeleton rows={3} variant="list" />
    </PageContainer>
  );
}

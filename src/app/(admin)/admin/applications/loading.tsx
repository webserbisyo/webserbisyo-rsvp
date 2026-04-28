import { PageContainer } from "@/components/app-shell/page-container";
import { PageHeader } from "@/components/app-shell/page-header";
import { LoadingSkeleton } from "@/components/feedback/loading-skeleton";
import { Skeleton } from "@/components/ui/skeleton";

export default function AdminApplicationsLoading() {
  return (
    <PageContainer>
      <PageHeader
        title="Applications"
        description="Read-only application review queue for submitted Pro and Max RSVP website applications."
      />
      <div className="bg-card space-y-4 rounded-lg border p-4">
        <Skeleton className="h-8 w-full max-w-xl" />
        <Skeleton className="h-10 w-full" />
        <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      </div>
      <div className="bg-card hidden rounded-lg border p-4 lg:block">
        <LoadingSkeleton rows={6} variant="list" />
      </div>
      <div className="lg:hidden">
        <LoadingSkeleton rows={4} variant="list" />
      </div>
    </PageContainer>
  );
}

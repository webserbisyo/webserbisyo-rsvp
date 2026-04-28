import { PageContainer } from "@/components/app-shell/page-container";
import { PageHeader } from "@/components/app-shell/page-header";
import { LoadingSkeleton } from "@/components/feedback/loading-skeleton";
import { SectionCard } from "@/components/shared/section-card";
import { Skeleton } from "@/components/ui/skeleton";

export default function AdminHomeLoading() {
  return (
    <PageContainer>
      <PageHeader title="Admin home" description="Loading the latest operational snapshot." />

      <LoadingSkeleton rows={4} />

      <div className="grid gap-6 xl:grid-cols-[1.3fr_1fr]">
        <SectionCard title="Needs Attention" description="Loading priority items.">
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="space-y-2">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-28" />
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Quick Actions" description="Loading shortcuts.">
          <div className="grid gap-3 sm:grid-cols-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-10 w-full" />
            ))}
          </div>
        </SectionCard>
      </div>

      <SectionCard title="Recent Applications" description="Loading recent submissions.">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="space-y-3 rounded-lg border p-4">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-8 w-16" />
            </div>
          ))}
        </div>
      </SectionCard>
    </PageContainer>
  );
}

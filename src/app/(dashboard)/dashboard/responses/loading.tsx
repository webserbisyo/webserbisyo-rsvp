import {
  DashboardCardSkeleton,
  DashboardStatsSkeleton,
  DashboardSkeletonLine,
  DashboardTableSkeleton,
} from "@/components/dashboard/skeletons";

export default function DashboardResponsesLoading() {
  return (
    <div className="space-y-6 pt-6 pb-24 md:pb-8">
      <DashboardCardSkeleton contentClassName="px-5 py-4 sm:px-6">
        <div className="space-y-3">
          <DashboardSkeletonLine className="h-4 w-24 rounded-full" />
          <DashboardSkeletonLine className="h-8 w-48 rounded-[1.1rem]" />
        </div>
      </DashboardCardSkeleton>
      <DashboardStatsSkeleton />
      <DashboardTableSkeleton mobileCardCount={2} rowCount={4} />
    </div>
  );
}

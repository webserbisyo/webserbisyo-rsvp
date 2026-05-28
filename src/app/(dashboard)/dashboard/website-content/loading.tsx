import { DashboardCardSkeleton, DashboardSkeletonLine } from "@/components/dashboard/skeletons";

export default function DashboardWebsiteContentLoading() {
  return (
    <DashboardCardSkeleton className="max-w-xl">
      <div className="space-y-4">
        <DashboardSkeletonLine className="h-8 w-48 rounded-2xl" />
        <DashboardSkeletonLine className="h-4 w-full rounded-full" />
        <DashboardSkeletonLine className="h-4 w-3/4 rounded-full" />
      </div>
    </DashboardCardSkeleton>
  );
}

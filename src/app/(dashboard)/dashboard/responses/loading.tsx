import {
  DashboardStatsSkeleton,
  DashboardTableSkeleton,
} from "@/components/dashboard/skeletons";

export default function DashboardResponsesLoading() {
  return (
    <div className="space-y-6 pt-6 pb-24 md:pb-8">
      <DashboardStatsSkeleton />
      <DashboardTableSkeleton />
    </div>
  );
}

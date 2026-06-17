import {
  DashboardCardSkeleton,
  DashboardSkeletonBlock,
  DashboardSkeletonLine,
} from "./dashboard-card-skeleton";

export function DashboardStatsSkeleton({
  columns = "xl:grid-cols-4",
  count = 4,
}: {
  columns?: string;
  count?: number;
}) {
  return (
    <section className={`grid gap-4 sm:grid-cols-2 ${columns}`}>
      {Array.from({ length: count }).map((_, index) => (
        <DashboardCardSkeleton key={index} className="rounded-[1.6rem]" contentClassName="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 space-y-3">
              <DashboardSkeletonLine className="h-8 w-20 rounded-xl" />
              <DashboardSkeletonLine className="h-4 w-28 rounded-xl" />
            </div>
            <DashboardSkeletonBlock className="h-10 w-10 rounded-2xl" />
          </div>
        </DashboardCardSkeleton>
      ))}
    </section>
  );
}

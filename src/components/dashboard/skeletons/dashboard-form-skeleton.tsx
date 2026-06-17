import {
  DashboardCardSkeleton,
  DashboardSkeletonBlock,
  DashboardSkeletonLine,
} from "./dashboard-card-skeleton";

export function DashboardFormSkeleton({
  compact = false,
  rows = 5,
  showFooter = true,
}: {
  compact?: boolean;
  rows?: number;
  showFooter?: boolean;
}) {
  return (
    <DashboardCardSkeleton className="overflow-hidden rounded-[1.75rem]">
      <div className="space-y-4">
        <div className="space-y-3">
          <DashboardSkeletonLine className="h-4 w-28 rounded-full" />
          <DashboardSkeletonLine
            className={compact ? "h-8 w-48 rounded-2xl" : "h-10 w-56 rounded-2xl"}
          />
          <DashboardSkeletonLine className="h-3 w-full rounded-full" />
          <DashboardSkeletonLine className="h-3 w-4/5 rounded-full" />
        </div>

        <div className={compact ? "space-y-3" : "space-y-4"}>
          {Array.from({ length: rows }).map((_, index) => (
            <div key={index} className="space-y-2">
              <DashboardSkeletonLine className="h-3 w-24 rounded-full" />
              <DashboardSkeletonBlock
                className={compact ? "h-11 w-full rounded-xl" : "h-12 w-full rounded-2xl"}
              />
            </div>
          ))}
        </div>

        {showFooter ? (
          <div className="flex flex-wrap gap-3 pt-2">
            <DashboardSkeletonLine className="h-10 w-36 rounded-xl" />
            <DashboardSkeletonLine className="h-10 w-28 rounded-xl" />
          </div>
        ) : null}
      </div>
    </DashboardCardSkeleton>
  );
}

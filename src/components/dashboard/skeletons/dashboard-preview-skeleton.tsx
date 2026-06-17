import {
  DashboardSkeletonBlock,
  DashboardSkeletonCircle,
  DashboardSkeletonLine,
} from "./dashboard-card-skeleton";
import { cn } from "@/lib/utils";

export function DashboardPreviewSkeleton({
  className,
  compact = false,
}: {
  className?: string;
  compact?: boolean;
}) {
  return (
    <aside
      className={cn("event-website-preview-space", className)}
      aria-label="Website preview loading"
    >
      <div className="event-preview-panel">
        <div className={cn("event-preview-frame-shell", compact && "is-compact")}>
          <div className="event-preview-browser-bar">
            <span className="flex items-center gap-2">
              <DashboardSkeletonCircle className="h-3 w-3" />
              <DashboardSkeletonCircle className="h-3 w-3" />
              <DashboardSkeletonCircle className="h-3 w-3" />
            </span>
            <DashboardSkeletonLine className="h-4 w-40 rounded-full" />
            <DashboardSkeletonLine className="ml-auto h-8 w-20 rounded-full" />
          </div>
          <div className="event-preview-frame bg-[linear-gradient(180deg,#fff8ef_0%,#ffffff_55%,#fff6ec_100%)]">
            <div className="space-y-4 p-5">
              <DashboardSkeletonBlock className="h-32 w-full rounded-[1.5rem]" />
              <DashboardSkeletonBlock className="h-20 w-full rounded-[1.5rem]" />
              <div className="grid gap-4">
                <DashboardSkeletonBlock className="h-28 w-full rounded-[1.5rem]" />
                <DashboardSkeletonBlock className="h-40 w-full rounded-[1.5rem]" />
                <DashboardSkeletonBlock className="h-24 w-full rounded-[1.5rem]" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}

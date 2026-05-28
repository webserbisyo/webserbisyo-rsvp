import {
  DashboardCardSkeleton,
  DashboardFormSkeleton,
  DashboardPreviewSkeleton,
  DashboardSkeletonBlock,
  DashboardSkeletonCircle,
  DashboardSkeletonLine,
} from "@/components/dashboard/skeletons";

function EventWebsiteFlowPaneSkeleton() {
  return (
    <section className="event-website-pane" aria-label="Event Website setup sections loading">
      <DashboardCardSkeleton className="event-website-status-card" contentClassName="px-4 py-4">
        <div className="space-y-4">
          <DashboardSkeletonLine className="h-6 w-28 rounded-full" />
          <DashboardSkeletonLine className="h-4 w-40 rounded-full" />
          <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="rounded-2xl border border-[color:var(--dash-border)] bg-white/60 px-4 py-3">
                <DashboardSkeletonLine className="h-3 w-20 rounded-full" />
                <DashboardSkeletonLine className="mt-2 h-7 w-16 rounded-full" />
              </div>
            ))}
          </div>
          <div className="flex gap-3">
            <DashboardSkeletonLine className="h-10 w-28 rounded-xl" />
            <DashboardSkeletonLine className="h-10 w-24 rounded-xl" />
          </div>
        </div>
      </DashboardCardSkeleton>

      <div className="event-section-group">
        <div className="event-section-heading">
          <DashboardSkeletonLine className="h-4 w-24 rounded-full" />
          <DashboardSkeletonLine className="h-8 w-24 rounded-full" />
        </div>
        <div className="event-section-list">
          {Array.from({ length: 7 }).map((_, index) => (
            <div
              key={index}
              className="flex items-center gap-3 rounded-[1.4rem] border border-[color:var(--dash-border)] bg-[color:color-mix(in_srgb,var(--dash-surface)_90%,white)] px-4 py-4 shadow-[var(--dash-shadow-sm)]"
            >
              <DashboardSkeletonCircle className="h-5 w-5" />
              <div className="flex-1 space-y-2">
                <DashboardSkeletonLine className="h-4 w-32 rounded-full" />
                <DashboardSkeletonLine className="h-3 w-24 rounded-full" />
              </div>
              <DashboardSkeletonLine className="h-6 w-14 rounded-full" />
            </div>
          ))}
        </div>
      </div>

      <div className="event-section-group">
        <div className="event-section-heading">
          <DashboardSkeletonLine className="h-4 w-36 rounded-full" />
        </div>
        <div className="event-section-list">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={index}
              className="flex items-center gap-3 rounded-[1.4rem] border border-[color:var(--dash-border)] bg-[color:color-mix(in_srgb,var(--dash-surface)_90%,white)] px-4 py-4 shadow-[var(--dash-shadow-sm)]"
            >
              <DashboardSkeletonCircle className="h-5 w-5" />
              <div className="flex-1 space-y-2">
                <DashboardSkeletonLine className="h-4 w-28 rounded-full" />
                <DashboardSkeletonLine className="h-3 w-20 rounded-full" />
              </div>
              <DashboardSkeletonLine className="h-6 w-16 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function DashboardEventLoading() {
  return (
    <>
      <div className="event-website-workspace hidden xl:grid">
        <EventWebsiteFlowPaneSkeleton />
        <div className="event-website-middle-space grid content-start gap-4">
          <DashboardFormSkeleton rows={6} />
          <DashboardCardSkeleton>
            <div className="grid gap-3 sm:grid-cols-2">
              <DashboardSkeletonBlock className="h-20 w-full rounded-2xl" />
              <DashboardSkeletonBlock className="h-20 w-full rounded-2xl" />
            </div>
          </DashboardCardSkeleton>
        </div>
        <DashboardPreviewSkeleton />
      </div>

      <div className="event-website-responsive-shell xl:hidden">
        <DashboardCardSkeleton className="event-website-status-card" contentClassName="px-4 py-4">
          <div className="space-y-4">
            <DashboardSkeletonLine className="h-6 w-28 rounded-full" />
            <DashboardSkeletonLine className="h-4 w-48 rounded-full" />
            <div className="grid grid-cols-3 gap-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <DashboardSkeletonBlock key={index} className="h-[4.5rem] w-full rounded-2xl" />
              ))}
            </div>
          </div>
        </DashboardCardSkeleton>

        <div className="event-website-responsive-tabs">
          <div className="event-website-mode-tabs">
            <DashboardSkeletonLine className="h-11 flex-1 rounded-full" />
            <DashboardSkeletonLine className="h-11 flex-1 rounded-full" />
          </div>
          <EventWebsiteFlowPaneSkeleton />
        </div>
      </div>
    </>
  );
}

import {
  DashboardCardSkeleton,
  DashboardSkeletonBlock,
  DashboardSkeletonCircle,
  DashboardSkeletonLine,
} from "@/components/dashboard/skeletons";

export default function DashboardHomeLoading() {
  return (
    <div className="ws-home-page pb-24 md:pb-8">
      <section className="ws-intro">
        <div className="ws-intro-line">
          <DashboardSkeletonLine className="h-8 w-72 rounded-full" />
        </div>
      </section>

      <section className="ws-countdown-hero min-h-[300px]">
        <div className="ws-countdown-overlay" aria-hidden="true" />
        <div className="ws-edit-date pointer-events-none">
          <DashboardSkeletonLine className="h-5 w-28 rounded-full" />
        </div>
        <div className="ws-hero-left space-y-4">
          <DashboardSkeletonLine className="h-4 w-28 rounded-full" />
          <DashboardSkeletonLine className="h-12 w-64 rounded-[1.25rem]" />
          <DashboardSkeletonLine className="h-12 w-52 rounded-[1.25rem]" />
          <div className="flex items-center gap-3">
            <DashboardSkeletonCircle className="h-4 w-4" />
            <DashboardSkeletonLine className="h-4 w-44 rounded-full" />
          </div>
        </div>
        <div className="ws-hero-right">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="ws-count-tile-wrap">
                <DashboardSkeletonBlock className="h-20 w-full rounded-[1.5rem]" />
                <DashboardSkeletonLine className="mx-auto mt-3 h-3 w-12 rounded-full" />
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="ws-summary-grid">
        {Array.from({ length: 4 }).map((_, index) => (
          <DashboardCardSkeleton key={index} className="ws-summary-card">
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-4">
                <DashboardSkeletonLine className="h-4 w-20 rounded-full" />
                <DashboardSkeletonCircle className="h-11 w-11" />
              </div>
              <DashboardSkeletonLine className="h-8 w-32 rounded-2xl" />
              <DashboardSkeletonLine className="h-3 w-full rounded-full" />
              <DashboardSkeletonLine className="h-3 w-5/6 rounded-full" />
              <DashboardSkeletonLine className="h-7 w-24 rounded-full" />
            </div>
          </DashboardCardSkeleton>
        ))}
      </section>

      <section className="ws-bottom-grid">
        <DashboardCardSkeleton className="ws-checklist">
          <div className="space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-2">
                <DashboardSkeletonLine className="h-6 w-40 rounded-full" />
                <DashboardSkeletonLine className="h-4 w-28 rounded-full" />
              </div>
              <DashboardSkeletonLine className="h-7 w-12 rounded-full" />
            </div>
            <DashboardSkeletonLine className="h-2.5 w-full rounded-full" />
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, index) => (
                <div key={index} className="flex items-center gap-3 rounded-2xl border border-[color:var(--dash-border)] bg-white/60 px-4 py-3">
                  <DashboardSkeletonCircle className="h-6 w-6" />
                  <DashboardSkeletonLine className="h-4 flex-1 rounded-full" />
                  <DashboardSkeletonLine className="h-4 w-16 rounded-full" />
                </div>
              ))}
            </div>
          </div>
        </DashboardCardSkeleton>

        <div className="ws-right-stack">
          <DashboardCardSkeleton className="ws-website-panel">
            <div className="space-y-4">
              <DashboardSkeletonLine className="h-6 w-40 rounded-full" />
              <DashboardSkeletonBlock className="h-12 w-full rounded-2xl" />
              <div className="grid gap-3 sm:grid-cols-3">
                {Array.from({ length: 3 }).map((_, index) => (
                  <DashboardSkeletonLine key={index} className="h-11 w-full rounded-2xl" />
                ))}
              </div>
            </div>
          </DashboardCardSkeleton>

          <DashboardCardSkeleton className="ws-quick-stats">
            <div className="space-y-4">
              <DashboardSkeletonLine className="h-6 w-28 rounded-full" />
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="flex items-center gap-3 rounded-2xl border border-[color:var(--dash-border)] bg-white/55 px-4 py-3">
                  <DashboardSkeletonCircle className="h-8 w-8" />
                  <DashboardSkeletonLine className="h-4 w-32 rounded-full" />
                  <DashboardSkeletonLine className="ml-auto h-5 w-16 rounded-full" />
                </div>
              ))}
            </div>
          </DashboardCardSkeleton>
        </div>
      </section>
    </div>
  );
}

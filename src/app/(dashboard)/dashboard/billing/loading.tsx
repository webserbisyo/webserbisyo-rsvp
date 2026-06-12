import {
  DashboardCardSkeleton,
  DashboardSkeletonBlock,
  DashboardSkeletonCircle,
  DashboardSkeletonLine,
  DashboardStatsSkeleton,
} from "@/components/dashboard/skeletons";

export default function DashboardBillingLoading() {
  return (
    <div className="space-y-6 pb-24 pt-2 md:pb-8">
      <DashboardSkeletonLine className="h-4 w-24 rounded-full" />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_330px] xl:grid-cols-[minmax(0,1fr)_348px]">
        <div className="space-y-6">
          <DashboardCardSkeleton
            className="overflow-hidden border-[color:color-mix(in_srgb,var(--dash-brand)_28%,var(--dash-border))] bg-gradient-to-br from-[color:color-mix(in_srgb,var(--dash-brand-subtle)_55%,white)] via-[color:color-mix(in_srgb,var(--dash-surface)_80%,#fff7f1)] to-[color:color-mix(in_srgb,var(--dash-surface-muted)_70%,#ffeedd)] shadow-[0_16px_40px_rgba(201,107,72,0.1),0_3px_0_rgba(201,107,72,0.14)]"
            contentClassName="px-6 py-7 sm:px-7 sm:py-8"
          >
            <div className="max-w-2xl space-y-4">
              <DashboardSkeletonLine className="h-4 w-28 rounded-full" />
              <DashboardSkeletonLine className="h-14 w-44 rounded-[1.4rem]" />
              <DashboardSkeletonLine className="h-5 w-full rounded-full" />
              <DashboardSkeletonLine className="h-5 w-5/6 rounded-full" />
            </div>
          </DashboardCardSkeleton>

          <DashboardStatsSkeleton />

          <DashboardCardSkeleton contentClassName="px-6 py-6 sm:px-7 sm:py-7">
            <div className="space-y-5">
              <DashboardSkeletonLine className="h-4 w-28 rounded-full" />
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div key={index} className="flex items-center justify-between gap-6 border-b border-[color:var(--dash-divider)] py-3.5 last:border-b-0">
                    <DashboardSkeletonLine className="h-4 w-24 rounded-full" />
                    <DashboardSkeletonLine className="h-4 w-28 rounded-full" />
                  </div>
                ))}
              </div>
            </div>
          </DashboardCardSkeleton>
        </div>

        <aside className="space-y-5 self-start lg:sticky lg:top-[calc(var(--dash-header-height)+1rem)]">
          <DashboardCardSkeleton contentClassName="px-5 py-5 sm:px-6 sm:py-6">
            <div className="space-y-5">
              <DashboardSkeletonLine className="h-4 w-40 rounded-full" />
              <div className="space-y-3">
                {Array.from({ length: 2 }).map((_, index) => (
                  <div key={index} className="flex items-center justify-between gap-5 border-b border-[color:var(--dash-divider)] py-3.5 last:border-b-0">
                    <DashboardSkeletonLine className="h-4 w-20 rounded-full" />
                    <DashboardSkeletonLine className="h-4 w-24 rounded-full" />
                  </div>
                ))}
              </div>
              <DashboardSkeletonLine className="h-4 w-full rounded-full" />
              <DashboardSkeletonLine className="h-4 w-5/6 rounded-full" />
            </div>
          </DashboardCardSkeleton>

          <DashboardCardSkeleton contentClassName="px-5 py-5 sm:px-6 sm:py-6">
            <div className="space-y-4">
              <DashboardSkeletonLine className="h-4 w-36 rounded-full" />
              {Array.from({ length: 2 }).map((_, index) => (
                <div key={index} className="rounded-2xl border border-[color:var(--dash-border)] bg-white/60 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-2">
                      <DashboardSkeletonLine className="h-4 w-20 rounded-full" />
                      <DashboardSkeletonLine className="h-4 w-32 rounded-full" />
                    </div>
                    <DashboardSkeletonBlock className="h-16 w-16 rounded-xl" />
                  </div>
                </div>
              ))}
            </div>
          </DashboardCardSkeleton>

          <DashboardCardSkeleton contentClassName="px-5 py-5 sm:px-6 sm:py-6">
            <div className="flex gap-3.5">
              <DashboardSkeletonCircle className="h-9 w-9" />
              <div className="flex-1 space-y-2">
                <DashboardSkeletonLine className="h-5 w-40 rounded-full" />
                <DashboardSkeletonLine className="h-4 w-full rounded-full" />
                <DashboardSkeletonLine className="h-4 w-4/5 rounded-full" />
              </div>
            </div>
            <DashboardSkeletonLine className="mt-5 h-11 w-full rounded-full" />
          </DashboardCardSkeleton>
        </aside>
      </div>
    </div>
  );
}

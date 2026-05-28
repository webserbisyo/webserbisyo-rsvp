import { DashboardCardSkeleton, DashboardSkeletonBlock, DashboardSkeletonLine } from "./dashboard-card-skeleton";

export function DashboardTableSkeleton({
  mobileCardCount = 3,
  rowCount = 5,
  showFooter = true,
}: {
  mobileCardCount?: number;
  rowCount?: number;
  showFooter?: boolean;
}) {
  return (
    <DashboardCardSkeleton className="rounded-[1.6rem] overflow-hidden" contentClassName="p-0">
      <div className="border-b border-[color:var(--dash-border)] bg-white/70 p-4">
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 5 }).map((_, index) => (
            <DashboardSkeletonLine key={index} className="h-10 w-24 rounded-full" />
          ))}
        </div>
        <div className="mt-4 flex flex-col gap-3 xl:flex-row">
          <DashboardSkeletonLine className="h-11 flex-1 rounded-2xl" />
          <DashboardSkeletonLine className="h-11 w-full rounded-2xl xl:w-32" />
        </div>
        <DashboardSkeletonLine className="mt-3 h-3 w-72 rounded-full" />
      </div>

      <div className="px-4 py-4 xl:hidden">
        <div className="grid gap-3">
          {Array.from({ length: mobileCardCount }).map((_, index) => (
            <div
              key={index}
              className="rounded-[1.45rem] border border-[color:var(--dash-border)] bg-[#fffdfb] p-4 shadow-sm shadow-[#8a4b2e]/5"
            >
              <div className="flex items-start gap-3">
                <DashboardSkeletonBlock className="h-5 w-5 rounded-md" />
                <DashboardSkeletonBlock className="h-10 w-10 rounded-2xl" />
                <div className="flex-1 space-y-2">
                  <DashboardSkeletonLine className="h-5 w-36 rounded-xl" />
                  <DashboardSkeletonLine className="h-4 w-44 rounded-xl" />
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <DashboardSkeletonLine className="h-6 w-20 rounded-full" />
                <DashboardSkeletonLine className="h-6 w-24 rounded-full" />
                <DashboardSkeletonLine className="h-6 w-28 rounded-full" />
              </div>
              <div className="my-3 border-t border-[color:color-mix(in_srgb,var(--dash-border)_88%,white)]" />
              <div className="flex items-center justify-between gap-3">
                <DashboardSkeletonLine className="h-3 w-28 rounded-full" />
                <DashboardSkeletonLine className="h-8 w-24 rounded-xl" />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="hidden xl:block">
        <div className="border-b border-[color:var(--dash-border)] bg-[#fffaf6] px-5 py-4">
          <div className="grid grid-cols-[48px_1.2fr_1fr_130px_110px_150px] gap-4">
            {Array.from({ length: 6 }).map((_, index) => (
              <DashboardSkeletonLine key={index} className="h-4 w-full rounded-xl" />
            ))}
          </div>
        </div>
        <div className="divide-y divide-[color:color-mix(in_srgb,var(--dash-border)_88%,white)]">
          {Array.from({ length: rowCount }).map((_, index) => (
            <div key={index} className="grid grid-cols-[48px_1.2fr_1fr_130px_110px_150px] gap-4 px-5 py-4">
              <DashboardSkeletonBlock className="h-5 w-5 rounded-md" />
              <div className="space-y-2">
                <DashboardSkeletonLine className="h-4 w-36 rounded-xl" />
                <DashboardSkeletonLine className="h-3 w-28 rounded-xl" />
              </div>
              <div className="space-y-2">
                <DashboardSkeletonLine className="h-4 w-40 rounded-xl" />
                <DashboardSkeletonLine className="h-3 w-24 rounded-xl" />
              </div>
              <DashboardSkeletonLine className="h-6 w-24 rounded-full" />
              <DashboardSkeletonLine className="h-6 w-20 rounded-full" />
              <div className="ml-auto flex gap-2">
                <DashboardSkeletonLine className="h-8 w-16 rounded-xl" />
                <DashboardSkeletonLine className="h-8 w-10 rounded-xl" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {showFooter ? (
        <div className="border-t border-[color:var(--dash-border)] bg-white/70 px-5 py-4">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <DashboardSkeletonLine className="h-4 w-40 rounded-xl" />
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <DashboardSkeletonLine className="h-9 w-32 rounded-xl" />
              <div className="flex gap-2">
                <DashboardSkeletonLine className="h-9 w-24 rounded-xl" />
                <DashboardSkeletonLine className="h-9 w-20 rounded-xl" />
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </DashboardCardSkeleton>
  );
}

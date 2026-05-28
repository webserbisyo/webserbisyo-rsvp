import {
  DashboardCardSkeleton,
  DashboardSkeletonBlock,
  DashboardSkeletonCircle,
  DashboardSkeletonLine,
} from "@/components/dashboard/skeletons";

export default function DashboardWebsiteAccessLoading() {
  return (
    <div className="space-y-6 pt-6 pb-24 md:pb-8">
      <DashboardCardSkeleton className="rounded-2xl" contentClassName="px-5 py-4 sm:px-7">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <DashboardSkeletonCircle className="h-3 w-3" />
            <DashboardSkeletonLine className="h-6 w-32 rounded-full" />
          </div>
          <DashboardSkeletonLine className="h-10 w-36 rounded-2xl" />
        </div>
      </DashboardCardSkeleton>

      <div className="grid gap-6 xl:grid-cols-2">
        <DashboardCardSkeleton>
          <div className="space-y-5">
            <div className="flex items-center justify-between gap-3">
              <DashboardSkeletonLine className="h-6 w-32 rounded-full" />
              <DashboardSkeletonLine className="h-7 w-24 rounded-full" />
            </div>
            <div className="grid gap-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="grid grid-cols-[2.75rem_1fr_auto] items-center gap-3 rounded-2xl border border-[color:var(--dash-border)] bg-white px-4 py-3">
                  <DashboardSkeletonBlock className="h-11 w-11 rounded-[0.875rem]" />
                  <div className="space-y-2">
                    <DashboardSkeletonLine className="h-4 w-24 rounded-full" />
                    <DashboardSkeletonLine className="h-3 w-40 rounded-full" />
                  </div>
                  <DashboardSkeletonCircle className="h-7 w-7" />
                </div>
              ))}
            </div>
            <DashboardSkeletonBlock className="h-14 w-full rounded-xl" />
          </div>
        </DashboardCardSkeleton>

        <DashboardCardSkeleton>
          <div className="space-y-5">
            <div className="flex items-center justify-between gap-3">
              <DashboardSkeletonLine className="h-6 w-36 rounded-full" />
              <DashboardSkeletonLine className="h-7 w-24 rounded-full" />
            </div>
            <div className="grid gap-3">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="flex items-center justify-between rounded-xl bg-[#FEFAF7] px-4 py-3">
                  <DashboardSkeletonLine className="h-4 w-28 rounded-full" />
                  <DashboardSkeletonLine className="h-4 w-20 rounded-full" />
                </div>
              ))}
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <DashboardSkeletonLine className="h-10 flex-1 rounded-xl" />
              <DashboardSkeletonLine className="h-10 w-full rounded-xl sm:w-32" />
            </div>
          </div>
        </DashboardCardSkeleton>
      </div>

      <DashboardCardSkeleton>
        <div className="space-y-5">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <DashboardSkeletonLine className="h-6 w-40 rounded-full" />
            <DashboardSkeletonLine className="h-4 w-52 rounded-full" />
          </div>
          <div className="grid min-w-0 items-center gap-3 sm:grid-cols-[1fr_auto]">
            <DashboardSkeletonBlock className="h-12 w-full rounded-xl" />
            <DashboardSkeletonLine className="h-12 w-full rounded-xl sm:w-28" />
          </div>
          <DashboardSkeletonLine className="h-4 w-28 rounded-full" />
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <DashboardSkeletonBlock className="h-12 flex-1 rounded-xl" />
            <DashboardSkeletonLine className="h-10 w-40 rounded-full" />
            <DashboardSkeletonLine className="h-10 w-36 rounded-xl" />
          </div>
          <div className="space-y-2 text-sm">
            <DashboardSkeletonLine className="h-4 w-56 rounded-full" />
            <DashboardSkeletonLine className="h-4 w-64 rounded-full" />
            <DashboardSkeletonLine className="h-4 w-72 rounded-full" />
          </div>
        </div>
      </DashboardCardSkeleton>

      <DashboardCardSkeleton>
        <div className="space-y-5">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <DashboardSkeletonLine className="h-6 w-24 rounded-full" />
            <DashboardSkeletonLine className="h-4 w-40 rounded-full" />
          </div>
          <div className="grid gap-5 xl:grid-cols-2">
            {Array.from({ length: 2 }).map((_, index) => (
              <div key={index} className="rounded-2xl border border-[#eacdbf] bg-[#FEFAF7] p-5">
                <div className="flex items-center gap-3">
                  <DashboardSkeletonBlock className="h-11 w-11 rounded-[0.875rem]" />
                  <div className="space-y-2">
                    <DashboardSkeletonLine className="h-4 w-24 rounded-full" />
                    <DashboardSkeletonLine className="h-3 w-36 rounded-full" />
                  </div>
                </div>
                <div className="mx-auto mt-5 flex w-fit items-center justify-center rounded-2xl border border-[#f0e7de] bg-white p-4 shadow-sm shadow-[#8a4b2e]/5">
                  <DashboardSkeletonBlock className="h-[148px] w-[148px] rounded-xl" />
                </div>
                <div className="mt-5 grid grid-cols-2 gap-3">
                  <DashboardSkeletonLine className="h-10 w-full rounded-xl" />
                  <DashboardSkeletonLine className="h-10 w-full rounded-xl" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </DashboardCardSkeleton>
    </div>
  );
}

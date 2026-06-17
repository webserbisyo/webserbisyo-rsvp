import {
  DashboardCardSkeleton,
  DashboardSkeletonBlock,
  DashboardSkeletonCircle,
  DashboardSkeletonLine,
} from "@/components/dashboard/skeletons";

export default function DashboardSettingsLoading() {
  return (
    <div className="space-y-6 pt-2 pb-24 md:pb-8">
      <DashboardSkeletonLine className="h-4 w-20 rounded-full" />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_330px] xl:grid-cols-[minmax(0,1fr)_348px]">
        <div className="space-y-6">
          <DashboardCardSkeleton contentClassName="px-6 py-7 sm:px-7">
            <DashboardSkeletonLine className="h-4 w-36 rounded-full" />
            <div className="mt-5 flex items-center gap-5">
              <DashboardSkeletonCircle className="h-[62px] w-[62px]" />
              <div className="min-w-0 flex-1 space-y-2">
                <DashboardSkeletonLine className="h-8 w-44 rounded-2xl" />
                <DashboardSkeletonLine className="h-4 w-52 rounded-full" />
              </div>
              <DashboardSkeletonLine className="h-7 w-20 rounded-full" />
            </div>
            <div className="mt-7">
              {Array.from({ length: 2 }).map((_, index) => (
                <div
                  key={index}
                  className="flex items-center gap-5 border-t border-[#eee5db] py-6 first:border-t-0"
                >
                  <DashboardSkeletonCircle className="h-10 w-10" />
                  <div className="min-w-0 flex-1 space-y-2">
                    <DashboardSkeletonLine className="h-4 w-16 rounded-full" />
                    <DashboardSkeletonLine className="h-5 w-40 rounded-full" />
                  </div>
                  <DashboardSkeletonLine className="h-7 w-16 rounded-full" />
                </div>
              ))}
            </div>
          </DashboardCardSkeleton>

          <DashboardCardSkeleton contentClassName="px-6 py-7 sm:px-7">
            <DashboardSkeletonLine className="h-4 w-52 rounded-full" />
            <div className="mt-5">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="flex items-center gap-5 py-6 first:pt-0 last:pb-0">
                  <DashboardSkeletonCircle className="h-10 w-10" />
                  <div className="min-w-0 flex-1 space-y-2">
                    <DashboardSkeletonLine className="h-5 w-40 rounded-full" />
                    <DashboardSkeletonLine className="h-4 w-36 rounded-full" />
                  </div>
                  <DashboardSkeletonBlock className="h-6 w-11 rounded-full" />
                </div>
              ))}
            </div>
            <DashboardSkeletonLine className="mt-4 h-4 w-full rounded-full" />
            <DashboardSkeletonLine className="mt-2 h-4 w-5/6 rounded-full" />
          </DashboardCardSkeleton>
        </div>

        <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
          <DashboardCardSkeleton contentClassName="px-6 py-7 sm:px-7">
            <DashboardSkeletonLine className="h-4 w-32 rounded-full" />
            <div className="mt-5 flex items-center gap-4">
              <DashboardSkeletonBlock className="h-[72px] w-[72px] rounded-[1.35rem]" />
              <DashboardSkeletonLine className="h-7 flex-1 rounded-2xl" />
            </div>
            <DashboardSkeletonLine className="mt-4 h-4 w-full rounded-full" />
            <DashboardSkeletonLine className="mt-2 h-4 w-4/5 rounded-full" />
            <DashboardSkeletonLine className="mt-6 h-[52px] w-full rounded-2xl" />
          </DashboardCardSkeleton>

          <DashboardCardSkeleton contentClassName="px-6 py-7 sm:px-7">
            <div className="flex items-start gap-4">
              <DashboardSkeletonCircle className="h-12 w-12" />
              <div className="flex-1 space-y-2">
                <DashboardSkeletonLine className="h-4 w-24 rounded-full" />
                <DashboardSkeletonLine className="h-7 w-40 rounded-2xl" />
                <DashboardSkeletonLine className="h-4 w-full rounded-full" />
                <DashboardSkeletonLine className="h-4 w-4/5 rounded-full" />
              </div>
            </div>
            <DashboardSkeletonLine className="mt-5 h-11 w-full rounded-full" />
            <DashboardSkeletonLine className="mt-3 h-3 w-28 rounded-full" />
          </DashboardCardSkeleton>
        </aside>
      </div>
    </div>
  );
}

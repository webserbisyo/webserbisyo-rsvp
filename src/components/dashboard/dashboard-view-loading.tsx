"use client";

import {
  DashboardCardSkeleton,
  DashboardSkeletonBlock,
  DashboardSkeletonCircle,
  DashboardSkeletonLine,
  DashboardStatsSkeleton,
  DashboardTableSkeleton,
} from "@/components/dashboard/skeletons";
import type { DashboardView } from "@/lib/dashboard/dashboard-routes";

type DashboardViewLoadingProps = {
  view?: DashboardView;
};

export function DashboardViewLoading({ view = "home" }: DashboardViewLoadingProps) {
  switch (view) {
    case "billing":
      return <BillingLoadingFrame />;
    case "event":
      return <EventLoadingFrame />;
    case "responses":
      return <ResponsesLoadingFrame />;
    case "settings":
      return <SettingsLoadingFrame />;
    case "websiteAccess":
      return <WebsiteAccessLoadingFrame />;
    case "home":
    default:
      return <HomeLoadingFrame />;
  }
}

function HomeLoadingFrame() {
  return (
    <div className="ws-home-page pb-24 md:pb-8">
      <section className="ws-intro">
        <div className="ws-intro-line">
          <DashboardSkeletonLine className="h-4 w-28 rounded-full" />
          <DashboardSkeletonLine className="mt-3 h-9 w-56 rounded-[1.2rem]" />
        </div>
      </section>
      <DashboardCardSkeleton className="min-h-[240px] rounded-[2rem]">
        <div className="grid gap-5 lg:grid-cols-[1fr_1.25fr]">
          <div className="space-y-3">
            <DashboardSkeletonLine className="h-4 w-28 rounded-full" />
            <DashboardSkeletonLine className="h-10 w-52 rounded-[1.2rem]" />
            <DashboardSkeletonLine className="h-4 w-44 rounded-full" />
          </div>
          <DashboardStatsSkeleton count={4} />
        </div>
      </DashboardCardSkeleton>
      <DashboardStatsSkeleton />
    </div>
  );
}

function ResponsesLoadingFrame() {
  return (
    <div className="space-y-6 pt-6 pb-24 md:pb-8">
      <DashboardStatsSkeleton />
      <DashboardTableSkeleton mobileCardCount={2} rowCount={4} />
    </div>
  );
}

function WebsiteAccessLoadingFrame() {
  return (
    <div className="space-y-6 pt-6 pb-24 md:pb-8">
      <DashboardCardSkeleton className="rounded-2xl" contentClassName="px-5 py-4 sm:px-7">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <DashboardSkeletonLine className="h-6 w-36 rounded-full" />
          <DashboardSkeletonLine className="h-10 w-32 rounded-2xl" />
        </div>
      </DashboardCardSkeleton>
      <div className="grid gap-6 xl:grid-cols-2">
        <DashboardCardSkeleton>
          <div className="space-y-4">
            <DashboardSkeletonLine className="h-6 w-32 rounded-full" />
            <DashboardSkeletonBlock className="h-24 w-full rounded-2xl" />
            <DashboardSkeletonBlock className="h-14 w-full rounded-xl" />
          </div>
        </DashboardCardSkeleton>
        <DashboardCardSkeleton>
          <div className="space-y-4">
            <DashboardSkeletonLine className="h-6 w-36 rounded-full" />
            <DashboardSkeletonBlock className="h-24 w-full rounded-2xl" />
            <DashboardSkeletonBlock className="h-14 w-full rounded-xl" />
          </div>
        </DashboardCardSkeleton>
      </div>
    </div>
  );
}

function SettingsLoadingFrame() {
  return (
    <div className="space-y-6 pb-24 pt-2 md:pb-8">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_330px] xl:grid-cols-[minmax(0,1fr)_348px]">
        <div className="space-y-6">
          <DashboardCardSkeleton contentClassName="px-6 py-7 sm:px-7">
            <div className="flex items-center gap-5">
              <DashboardSkeletonCircle className="h-[62px] w-[62px]" />
              <div className="min-w-0 flex-1 space-y-2">
                <DashboardSkeletonLine className="h-8 w-44 rounded-2xl" />
                <DashboardSkeletonLine className="h-4 w-52 rounded-full" />
              </div>
            </div>
          </DashboardCardSkeleton>
          <DashboardCardSkeleton contentClassName="px-6 py-7 sm:px-7">
            <DashboardSkeletonLine className="h-4 w-52 rounded-full" />
            <div className="mt-5 space-y-4">
              {Array.from({ length: 3 }).map((_, index) => (
                <DashboardSkeletonBlock key={index} className="h-14 w-full rounded-2xl" />
              ))}
            </div>
          </DashboardCardSkeleton>
        </div>
        <DashboardCardSkeleton contentClassName="px-6 py-7 sm:px-7">
          <DashboardSkeletonBlock className="h-[72px] w-[72px] rounded-[1.35rem]" />
          <DashboardSkeletonLine className="mt-5 h-7 w-40 rounded-2xl" />
          <DashboardSkeletonLine className="mt-4 h-4 w-full rounded-full" />
        </DashboardCardSkeleton>
      </div>
    </div>
  );
}

function BillingLoadingFrame() {
  return (
    <div className="space-y-6 pb-24 pt-2 md:pb-8">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_330px] xl:grid-cols-[minmax(0,1fr)_348px]">
        <div className="space-y-6">
          <DashboardCardSkeleton contentClassName="px-6 py-7 sm:px-7 sm:py-8">
            <DashboardSkeletonLine className="h-4 w-28 rounded-full" />
            <DashboardSkeletonLine className="mt-4 h-14 w-44 rounded-[1.4rem]" />
            <DashboardSkeletonLine className="mt-4 h-5 w-full rounded-full" />
          </DashboardCardSkeleton>
          <DashboardStatsSkeleton />
        </div>
        <DashboardCardSkeleton contentClassName="px-5 py-5 sm:px-6 sm:py-6">
          <DashboardSkeletonLine className="h-4 w-40 rounded-full" />
          <DashboardSkeletonBlock className="mt-5 h-28 w-full rounded-2xl" />
        </DashboardCardSkeleton>
      </div>
    </div>
  );
}

function EventLoadingFrame() {
  return (
    <div className="event-website-workspace hidden xl:grid">
      <DashboardCardSkeleton className="event-website-status-card" contentClassName="px-4 py-4">
        <DashboardSkeletonLine className="h-6 w-28 rounded-full" />
        <DashboardSkeletonLine className="mt-3 h-4 w-40 rounded-full" />
        <div className="mt-5 space-y-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <DashboardSkeletonBlock key={index} className="h-16 w-full rounded-2xl" />
          ))}
        </div>
      </DashboardCardSkeleton>
      <DashboardCardSkeleton>
        <DashboardSkeletonLine className="h-8 w-48 rounded-2xl" />
        <div className="mt-6 space-y-4">
          {Array.from({ length: 5 }).map((_, index) => (
            <DashboardSkeletonBlock key={index} className="h-12 w-full rounded-2xl" />
          ))}
        </div>
      </DashboardCardSkeleton>
      <DashboardCardSkeleton>
        <DashboardSkeletonBlock className="h-[34rem] w-full rounded-[1.5rem]" />
      </DashboardCardSkeleton>
    </div>
  );
}

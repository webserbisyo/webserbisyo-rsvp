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
      <section className="ws-countdown-hero min-h-[240px]">
        <div className="ws-countdown-overlay" aria-hidden="true" />
        <div className="ws-hero-left space-y-4">
          <DashboardSkeletonLine className="h-4 w-24 rounded-full" />
          <DashboardSkeletonLine className="h-10 w-52 rounded-[1.2rem]" />
          <DashboardSkeletonLine className="h-4 w-40 rounded-full" />
        </div>
        <div className="ws-hero-right">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="ws-count-tile-wrap">
                <DashboardSkeletonBlock className="h-16 w-full rounded-[1.35rem]" />
                <DashboardSkeletonLine className="mx-auto mt-2.5 h-3 w-10 rounded-full" />
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
              {Array.from({ length: 3 }).map((_, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 rounded-2xl border border-[color:var(--dash-border)] bg-white/60 px-4 py-3"
                >
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
              <div className="grid gap-3 sm:grid-cols-2">
                {Array.from({ length: 2 }).map((_, index) => (
                  <DashboardSkeletonLine key={index} className="h-10 w-full rounded-2xl" />
                ))}
              </div>
            </div>
          </DashboardCardSkeleton>

          <DashboardCardSkeleton className="ws-quick-stats">
            <div className="space-y-4">
              <DashboardSkeletonLine className="h-6 w-28 rounded-full" />
              {Array.from({ length: 3 }).map((_, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 rounded-2xl border border-[color:var(--dash-border)] bg-white/55 px-4 py-3"
                >
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

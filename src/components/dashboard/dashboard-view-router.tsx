"use client";

import dynamic from "next/dynamic";
import { DashboardViewLoading } from "@/components/dashboard/dashboard-view-loading";
import { getDashboardViewLoader } from "@/lib/dashboard/dashboard-prefetch";
import type { DashboardView } from "@/lib/dashboard/dashboard-routes";

type DashboardViewRouterProps = {
  searchParams: URLSearchParams;
  view: DashboardView;
};

export type DashboardClientViewProps = {
  searchParams: URLSearchParams;
};

const DashboardHomeView = dynamic(getDashboardViewLoader("home"), {
  loading: () => <DashboardViewLoading view="home" />,
});
const DashboardEventView = dynamic(getDashboardViewLoader("event"), {
  loading: () => <DashboardViewLoading view="event" />,
});
const DashboardResponsesView = dynamic(getDashboardViewLoader("responses"), {
  loading: () => <DashboardViewLoading view="responses" />,
});
const DashboardWebsiteAccessView = dynamic(getDashboardViewLoader("websiteAccess"), {
  loading: () => <DashboardViewLoading view="websiteAccess" />,
});
const DashboardBillingView = dynamic(getDashboardViewLoader("billing"), {
  loading: () => <DashboardViewLoading view="billing" />,
});
const DashboardSettingsView = dynamic(getDashboardViewLoader("settings"), {
  loading: () => <DashboardViewLoading view="settings" />,
});

export function DashboardViewRouter({ searchParams, view }: DashboardViewRouterProps) {
  switch (view) {
    case "billing":
      return <DashboardBillingView searchParams={searchParams} />;
    case "event":
      return <DashboardEventView searchParams={searchParams} />;
    case "responses":
      return <DashboardResponsesView searchParams={searchParams} />;
    case "settings":
      return <DashboardSettingsView searchParams={searchParams} />;
    case "websiteAccess":
      return <DashboardWebsiteAccessView searchParams={searchParams} />;
    case "home":
    default:
      return <DashboardHomeView searchParams={searchParams} />;
  }
}

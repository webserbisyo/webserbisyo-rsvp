"use client";

import type { QueryClient } from "@tanstack/react-query";
import type { ComponentType } from "react";
import { prefetchDashboardViewQuery } from "./dashboard-queries";
import type { DashboardView } from "./dashboard-routes";

type DashboardViewModule = {
  default: ComponentType<{
    searchParams: URLSearchParams;
  }>;
};

const dashboardViewLoaders: Record<DashboardView, () => Promise<DashboardViewModule>> = {
  billing: () => import("@/components/dashboard/views/dashboard-billing-view"),
  event: () => import("@/components/dashboard/views/dashboard-event-view"),
  home: () => import("@/components/dashboard/views/dashboard-home-view"),
  responses: () => import("@/components/dashboard/views/dashboard-responses-view"),
  settings: () => import("@/components/dashboard/views/dashboard-settings-view"),
  websiteAccess: () => import("@/components/dashboard/views/dashboard-website-access-view"),
};

export function preloadDashboardView(view: DashboardView) {
  return dashboardViewLoaders[view]();
}

export function prefetchDashboardView(queryClient: QueryClient, view: DashboardView) {
  return prefetchDashboardViewQuery(queryClient, view);
}

export function getDashboardViewLoader(view: DashboardView) {
  return dashboardViewLoaders[view];
}

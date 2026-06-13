"use client";

import type { QueryClient, UseQueryOptions } from "@tanstack/react-query";
import { queryOptions, useQuery } from "@tanstack/react-query";
import type {
  DashboardBillingDto,
  DashboardBootstrapDto,
  DashboardEventDto,
  DashboardHomeDto,
  DashboardResponsesDto,
  DashboardSettingsDto,
  DashboardWebsiteAccessDto,
} from "./dashboard-dtos";
import { fetchDashboardDto } from "./dashboard-fetch";
import { dashboardKeys } from "./dashboard-query-keys";
import type { DashboardView } from "./dashboard-routes";

const DASHBOARD_API = {
  billing: "/api/dashboard/billing",
  bootstrap: "/api/dashboard/bootstrap",
  event: "/api/dashboard/event",
  home: "/api/dashboard/home",
  responses: "/api/dashboard/responses",
  settings: "/api/dashboard/settings",
  websiteAccess: "/api/dashboard/website-access",
} as const;

export function dashboardBootstrapQueryOptions() {
  return queryOptions({
    queryFn: () => fetchDashboardDto<DashboardBootstrapDto>(DASHBOARD_API.bootstrap),
    queryKey: dashboardKeys.bootstrap(),
    staleTime: 5 * 60_000,
  });
}

export function dashboardHomeQueryOptions() {
  return queryOptions({
    queryFn: () => fetchDashboardDto<DashboardHomeDto>(DASHBOARD_API.home),
    queryKey: dashboardKeys.home(),
    staleTime: 30_000,
  });
}

export function dashboardEventQueryOptions() {
  return queryOptions({
    queryFn: () => fetchDashboardDto<DashboardEventDto>(DASHBOARD_API.event),
    queryKey: dashboardKeys.event(),
    staleTime: 30_000,
  });
}

export function dashboardResponsesQueryOptions() {
  return queryOptions({
    queryFn: () => fetchDashboardDto<DashboardResponsesDto>(DASHBOARD_API.responses),
    queryKey: dashboardKeys.responses(),
    staleTime: 15_000,
  });
}

export function dashboardWebsiteAccessQueryOptions() {
  return queryOptions({
    queryFn: () => fetchDashboardDto<DashboardWebsiteAccessDto>(DASHBOARD_API.websiteAccess),
    queryKey: dashboardKeys.websiteAccess(),
    staleTime: 30_000,
  });
}

export function dashboardBillingQueryOptions() {
  return queryOptions({
    queryFn: () => fetchDashboardDto<DashboardBillingDto>(DASHBOARD_API.billing),
    queryKey: dashboardKeys.billing(),
    staleTime: 60_000,
  });
}

export function dashboardSettingsQueryOptions() {
  return queryOptions({
    queryFn: () => fetchDashboardDto<DashboardSettingsDto>(DASHBOARD_API.settings),
    queryKey: dashboardKeys.settings(),
    staleTime: 60_000,
  });
}

export function useDashboardBootstrapQuery() {
  return useQuery(dashboardBootstrapQueryOptions());
}

export function useDashboardHomeQuery() {
  return useQuery(withPreviousData(dashboardHomeQueryOptions()));
}

export function useDashboardEventQuery() {
  return useQuery(withPreviousData(dashboardEventQueryOptions()));
}

export function useDashboardResponsesQuery() {
  return useQuery(withPreviousData(dashboardResponsesQueryOptions()));
}

export function useDashboardWebsiteAccessQuery() {
  return useQuery(withPreviousData(dashboardWebsiteAccessQueryOptions()));
}

export function useDashboardBillingQuery() {
  return useQuery(withPreviousData(dashboardBillingQueryOptions()));
}

export function useDashboardSettingsQuery() {
  return useQuery(withPreviousData(dashboardSettingsQueryOptions()));
}

export function prefetchDashboardViewQuery(queryClient: QueryClient, view: DashboardView) {
  switch (view) {
    case "billing":
      return queryClient.prefetchQuery(dashboardBillingQueryOptions());
    case "event":
      return queryClient.prefetchQuery(dashboardEventQueryOptions());
    case "responses":
      return queryClient.prefetchQuery(dashboardResponsesQueryOptions());
    case "settings":
      return queryClient.prefetchQuery(dashboardSettingsQueryOptions());
    case "websiteAccess":
      return queryClient.prefetchQuery(dashboardWebsiteAccessQueryOptions());
    case "home":
    default:
      return queryClient.prefetchQuery(dashboardHomeQueryOptions());
  }
}

function withPreviousData<TQueryFnData, TError, TData, TQueryKey extends readonly unknown[]>(
  options: UseQueryOptions<TQueryFnData, TError, TData, TQueryKey>,
) {
  return {
    ...options,
    placeholderData: (previousData: TData | undefined) => previousData,
  };
}

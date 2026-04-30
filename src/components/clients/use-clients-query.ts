"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useSearchParams, type ReadonlyURLSearchParams } from "next/navigation";
import { fetchAdminClientsAction } from "@/server/actions/admin-clients-query";
import type { AdminClientsSearchParams, ClientListResult } from "@/server/queries/admin-clients";

export const ADMIN_CLIENTS_QUERY_KEY = ["clients"] as const;

const LIST_PARAM_KEYS = [
  "status",
  "plan",
  "payment",
  "hosting",
  "event",
  "search",
  "eventFrom",
  "eventTo",
  "hostingEndsFrom",
  "hostingEndsTo",
  "approvedFrom",
  "approvedTo",
  "sort",
  "page",
] as const;

export function useClientsQuery(
  initialData: ClientListResult,
  initialFilters: AdminClientsSearchParams,
  initialListSearch: string,
) {
  const searchParams = useSearchParams();
  const listSearch = getAdminClientsListSearch(searchParams);
  const paramsObject = Object.fromEntries(new URLSearchParams(listSearch).entries());

  const query = useQuery({
    queryKey: [...ADMIN_CLIENTS_QUERY_KEY, listSearch],
    queryFn: async () => {
      const result = await fetchAdminClientsAction(paramsObject);

      if (!result.ok) {
        throw new Error(result.error);
      }

      return result.data;
    },
    initialData: listSearch === initialListSearch ? initialData : undefined,
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });

  return {
    ...query,
    filters: getFilterStateFromSearch(listSearch, initialFilters),
    listSearch,
  };
}

function getAdminClientsListSearch(searchParams: ReadonlyURLSearchParams) {
  const params = new URLSearchParams();

  for (const key of LIST_PARAM_KEYS) {
    const value = searchParams.get(key);

    if (value) {
      params.set(key, value);
    }
  }

  return params.toString();
}

function getFilterStateFromSearch(
  listSearch: string,
  initialFilters: AdminClientsSearchParams,
): AdminClientsSearchParams {
  const params = new URLSearchParams(listSearch);

  return {
    approvedFrom: params.get("approvedFrom") ?? initialFilters.approvedFrom,
    approvedTo: params.get("approvedTo") ?? initialFilters.approvedTo,
    event: (params.get("event") as AdminClientsSearchParams["event"]) ?? initialFilters.event,
    eventFrom: params.get("eventFrom") ?? initialFilters.eventFrom,
    eventTo: params.get("eventTo") ?? initialFilters.eventTo,
    hosting:
      (params.get("hosting") as AdminClientsSearchParams["hosting"]) ?? initialFilters.hosting,
    hostingEndsFrom: params.get("hostingEndsFrom") ?? initialFilters.hostingEndsFrom,
    hostingEndsTo: params.get("hostingEndsTo") ?? initialFilters.hostingEndsTo,
    page: parsePage(params.get("page")) ?? initialFilters.page,
    payment:
      (params.get("payment") as AdminClientsSearchParams["payment"]) ?? initialFilters.payment,
    plan: (params.get("plan") as AdminClientsSearchParams["plan"]) ?? initialFilters.plan,
    search: params.get("search") ?? initialFilters.search,
    sort: (params.get("sort") as AdminClientsSearchParams["sort"]) ?? initialFilters.sort,
    status: (params.get("status") as AdminClientsSearchParams["status"]) ?? initialFilters.status,
  };
}

function parsePage(value: string | null) {
  if (!value) {
    return null;
  }

  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) || parsed < 1 ? null : parsed;
}

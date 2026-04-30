"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useSearchParams, type ReadonlyURLSearchParams } from "next/navigation";
import { fetchAdminApplicationsAction } from "@/server/actions/admin-applications-query";
import type {
  AdminApplicationsSearchParams,
  ApplicationListResult,
} from "@/server/queries/admin-applications";

export const ADMIN_APPLICATIONS_QUERY_KEY = ["applications"] as const;

const LIST_PARAM_KEYS = [
  "status",
  "plan",
  "payment",
  "search",
  "submittedFrom",
  "submittedTo",
  "eventFrom",
  "eventTo",
  "sort",
  "page",
] as const;

export function useApplicationsQuery(
  initialData: ApplicationListResult,
  initialFilters: AdminApplicationsSearchParams,
  initialListSearch: string,
) {
  const searchParams = useSearchParams();
  const listSearch = getAdminApplicationsListSearch(searchParams);
  const paramsObject = Object.fromEntries(new URLSearchParams(listSearch).entries());

  const query = useQuery({
    queryKey: [...ADMIN_APPLICATIONS_QUERY_KEY, listSearch],
    queryFn: async () => {
      const result = await fetchAdminApplicationsAction(paramsObject);
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

function getAdminApplicationsListSearch(searchParams: ReadonlyURLSearchParams) {
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
  initialFilters: AdminApplicationsSearchParams,
): AdminApplicationsSearchParams {
  const params = new URLSearchParams(listSearch);

  return {
    eventFrom: params.get("eventFrom") ?? initialFilters.eventFrom,
    eventTo: params.get("eventTo") ?? initialFilters.eventTo,
    page: parsePage(params.get("page")) ?? initialFilters.page,
    payment:
      (params.get("payment") as AdminApplicationsSearchParams["payment"]) ?? initialFilters.payment,
    plan: (params.get("plan") as AdminApplicationsSearchParams["plan"]) ?? initialFilters.plan,
    search: params.get("search") ?? initialFilters.search,
    sort: (params.get("sort") as AdminApplicationsSearchParams["sort"]) ?? initialFilters.sort,
    status:
      (params.get("status") as AdminApplicationsSearchParams["status"]) ?? initialFilters.status,
    submittedFrom: params.get("submittedFrom") ?? initialFilters.submittedFrom,
    submittedTo: params.get("submittedTo") ?? initialFilters.submittedTo,
  };
}

function parsePage(value: string | null) {
  if (!value) {
    return null;
  }

  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) || parsed < 1 ? null : parsed;
}

import Link from "next/link";
import type { AdminClientsSearchParams } from "@/server/queries/admin-clients";
import {
  PARAM_APPROVED_FROM,
  PARAM_APPROVED_TO,
  PARAM_EVENT,
  PARAM_EVENT_FROM,
  PARAM_EVENT_TO,
  PARAM_HOSTING,
  PARAM_HOSTING_ENDS_FROM,
  PARAM_HOSTING_ENDS_TO,
  PARAM_PAGE,
  PARAM_PAYMENT,
  PARAM_PLAN,
  PARAM_SEARCH,
  PARAM_SORT,
  PARAM_STATUS,
} from "@/server/queries/admin-clients";
import { Button } from "@/components/ui/button";

type ClientsPaginationProps = {
  filters: AdminClientsSearchParams;
  page: number;
  pageCount: number;
  pageSize: number;
  total: number;
};

export function ClientsPagination({
  filters,
  page,
  pageCount,
  pageSize,
  total,
}: ClientsPaginationProps) {
  const firstItem = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const lastItem = total === 0 ? 0 : Math.min(page * pageSize, total);
  const hasPreviousPage = page > 1;
  const hasNextPage = page < pageCount;

  return (
    <div className="bg-card flex flex-col gap-3 rounded-lg border px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between">
      <p className="text-muted-foreground">
        Showing {firstItem}-{lastItem} of {total}
      </p>
      <div className="flex items-center justify-between gap-3 sm:justify-end">
        <p className="text-muted-foreground">
          Page {page} of {pageCount}
        </p>
        <div className="flex gap-2">
          {hasPreviousPage ? (
            <Button asChild size="sm" variant="outline">
              <Link href={buildPageHref(filters, page - 1)}>Previous</Link>
            </Button>
          ) : (
            <Button disabled size="sm" variant="outline">
              Previous
            </Button>
          )}
          {hasNextPage ? (
            <Button asChild size="sm" variant="outline">
              <Link href={buildPageHref(filters, page + 1)}>Next</Link>
            </Button>
          ) : (
            <Button disabled size="sm" variant="outline">
              Next
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function buildPageHref(filters: AdminClientsSearchParams, page: number) {
  const params = new URLSearchParams();

  setIfPresent(params, PARAM_STATUS, filters.status, "all");
  setIfPresent(params, PARAM_PLAN, filters.plan, "all");
  setIfPresent(params, PARAM_PAYMENT, filters.payment, "all");
  setIfPresent(params, PARAM_HOSTING, filters.hosting, "all");
  setIfPresent(params, PARAM_EVENT, filters.event, "all");
  setIfPresent(params, PARAM_SEARCH, filters.search, "");
  setIfPresent(params, PARAM_EVENT_FROM, filters.eventFrom, "");
  setIfPresent(params, PARAM_EVENT_TO, filters.eventTo, "");
  setIfPresent(params, PARAM_HOSTING_ENDS_FROM, filters.hostingEndsFrom, "");
  setIfPresent(params, PARAM_HOSTING_ENDS_TO, filters.hostingEndsTo, "");
  setIfPresent(params, PARAM_APPROVED_FROM, filters.approvedFrom, "");
  setIfPresent(params, PARAM_APPROVED_TO, filters.approvedTo, "");
  setIfPresent(params, PARAM_SORT, filters.sort, "updated_desc");

  if (page > 1) {
    params.set(PARAM_PAGE, String(page));
  }

  const queryString = params.toString();
  return queryString ? `/admin/clients?${queryString}` : "/admin/clients";
}

function setIfPresent(params: URLSearchParams, key: string, value: string, defaultValue: string) {
  if (value && value !== defaultValue) {
    params.set(key, value);
  }
}

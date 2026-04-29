import Link from "next/link";
import type { AdminSalesSearchParams } from "@/server/queries/admin-sales";
import {
  SALES_PARAM_PAGE,
  SALES_PARAM_PLAN,
  SALES_PARAM_SORT,
  SALES_PARAM_STATUS,
} from "@/server/queries/admin-sales";
import { Button } from "@/components/ui/button";

type SalesPaginationProps = {
  filters: AdminSalesSearchParams;
  page: number;
  pageCount: number;
  pageSize: number;
  total: number;
};

export function SalesPagination({
  filters,
  page,
  pageCount,
  pageSize,
  total,
}: SalesPaginationProps) {
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

function buildPageHref(filters: AdminSalesSearchParams, page: number) {
  const params = new URLSearchParams();

  setIfPresent(params, SALES_PARAM_PLAN, filters.plan, "all");
  setIfPresent(params, SALES_PARAM_STATUS, filters.status, "all");
  setIfPresent(params, SALES_PARAM_SORT, filters.sort, "created_desc");

  if (page > 1) {
    params.set(SALES_PARAM_PAGE, String(page));
  }

  const queryString = params.toString();
  return queryString ? `/admin/sales?${queryString}` : "/admin/sales";
}

function setIfPresent(params: URLSearchParams, key: string, value: string, defaultValue: string) {
  if (value && value !== defaultValue) {
    params.set(key, value);
  }
}

"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { SlidersHorizontal, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type SalesFilterBarProps = {
  filters: {
    plan: string;
    sort: string;
    status: string;
  };
};

const PARAM_PLAN = "plan";
const PARAM_SORT = "sort";
const PARAM_STATUS = "status";
const PARAM_PAGE = "page";

const planOptions = [
  { label: "All plans", value: "all" },
  { label: "Pro", value: "pro" },
  { label: "Max", value: "max" },
];

const statusOptions = [
  { label: "All statuses", value: "all" },
  { label: "Pending", value: "pending" },
  { label: "Paid", value: "paid" },
  { label: "Failed", value: "failed" },
  { label: "Refunded", value: "refunded" },
  { label: "Cancelled", value: "cancelled" },
];

const sortOptions = [
  { label: "Newest created", value: "created_desc" },
  { label: "Most recently paid", value: "paid_desc" },
  { label: "Highest amount due", value: "amount_desc" },
  { label: "Lowest amount due", value: "amount_asc" },
];

export function SalesFilterBar({ filters }: SalesFilterBarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const hasActiveFilters =
    filters.plan !== "all" || filters.status !== "all" || filters.sort !== "created_desc";

  function replaceParam(key: string, value: string, defaultValue: string) {
    const params = new URLSearchParams(searchParams.toString());

    if (value && value !== defaultValue) {
      params.set(key, value);
    } else {
      params.delete(key);
    }

    params.delete(PARAM_PAGE);

    const queryString = params.toString();
    router.replace(queryString ? `${pathname}?${queryString}` : pathname);
  }

  function clearFilters() {
    router.replace(pathname);
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <SlidersHorizontal className="text-muted-foreground size-4" />
        <p className="text-sm font-medium">Payment filters</p>
      </div>

      <div className="grid gap-3 lg:grid-cols-3 xl:grid-cols-[repeat(3,minmax(0,12rem))_auto]">
        <Select
          value={filters.plan}
          onValueChange={(value) => replaceParam(PARAM_PLAN, value, "all")}
        >
          <SelectTrigger className="h-10 w-full" aria-label="Filter sales by plan">
            <SelectValue placeholder="Plan" />
          </SelectTrigger>
          <SelectContent>
            {planOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.status}
          onValueChange={(value) => replaceParam(PARAM_STATUS, value, "all")}
        >
          <SelectTrigger className="h-10 w-full" aria-label="Filter sales by status">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            {statusOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.sort}
          onValueChange={(value) => replaceParam(PARAM_SORT, value, "created_desc")}
        >
          <SelectTrigger className="h-10 w-full" aria-label="Sort payments">
            <SelectValue placeholder="Sort" />
          </SelectTrigger>
          <SelectContent>
            {sortOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button type="button" variant="ghost" disabled={!hasActiveFilters} onClick={clearFilters}>
          <X className="size-4" />
          Clear filters
        </Button>
      </div>
    </div>
  );
}

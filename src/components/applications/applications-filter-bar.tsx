"use client";

import { useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { CalendarRange, Search, SlidersHorizontal, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type ApplicationsFilterBarProps = {
  filters: {
    eventFrom: string;
    eventTo: string;
    payment: string;
    plan: string;
    search: string;
    sort: string;
    status: string;
    submittedFrom: string;
    submittedTo: string;
  };
};

const PARAM_PLAN = "plan";
const PARAM_PAYMENT = "payment";
const PARAM_SEARCH = "search";
const PARAM_SUBMITTED_FROM = "submittedFrom";
const PARAM_SUBMITTED_TO = "submittedTo";
const PARAM_EVENT_FROM = "eventFrom";
const PARAM_EVENT_TO = "eventTo";
const PARAM_SORT = "sort";
const PARAM_PAGE = "page";

const DEFAULT_PLAN = "all";
const DEFAULT_PAYMENT = "all";
const DEFAULT_SORT = "submitted_desc";
const SEARCH_DEBOUNCE_MS = 300;

const planOptions = [
  { label: "All plans", value: "all" },
  { label: "Pro", value: "pro" },
  { label: "Max", value: "max" },
];

const paymentOptions = [
  { label: "All payment prefs", value: "all" },
  { label: "GCash", value: "gcash" },
  { label: "Maya", value: "maya" },
  { label: "Not selected", value: "not_selected" },
];

const sortOptions = [
  { label: "Newest submitted", value: "submitted_desc" },
  { label: "Oldest submitted", value: "submitted_asc" },
  { label: "Recently updated", value: "updated_desc" },
  { label: "Event date soonest", value: "event_date_asc" },
];

export function ApplicationsFilterBar({ filters }: ApplicationsFilterBarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const advancedFilterCount = getAdvancedFilterCount(filters);
  const hasActiveFilters = hasNonDefaultFilters(filters);
  const [showAdvanced, setShowAdvanced] = useState(advancedFilterCount > 0);
  const searchTimeoutRef = useRef<number | null>(null);

  function clearFilters() {
    setShowAdvanced(false);

    if (searchTimeoutRef.current !== null) {
      window.clearTimeout(searchTimeoutRef.current);
      searchTimeoutRef.current = null;
    }

    const params = new URLSearchParams(searchParams.toString());

    params.delete(PARAM_PLAN);
    params.delete(PARAM_PAYMENT);
    params.delete(PARAM_SEARCH);
    params.delete(PARAM_SUBMITTED_FROM);
    params.delete(PARAM_SUBMITTED_TO);
    params.delete(PARAM_EVENT_FROM);
    params.delete(PARAM_EVENT_TO);
    params.delete(PARAM_SORT);
    params.delete(PARAM_PAGE);

    const queryString = params.toString();
    router.replace(queryString ? `${pathname}?${queryString}` : pathname);
  }

  return (
    <div className="space-y-3">
      <div className="flex min-w-0 flex-col gap-3 xl:flex-row xl:items-center">
        <div className="relative min-w-0 flex-1">
          <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
          <Input
            key={filters.search}
            aria-label="Search applicants"
            className="h-10 pl-9"
            defaultValue={filters.search}
            onChange={(event) => {
              if (searchTimeoutRef.current !== null) {
                window.clearTimeout(searchTimeoutRef.current);
              }

              const nextValue = event.currentTarget.value;

              searchTimeoutRef.current = window.setTimeout(() => {
                replaceParam({
                  currentSearch: searchParams.toString(),
                  defaultValue: "",
                  key: PARAM_SEARCH,
                  pathname,
                  router,
                  value: nextValue.trim(),
                });
              }, SEARCH_DEBOUNCE_MS);
            }}
            placeholder="Search name, email, phone, event"
          />
        </div>
        <Button
          type="button"
          variant="outline"
          className="sm:w-auto"
          onClick={() => setShowAdvanced((current) => !current)}
        >
          <SlidersHorizontal className="size-4" />
          {showAdvanced ? "Hide advanced filters" : "Advanced filters"}
          {advancedFilterCount > 0 ? ` (${advancedFilterCount})` : ""}
        </Button>
      </div>

      <div className="grid gap-3 lg:grid-cols-2 xl:grid-cols-[repeat(3,minmax(0,12rem))_auto]">
        <Select
          value={filters.plan}
          onValueChange={(value) =>
            replaceParam({
              currentSearch: searchParams.toString(),
              defaultValue: DEFAULT_PLAN,
              key: PARAM_PLAN,
              pathname,
              router,
              value,
            })
          }
        >
          <SelectTrigger aria-label="Filter by plan" className="h-10 w-full">
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
          value={filters.payment}
          onValueChange={(value) =>
            replaceParam({
              currentSearch: searchParams.toString(),
              defaultValue: DEFAULT_PAYMENT,
              key: PARAM_PAYMENT,
              pathname,
              router,
              value,
            })
          }
        >
          <SelectTrigger aria-label="Filter by payment preference" className="h-10 w-full">
            <SelectValue placeholder="Payment" />
          </SelectTrigger>
          <SelectContent>
            {paymentOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.sort}
          onValueChange={(value) =>
            replaceParam({
              currentSearch: searchParams.toString(),
              defaultValue: DEFAULT_SORT,
              key: PARAM_SORT,
              pathname,
              router,
              value,
            })
          }
        >
          <SelectTrigger aria-label="Sort applications" className="h-10 w-full">
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

        <Button
          type="button"
          variant="ghost"
          className="xl:justify-self-start"
          disabled={!hasActiveFilters}
          onClick={clearFilters}
        >
          <X className="size-4" />
          Clear filters
        </Button>
      </div>

      {showAdvanced ? (
        <section className="bg-muted/20 space-y-4 rounded-lg border border-dashed p-4">
          <div className="flex items-center gap-2">
            <CalendarRange className="text-muted-foreground size-4" />
            <p className="text-sm font-medium">Advanced filters</p>
          </div>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <FilterDateField
              id={PARAM_SUBMITTED_FROM}
              label="Submitted from"
              pathname={pathname}
              search={searchParams.toString()}
              value={filters.submittedFrom}
            />
            <FilterDateField
              id={PARAM_SUBMITTED_TO}
              label="Submitted to"
              pathname={pathname}
              search={searchParams.toString()}
              value={filters.submittedTo}
            />
            <FilterDateField
              id={PARAM_EVENT_FROM}
              label="Event from"
              pathname={pathname}
              search={searchParams.toString()}
              value={filters.eventFrom}
            />
            <FilterDateField
              id={PARAM_EVENT_TO}
              label="Event to"
              pathname={pathname}
              search={searchParams.toString()}
              value={filters.eventTo}
            />
          </div>
        </section>
      ) : null}
    </div>
  );
}

function FilterDateField({
  id,
  label,
  pathname,
  search,
  value,
}: {
  id: string;
  label: string;
  pathname: string;
  search: string;
  value: string;
}) {
  const router = useRouter();

  return (
    <div className="min-w-0 space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        aria-label={label}
        className="h-10"
        value={value}
        onChange={(event) =>
          replaceParam({
            currentSearch: search,
            defaultValue: "",
            key: id,
            pathname,
            router,
            value: event.currentTarget.value,
          })
        }
        type="date"
      />
    </div>
  );
}

function replaceParam({
  currentSearch,
  defaultValue = "",
  key,
  pathname,
  router,
  value,
}: {
  currentSearch: string;
  defaultValue?: string;
  key: string;
  pathname: string;
  router: ReturnType<typeof useRouter>;
  value: string;
}) {
  const params = new URLSearchParams(currentSearch);
  const currentValue = params.get(key) ?? "";

  if ((value || "") === currentValue || (!value && currentValue === defaultValue)) {
    return;
  }

  if (value && value !== defaultValue) {
    params.set(key, value);
  } else {
    params.delete(key);
  }

  params.delete(PARAM_PAGE);

  const queryString = params.toString();
  router.replace(queryString ? `${pathname}?${queryString}` : pathname);
}

function getAdvancedFilterCount(filters: ApplicationsFilterBarProps["filters"]) {
  return [filters.submittedFrom, filters.submittedTo, filters.eventFrom, filters.eventTo].filter(
    Boolean,
  ).length;
}

function hasNonDefaultFilters(filters: ApplicationsFilterBarProps["filters"]) {
  return (
    filters.plan !== DEFAULT_PLAN ||
    filters.status !== "all" ||
    filters.payment !== DEFAULT_PAYMENT ||
    filters.search !== "" ||
    filters.sort !== DEFAULT_SORT ||
    filters.submittedFrom !== "" ||
    filters.submittedTo !== "" ||
    filters.eventFrom !== "" ||
    filters.eventTo !== ""
  );
}

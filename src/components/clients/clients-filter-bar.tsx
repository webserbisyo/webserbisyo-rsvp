"use client";

import { useState, type FormEvent } from "react";
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

type ClientsFilterBarProps = {
  filters: {
    approvedFrom: string;
    approvedTo: string;
    event: string;
    eventFrom: string;
    eventTo: string;
    hosting: string;
    hostingEndsFrom: string;
    hostingEndsTo: string;
    payment: string;
    plan: string;
    search: string;
    sort: string;
    status: string;
  };
};

const PARAM_PLAN = "plan";
const PARAM_PAYMENT = "payment";
const PARAM_SEARCH = "search";
const PARAM_EVENT_FROM = "eventFrom";
const PARAM_EVENT_TO = "eventTo";
const PARAM_HOSTING_ENDS_FROM = "hostingEndsFrom";
const PARAM_HOSTING_ENDS_TO = "hostingEndsTo";
const PARAM_APPROVED_FROM = "approvedFrom";
const PARAM_APPROVED_TO = "approvedTo";
const PARAM_SORT = "sort";
const PARAM_PAGE = "page";

const DEFAULT_PLAN = "all";
const DEFAULT_PAYMENT = "all";
const DEFAULT_SORT = "updated_desc";

const planOptions = [
  { label: "All plans", value: "all" },
  { label: "Pro", value: "pro" },
  { label: "Max", value: "max" },
];

const paymentOptions = [
  { label: "All payment states", value: "all" },
  { label: "Paid", value: "paid" },
  { label: "Pending", value: "pending" },
  { label: "Failed", value: "failed" },
  { label: "None", value: "none" },
];

const sortOptions = [
  { label: "Recently updated", value: "updated_desc" },
  { label: "Newest approved", value: "approved_desc" },
  { label: "Event date soonest", value: "event_date_asc" },
  { label: "Hosting ending soon", value: "hosting_ends_asc" },
  { label: "Client name A-Z", value: "client_name_asc" },
];

export function ClientsFilterBar({ filters }: ClientsFilterBarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const advancedFilterCount = getAdvancedFilterCount(filters);
  const hasActiveFilters = hasNonDefaultFilters(filters);
  const [showAdvanced, setShowAdvanced] = useState(advancedFilterCount > 0);

  function replaceParam(key: string, value: string, defaultValue = "") {
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
    setShowAdvanced(false);
    router.replace(pathname);
  }

  function handleSearchSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    replaceParam(PARAM_SEARCH, String(formData.get(PARAM_SEARCH) ?? "").trim());
  }

  return (
    <div className="space-y-3">
      <form
        onSubmit={handleSearchSubmit}
        className="flex min-w-0 flex-col gap-3 xl:flex-row xl:items-center"
      >
        <div className="relative min-w-0 flex-1">
          <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
          <Input
            aria-label="Search clients"
            className="h-10 pl-9"
            defaultValue={filters.search}
            name={PARAM_SEARCH}
            placeholder="Search client, email, phone, event, slug, reference"
          />
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button type="submit" variant="outline" className="sm:w-auto">
            Search
          </Button>
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
      </form>

      <div className="grid gap-3 lg:grid-cols-2 xl:grid-cols-[repeat(3,minmax(0,12rem))_auto]">
        <Select
          value={filters.plan}
          onValueChange={(value) => replaceParam(PARAM_PLAN, value, DEFAULT_PLAN)}
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
          onValueChange={(value) => replaceParam(PARAM_PAYMENT, value, DEFAULT_PAYMENT)}
        >
          <SelectTrigger aria-label="Filter by payment status" className="h-10 w-full">
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
          onValueChange={(value) => replaceParam(PARAM_SORT, value, DEFAULT_SORT)}
        >
          <SelectTrigger aria-label="Sort clients" className="h-10 w-full">
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
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            <FilterDateField
              id={PARAM_EVENT_FROM}
              label="Event date from"
              value={filters.eventFrom}
              onChange={(value) => replaceParam(PARAM_EVENT_FROM, value)}
            />
            <FilterDateField
              id={PARAM_EVENT_TO}
              label="Event date to"
              value={filters.eventTo}
              onChange={(value) => replaceParam(PARAM_EVENT_TO, value)}
            />
            <FilterDateField
              id={PARAM_HOSTING_ENDS_FROM}
              label="Hosting end from"
              value={filters.hostingEndsFrom}
              onChange={(value) => replaceParam(PARAM_HOSTING_ENDS_FROM, value)}
            />
            <FilterDateField
              id={PARAM_HOSTING_ENDS_TO}
              label="Hosting end to"
              value={filters.hostingEndsTo}
              onChange={(value) => replaceParam(PARAM_HOSTING_ENDS_TO, value)}
            />
            <FilterDateField
              id={PARAM_APPROVED_FROM}
              label="Approved date from"
              value={filters.approvedFrom}
              onChange={(value) => replaceParam(PARAM_APPROVED_FROM, value)}
            />
            <FilterDateField
              id={PARAM_APPROVED_TO}
              label="Approved date to"
              value={filters.approvedTo}
              onChange={(value) => replaceParam(PARAM_APPROVED_TO, value)}
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
  onChange,
  value,
}: {
  id: string;
  label: string;
  onChange: (value: string) => void;
  value: string;
}) {
  return (
    <div className="min-w-0 space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        aria-label={label}
        className="h-10"
        defaultValue={value}
        onChange={(event) => onChange(event.currentTarget.value)}
        type="date"
      />
    </div>
  );
}

function getAdvancedFilterCount(filters: ClientsFilterBarProps["filters"]) {
  return [
    filters.eventFrom,
    filters.eventTo,
    filters.hostingEndsFrom,
    filters.hostingEndsTo,
    filters.approvedFrom,
    filters.approvedTo,
  ].filter(Boolean).length;
}

function hasNonDefaultFilters(filters: ClientsFilterBarProps["filters"]) {
  return (
    filters.status !== "all" ||
    filters.plan !== "all" ||
    filters.payment !== "all" ||
    filters.hosting !== "all" ||
    filters.event !== "all" ||
    filters.search !== "" ||
    filters.eventFrom !== "" ||
    filters.eventTo !== "" ||
    filters.hostingEndsFrom !== "" ||
    filters.hostingEndsTo !== "" ||
    filters.approvedFrom !== "" ||
    filters.approvedTo !== "" ||
    filters.sort !== DEFAULT_SORT
  );
}

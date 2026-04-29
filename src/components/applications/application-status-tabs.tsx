import Link from "next/link";
import type {
  AdminApplicationsSearchParams,
  ApplicationStatusCounts,
  ApplicationStatusFilter,
} from "@/server/queries/admin-applications";
import {
  PARAM_EVENT_FROM,
  PARAM_EVENT_TO,
  PARAM_PAYMENT,
  PARAM_PLAN,
  PARAM_SEARCH,
  PARAM_SORT,
  PARAM_STATUS,
  PARAM_SUBMITTED_FROM,
  PARAM_SUBMITTED_TO,
} from "@/server/queries/admin-applications";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type ApplicationStatusTabsProps = {
  counts: ApplicationStatusCounts;
  filters: AdminApplicationsSearchParams;
};

const tabs: Array<{
  label: string;
  value: ApplicationStatusFilter;
}> = [
  { label: "All", value: "all" },
  { label: "Pending", value: "pending" },
];

export function ApplicationStatusTabs({ counts, filters }: ApplicationStatusTabsProps) {
  return (
    <nav aria-label="Application status filters" className="overflow-x-auto">
      <div role="tablist" className="bg-muted inline-flex min-w-max gap-1 rounded-lg p-1">
        {tabs.map((tab) => {
          const isActive = filters.status === tab.value;

          return (
            <Link
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "inline-flex h-8 items-center gap-2 rounded-md px-3 text-sm font-medium whitespace-nowrap transition-colors",
                isActive
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-background/60 hover:text-foreground",
              )}
              href={buildStatusHref(tab.value, filters)}
              key={tab.value}
              role="tab"
            >
              <span>{tab.label}</span>
              <Badge variant="secondary" className="h-5 rounded-md px-1.5 text-xs">
                {counts[tab.value] ?? 0}
              </Badge>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

function buildStatusHref(status: ApplicationStatusFilter, filters: AdminApplicationsSearchParams) {
  const params = new URLSearchParams();

  if (status !== "all") {
    params.set(PARAM_STATUS, status);
  }

  setIfPresent(params, PARAM_PLAN, filters.plan, "all");
  setIfPresent(params, PARAM_PAYMENT, filters.payment, "all");
  setIfPresent(params, PARAM_SEARCH, filters.search, "");
  setIfPresent(params, PARAM_SUBMITTED_FROM, filters.submittedFrom, "");
  setIfPresent(params, PARAM_SUBMITTED_TO, filters.submittedTo, "");
  setIfPresent(params, PARAM_EVENT_FROM, filters.eventFrom, "");
  setIfPresent(params, PARAM_EVENT_TO, filters.eventTo, "");
  setIfPresent(params, PARAM_SORT, filters.sort, "submitted_desc");

  const queryString = params.toString();
  return queryString ? `/admin/applications?${queryString}` : "/admin/applications";
}

function setIfPresent(params: URLSearchParams, key: string, value: string, defaultValue: string) {
  if (value && value !== defaultValue) {
    params.set(key, value);
  }
}

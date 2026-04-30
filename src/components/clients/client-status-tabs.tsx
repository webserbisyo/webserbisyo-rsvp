import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type ClientStatusTabsProps = {
  counts: Record<string, number>;
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

type ClientListStatusFilter =
  | "active"
  | "all"
  | "archived"
  | "cleanup_eligible"
  | "event_passed"
  | "event_soon";

const PARAM_STATUS = "status";
const PARAM_PLAN = "plan";
const PARAM_PAYMENT = "payment";
const PARAM_HOSTING = "hosting";
const PARAM_EVENT = "event";
const PARAM_SEARCH = "search";
const PARAM_EVENT_FROM = "eventFrom";
const PARAM_EVENT_TO = "eventTo";
const PARAM_HOSTING_ENDS_FROM = "hostingEndsFrom";
const PARAM_HOSTING_ENDS_TO = "hostingEndsTo";
const PARAM_APPROVED_FROM = "approvedFrom";
const PARAM_APPROVED_TO = "approvedTo";
const PARAM_SORT = "sort";

const tabs: Array<{
  label: string;
  value: ClientListStatusFilter;
}> = [
  { label: "All", value: "all" },
  { label: "Active", value: "active" },
  { label: "Event Soon", value: "event_soon" },
  { label: "Event Passed", value: "event_passed" },
  { label: "Archived", value: "archived" },
  { label: "Cleanup Eligible", value: "cleanup_eligible" },
];

export function ClientStatusTabs({ counts, filters }: ClientStatusTabsProps) {
  return (
    <nav aria-label="Client lifecycle filters" className="overflow-x-auto">
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

function buildStatusHref(
  status: ClientListStatusFilter,
  filters: ClientStatusTabsProps["filters"],
) {
  const params = new URLSearchParams();

  setIfPresent(params, PARAM_STATUS, status, "all");
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

  const queryString = params.toString();
  return queryString ? `/admin/clients?${queryString}` : "/admin/clients";
}

function setIfPresent(params: URLSearchParams, key: string, value: string, defaultValue: string) {
  if (value && value !== defaultValue) {
    params.set(key, value);
  }
}

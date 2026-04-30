"use client";

import type { ApplicationListResult } from "@/server/queries/admin-applications";
import { ApplicationStatusTabs } from "@/components/applications/application-status-tabs";
import { ApplicationsFilterBar } from "@/components/applications/applications-filter-bar";
import { ApplicationsPagination } from "@/components/applications/applications-pagination";
import { ApplicationsTable } from "@/components/applications/applications-table";
import { ApplicationCardList } from "@/components/applications/application-card-list";
import { ErrorState } from "@/components/feedback/error-state";
import { SectionCard } from "@/components/shared/section-card";
import { Loader2 } from "lucide-react";
import { useApplicationsRealtime } from "@/components/applications/use-applications-realtime";
import type { AdminApplicationsSearchParams } from "@/server/queries/admin-applications";
import { useApplicationsQuery } from "@/components/applications/use-applications-query";

type ApplicationsClientPageProps = {
  initialData: ApplicationListResult;
  initialFilters: AdminApplicationsSearchParams;
  initialListSearch: string;
};

export function ApplicationsClientPage({
  initialData,
  initialFilters,
  initialListSearch,
}: ApplicationsClientPageProps) {
  useApplicationsRealtime();
  const { data, error, filters, isFetching, isPending } = useApplicationsQuery(
    initialData,
    initialFilters,
    initialListSearch,
  );

  const isError = data?.error;
  const items = data?.items ?? [];
  const counts = data?.counts ?? initialData.counts;
  const hasActiveFilters = hasListFilters(filters);

  return (
    <>
      <SectionCard
        title="Application queue"
        description="Status counts reflect all applications. List totals update with your current filters."
      >
        <div className="space-y-4">
          <ApplicationStatusTabs counts={counts} filters={filters} />
          <ApplicationsFilterBar filters={filters} />
        </div>
      </SectionCard>

      {error || isError ? (
        <ErrorState
          title="Applications could not be loaded"
          description="Refresh the page or try again."
        />
      ) : null}

      <div className="relative space-y-4">
        {isPending ? (
          <div className="bg-background/50 absolute inset-0 z-10 flex min-h-[300px] items-center justify-center rounded-lg backdrop-blur-sm">
            <Loader2 className="text-muted-foreground size-8 animate-spin" />
          </div>
        ) : null}

        {isFetching ? (
          <div className="text-muted-foreground flex items-center justify-end gap-2 text-xs">
            <Loader2 className="size-3.5 animate-spin" />
            Refreshing applications
          </div>
        ) : null}

        <ApplicationsTable hasActiveFilters={hasActiveFilters} items={items} />
        <ApplicationCardList hasActiveFilters={hasActiveFilters} items={items} />

        {data && !isError && (
          <>
            <ApplicationsPagination
              filters={filters}
              page={data.page}
              pageCount={data.pageCount}
              pageSize={data.pageSize}
              total={data.total}
            />

            <p className="text-muted-foreground text-xs">
              Last updated {formatDateTime(data.generatedAt)}
            </p>
          </>
        )}
      </div>
    </>
  );
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en-PH", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Manila",
  }).format(new Date(value));
}

function hasListFilters(filters: AdminApplicationsSearchParams) {
  return (
    filters.status !== "pending" ||
    filters.plan !== "all" ||
    filters.payment !== "all" ||
    filters.search !== "" ||
    filters.submittedFrom !== "" ||
    filters.submittedTo !== "" ||
    filters.eventFrom !== "" ||
    filters.eventTo !== ""
  );
}

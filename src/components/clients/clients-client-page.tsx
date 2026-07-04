"use client";

import { Loader2 } from "lucide-react";
import { ClientAccountPurgeTool } from "@/components/clients/client-account-purge-tool";
import { ClientCardList } from "@/components/clients/client-card-list";
import { ClientsFilterBar } from "@/components/clients/clients-filter-bar";
import { ClientsPagination } from "@/components/clients/clients-pagination";
import { ClientStatusTabs } from "@/components/clients/client-status-tabs";
import { ClientsTable } from "@/components/clients/clients-table";
import { ErrorState } from "@/components/feedback/error-state";
import { SectionCard } from "@/components/shared/section-card";
import { useClientsQuery } from "@/components/clients/use-clients-query";
import type { AdminClientsSearchParams, ClientListResult } from "@/server/queries/admin-clients";

type ClientsClientPageProps = {
  initialData: ClientListResult;
  initialFilters: AdminClientsSearchParams;
  initialListSearch: string;
  isPlatformAdmin: boolean;
  packageDefaultAvailability: Record<"max" | "pro", boolean>;
};

export function ClientsClientPage({
  initialData,
  initialFilters,
  initialListSearch,
  isPlatformAdmin,
  packageDefaultAvailability,
}: ClientsClientPageProps) {
  const { data, error, filters, isFetching, isPending } = useClientsQuery(
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
        title="Client lifecycle"
        description="Status counts reflect all approved client records. List totals update with your current filters."
      >
        <div className="space-y-4">
          <ClientStatusTabs counts={counts} filters={filters} />
          <ClientsFilterBar filters={filters} />
        </div>
      </SectionCard>

      {error || isError ? (
        <ErrorState
          title="Clients could not be loaded"
          description="Refresh the page or try again."
        />
      ) : null}

      {isPlatformAdmin ? <ClientAccountPurgeTool /> : null}

      <div className="relative space-y-4">
        {isPending ? (
          <div className="bg-background/50 absolute inset-0 z-10 flex min-h-[300px] items-center justify-center rounded-lg backdrop-blur-sm">
            <Loader2 className="text-muted-foreground size-8 animate-spin" />
          </div>
        ) : null}

        {isFetching ? (
          <div className="text-muted-foreground flex items-center justify-end gap-2 text-xs">
            <Loader2 className="size-3.5 animate-spin" />
            Refreshing clients
          </div>
        ) : null}

        <ClientsTable
          hasActiveFilters={hasActiveFilters}
          items={items}
          isPlatformAdmin={isPlatformAdmin}
          packageDefaultAvailability={packageDefaultAvailability}
        />
        <ClientCardList hasActiveFilters={hasActiveFilters} items={items} />

        {data && !isError ? (
          <>
            <ClientsPagination
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
        ) : null}
      </div>
    </>
  );
}

function hasListFilters(filters: AdminClientsSearchParams) {
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
    filters.approvedTo !== ""
  );
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en-PH", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Manila",
  }).format(new Date(value));
}

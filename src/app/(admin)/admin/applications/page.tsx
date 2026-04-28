import type { Metadata } from "next";
import { requireAdmin } from "@/lib/permissions";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { ApplicationCardList } from "@/components/applications/application-card-list";
import { ApplicationStatusTabs } from "@/components/applications/application-status-tabs";
import { ApplicationsFilterBar } from "@/components/applications/applications-filter-bar";
import { ApplicationsPagination } from "@/components/applications/applications-pagination";
import { ApplicationsTable } from "@/components/applications/applications-table";
import { PageContainer } from "@/components/app-shell/page-container";
import { PageHeader } from "@/components/app-shell/page-header";
import { ErrorState } from "@/components/feedback/error-state";
import { SectionCard } from "@/components/shared/section-card";
import {
  getAdminApplications,
  parseAdminApplicationsSearchParams,
} from "@/server/queries/admin-applications";

type AdminApplicationsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export const metadata: Metadata = {
  robots: {
    follow: false,
    index: false,
  },
  title: "Applications",
};

export default async function AdminApplicationsPage({ searchParams }: AdminApplicationsPageProps) {
  await requireAdmin();

  const supabase = await createServerSupabaseClient();
  const filters = parseAdminApplicationsSearchParams(await searchParams);
  const result = await getAdminApplications(filters, supabase);
  const hasActiveFilters = hasListFilters(filters);

  return (
    <PageContainer>
      <PageHeader
        title="Applications"
        description="Review submitted Pro and Max RSVP website applications before approval and client creation."
      />

      <SectionCard
        title="Application queue"
        description="Status counts reflect all applications. List totals update with your current filters."
      >
        <div className="space-y-4">
          <ApplicationStatusTabs counts={result.counts} filters={filters} />
          <ApplicationsFilterBar
            filters={{
              eventFrom: filters.eventFrom,
              eventTo: filters.eventTo,
              payment: filters.payment,
              plan: filters.plan,
              search: filters.search,
              sort: filters.sort,
              status: filters.status,
              submittedFrom: filters.submittedFrom,
              submittedTo: filters.submittedTo,
            }}
          />
        </div>
      </SectionCard>

      {result.error ? (
        <ErrorState
          title="Applications could not be loaded"
          description="Refresh the page or try again."
        />
      ) : null}

      <ApplicationsTable hasActiveFilters={hasActiveFilters} items={result.items} />
      <ApplicationCardList hasActiveFilters={hasActiveFilters} items={result.items} />

      <ApplicationsPagination
        filters={filters}
        page={result.page}
        pageCount={result.pageCount}
        pageSize={result.pageSize}
        total={result.total}
      />

      <p className="text-muted-foreground text-xs">
        Last updated {formatDateTime(result.generatedAt)}
      </p>
    </PageContainer>
  );
}

function hasListFilters(filters: ReturnType<typeof parseAdminApplicationsSearchParams>) {
  return (
    filters.status !== "all" ||
    filters.plan !== "all" ||
    filters.payment !== "all" ||
    filters.search !== "" ||
    filters.submittedFrom !== "" ||
    filters.submittedTo !== "" ||
    filters.eventFrom !== "" ||
    filters.eventTo !== ""
  );
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en-PH", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Manila",
  }).format(new Date(value));
}

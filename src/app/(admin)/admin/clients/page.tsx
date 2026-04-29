import type { Metadata } from "next";
import { requireAdmin } from "@/lib/permissions";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { ClientCardList } from "@/components/clients/client-card-list";
import { ClientStatusTabs } from "@/components/clients/client-status-tabs";
import { ClientsFilterBar } from "@/components/clients/clients-filter-bar";
import { ClientsPagination } from "@/components/clients/clients-pagination";
import { ClientsTable } from "@/components/clients/clients-table";
import { PageContainer } from "@/components/app-shell/page-container";
import { PageHeader } from "@/components/app-shell/page-header";
import { ErrorState } from "@/components/feedback/error-state";
import { SectionCard } from "@/components/shared/section-card";
import { getAdminClients, parseAdminClientsSearchParams } from "@/server/queries/admin-clients";

type AdminClientsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export const metadata: Metadata = {
  robots: {
    follow: false,
    index: false,
  },
  title: "Clients",
};

export default async function AdminClientsPage({ searchParams }: AdminClientsPageProps) {
  await requireAdmin();

  const supabase = await createServerSupabaseClient();
  const filters = parseAdminClientsSearchParams(await searchParams);
  const result = await getAdminClients(filters, supabase);
  const hasActiveFilters = hasListFilters(filters);

  return (
    <PageContainer>
      <PageHeader
        title="Clients"
        description="Manage approved RSVP clients, hosting coverage, event lifecycle, and cleanup readiness."
      />

      <SectionCard
        title="Client lifecycle"
        description="Status counts reflect all approved client records. List totals update with your current filters."
      >
        <div className="space-y-4">
          <ClientStatusTabs counts={result.counts} filters={filters} />
          <ClientsFilterBar filters={filters} />
        </div>
      </SectionCard>

      {result.error ? (
        <ErrorState
          title="Clients could not be loaded"
          description="Refresh the page or try again."
        />
      ) : null}

      <ClientsTable hasActiveFilters={hasActiveFilters} items={result.items} />
      <ClientCardList hasActiveFilters={hasActiveFilters} items={result.items} />

      <ClientsPagination
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

function hasListFilters(filters: ReturnType<typeof parseAdminClientsSearchParams>) {
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

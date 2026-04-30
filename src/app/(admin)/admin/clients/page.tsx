import type { Metadata } from "next";
import { requireAdmin } from "@/lib/permissions";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { ClientsClientPage } from "@/components/clients/clients-client-page";
import { PageContainer } from "@/components/app-shell/page-container";
import { PageHeader } from "@/components/app-shell/page-header";
import { getAdminClients, parseAdminClientsSearchParams } from "@/server/queries/admin-clients";
import { getAdminPackageSettings } from "@/server/queries/platform-package-settings";

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
  const [result, packageSettings] = await Promise.all([
    getAdminClients(filters, supabase),
    getAdminPackageSettings(),
  ]);
  const packageDefaultAvailability = {
    max: Boolean(packageSettings.max.isActive && packageSettings.max.defaultAmount !== null),
    pro: Boolean(packageSettings.pro.isActive && packageSettings.pro.defaultAmount !== null),
  };
  const initialListSearch = buildInitialListSearch(filters);

  return (
    <PageContainer>
      <PageHeader
        title="Clients"
        description="Manage approved RSVP clients, payment state, event lifecycle, website access, and cleanup readiness."
      />

      <ClientsClientPage
        initialData={result}
        initialFilters={filters}
        initialListSearch={initialListSearch}
        packageDefaultAvailability={packageDefaultAvailability}
      />
    </PageContainer>
  );
}

function buildInitialListSearch(filters: ReturnType<typeof parseAdminClientsSearchParams>) {
  const params = new URLSearchParams();

  if (filters.status !== "all") {
    params.set("status", filters.status);
  }

  if (filters.plan !== "all") {
    params.set("plan", filters.plan);
  }

  if (filters.payment !== "all") {
    params.set("payment", filters.payment);
  }

  if (filters.hosting !== "all") {
    params.set("hosting", filters.hosting);
  }

  if (filters.event !== "all") {
    params.set("event", filters.event);
  }

  if (filters.search) {
    params.set("search", filters.search);
  }

  if (filters.eventFrom) {
    params.set("eventFrom", filters.eventFrom);
  }

  if (filters.eventTo) {
    params.set("eventTo", filters.eventTo);
  }

  if (filters.hostingEndsFrom) {
    params.set("hostingEndsFrom", filters.hostingEndsFrom);
  }

  if (filters.hostingEndsTo) {
    params.set("hostingEndsTo", filters.hostingEndsTo);
  }

  if (filters.approvedFrom) {
    params.set("approvedFrom", filters.approvedFrom);
  }

  if (filters.approvedTo) {
    params.set("approvedTo", filters.approvedTo);
  }

  if (filters.sort !== "updated_desc") {
    params.set("sort", filters.sort);
  }

  if (filters.page !== 1) {
    params.set("page", String(filters.page));
  }

  return params.toString();
}

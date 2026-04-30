import type { Metadata } from "next";
import { requireAdmin } from "@/lib/permissions";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { ApplicationDetailSheet } from "@/components/applications/application-detail-sheet";
import { PageContainer } from "@/components/app-shell/page-container";
import { PageHeader } from "@/components/app-shell/page-header";
import { ApplicationsClientPage } from "./client-page";
import {
  createAdminApplicationsListSearch,
  getAdminApplicationDetail,
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

  const resolvedSearchParams = await searchParams;
  const supabase = await createServerSupabaseClient();
  const filters = parseAdminApplicationsSearchParams(resolvedSearchParams);
  const selectedApplicationId = getApplicationId(resolvedSearchParams.applicationId);
  const [result, detailResult] = await Promise.all([
    getAdminApplications(filters, supabase),
    selectedApplicationId
      ? getAdminApplicationDetail(selectedApplicationId, supabase)
      : Promise.resolve(null),
  ]);

  return (
    <PageContainer>
      <PageHeader
        title="Applications"
        description="Review submitted Pro and Max RSVP website applications before approval and client creation."
      />

      <ApplicationsClientPage
        initialData={result}
        initialFilters={filters}
        initialListSearch={createAdminApplicationsListSearch(filters)}
      />

      <ApplicationDetailSheet
        application={detailResult?.application ?? null}
        open={selectedApplicationId !== null}
      />
    </PageContainer>
  );
}

function getApplicationId(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value ?? null;
}

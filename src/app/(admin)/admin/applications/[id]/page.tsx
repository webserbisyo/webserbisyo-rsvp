import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/permissions";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { ApplicationDetailHeader } from "@/components/applications/application-detail-header";
import { ApplicationDetailSections } from "@/components/applications/application-detail-sections";
import { ApplicationFutureActionsCard } from "@/components/applications/application-future-actions-card";
import { ApplicationLinkedRecords } from "@/components/applications/application-linked-records";
import { PageContainer } from "@/components/app-shell/page-container";
import { ErrorState } from "@/components/feedback/error-state";
import { getAdminApplicationDetail } from "@/server/queries/admin-applications";

type AdminApplicationDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export const metadata: Metadata = {
  robots: {
    follow: false,
    index: false,
  },
  title: "Application detail",
};

export default async function AdminApplicationDetailPage({
  params,
}: AdminApplicationDetailPageProps) {
  const { id } = await params;

  await requireAdmin();

  const supabase = await createServerSupabaseClient();
  const result = await getAdminApplicationDetail(id, supabase);

  if (result.notFound) {
    notFound();
  }

  if (!result.application) {
    return (
      <PageContainer>
        <ErrorState
          title="Application could not be loaded"
          description="Refresh the page or try again."
        />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <ApplicationDetailHeader application={result.application} />

      <ApplicationDetailSections
        activityError={result.errors?.activity}
        application={result.application}
      />

      <ApplicationLinkedRecords
        application={result.application}
        hasError={Boolean(result.errors?.linkedRecords)}
      />

      <ApplicationFutureActionsCard />

      <p className="text-muted-foreground text-xs">
        Last updated {formatDateTime(result.generatedAt)}
      </p>
    </PageContainer>
  );
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en-PH", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Manila",
  }).format(new Date(value));
}

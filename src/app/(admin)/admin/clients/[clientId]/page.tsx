import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/permissions";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { ClientLifecycleActions } from "@/components/admin-workflow/client-lifecycle-actions";
import { ClientDetailHeader } from "@/components/clients/client-detail-header";
import { ClientDetailSections } from "@/components/clients/client-detail-sections";
import { PageContainer } from "@/components/app-shell/page-container";
import { ErrorState } from "@/components/feedback/error-state";
import { getAdminClientDetail } from "@/server/queries/admin-clients";

type AdminClientDetailPageProps = {
  params: Promise<{
    clientId: string;
  }>;
};

export const metadata: Metadata = {
  robots: {
    follow: false,
    index: false,
  },
  title: "Client detail",
};

export default async function AdminClientDetailPage({ params }: AdminClientDetailPageProps) {
  const { clientId } = await params;

  await requireAdmin();

  const supabase = await createServerSupabaseClient();
  const result = await getAdminClientDetail(clientId, supabase);

  if (result.notFound) {
    notFound();
  }

  if (!result.client) {
    return (
      <PageContainer>
        <ErrorState
          title="Client could not be loaded"
          description="Refresh the page or try again."
        />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <ClientDetailHeader client={result.client} />

      <ClientDetailSections client={result.client} errors={result.errors} />

      <ClientLifecycleActions client={result.client} />

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

import type { Metadata } from "next";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/permissions";
import { AdminHomeStatGrid } from "@/components/admin-home/admin-home-stat-grid";
import { NeedsAttentionList } from "@/components/admin-home/needs-attention-list";
import { QuickActions } from "@/components/admin-home/quick-actions";
import { RecentApplicationsGrid } from "@/components/admin-home/recent-applications-grid";
import { PageContainer } from "@/components/app-shell/page-container";
import { PageHeader } from "@/components/app-shell/page-header";
import { getAdminHomeSummary } from "@/server/queries/admin-home";

export const metadata: Metadata = {
  title: "Home",
};

export default async function AdminIndexPage() {
  await requireAdmin();
  const supabase = await createServerSupabaseClient();
  const summary = await getAdminHomeSummary(supabase);

  return (
    <PageContainer>
      <PageHeader
        title="Admin home"
        description="Read-only operational snapshot for application review, payment follow-up, and current client activity."
      />
      <p className="text-muted-foreground -mt-2 text-xs">
        Last updated {formatDateTime(summary.generatedAt)}
      </p>

      <AdminHomeStatGrid stats={summary.stats} errorMessage={summary.errors?.stats} />

      <div className="grid gap-6 xl:grid-cols-[2fr_1fr]">
        <NeedsAttentionList
          items={summary.needsAttention}
          errorMessage={summary.errors?.needsAttention}
        />
        <QuickActions />
      </div>

      <RecentApplicationsGrid
        items={summary.recentApplications}
        errorMessage={summary.errors?.recentApplications}
      />
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

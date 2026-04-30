import type { Metadata } from "next";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/permissions";
import { AdminHomeStatGrid } from "@/components/admin-home/admin-home-stat-grid";
import { NeedsAttentionList } from "@/components/admin-home/needs-attention-list";
import { QuickActions } from "@/components/admin-home/quick-actions";
import { RecentHomeSections } from "@/components/admin-home/recent-home-sections";
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

      <RecentHomeSections
        sections={[
          {
            description: "Latest applications submitted through the public apply flow.",
            emptyDescription:
              "Recent applications will appear here after the first public submission.",
            emptyTitle: "No applications yet.",
            errorMessage: summary.errors?.recentApplications,
            items: summary.recentApplications,
            title: "Recent Applications",
            viewMoreHref: "/admin/applications",
          },
          {
            description: "Newest approved client records and lifecycle changes.",
            emptyDescription: "Approved client records will appear here after provisioning.",
            emptyTitle: "No clients yet.",
            errorMessage: summary.errors?.recentClients,
            items: summary.recentClients,
            title: "Recent Clients",
            viewMoreHref: "/admin/clients",
          },
          {
            description: "Recent manual payment records and confirmation states.",
            emptyDescription: "Payment records will appear here after client approval.",
            emptyTitle: "No payments yet.",
            errorMessage: summary.errors?.recentPayments,
            items: summary.recentPayments,
            title: "Recent Payments",
            viewMoreHref: "/admin/clients?payment=paid",
          },
          {
            description: "Latest audit trail entries from admin workflows.",
            emptyDescription: "Admin workflow activity will appear here after changes.",
            emptyTitle: "No activity yet.",
            errorMessage: summary.errors?.recentActivity,
            items: summary.recentActivity,
            title: "Recent Activity",
            viewMoreHref: "/admin",
          },
        ]}
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

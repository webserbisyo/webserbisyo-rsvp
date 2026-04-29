import type { Metadata } from "next";
import { requireAdmin } from "@/lib/permissions";
import { PageContainer } from "@/components/app-shell/page-container";
import { PageHeader } from "@/components/app-shell/page-header";
import { SectionCard } from "@/components/shared/section-card";

export const metadata: Metadata = {
  title: "Sales",
};

export default async function AdminSalesPage() {
  await requireAdmin();

  return (
    <PageContainer>
      <PageHeader
        title="Sales"
        description="Sales and payment confirmation are archived for a later phase."
      />

      <SectionCard
        title="Archived for later rollout"
        description="Sales reporting and manual payment confirmation are currently deferred. Backend payment workflow code is preserved for future rollout."
      >
        <p className="text-muted-foreground text-sm">
          Sales reporting and manual payment confirmation are currently deferred. Backend payment
          workflow code is preserved for future rollout.
        </p>
      </SectionCard>
    </PageContainer>
  );
}

import type { Metadata } from "next";
import { ComingSoonCard } from "@/components/feedback/coming-soon-card";
import { PageContainer } from "@/components/app-shell/page-container";
import { PageHeader } from "@/components/app-shell/page-header";

export const metadata: Metadata = {
  title: "Sales",
};

export default function AdminSalesPage() {
  return (
    <PageContainer>
      <PageHeader
        title="Sales"
        description="Legacy sales summary route preserved as a safe placeholder for existing references."
      />
      <ComingSoonCard description="Revenue calculations and sales aggregation are deferred." />
    </PageContainer>
  );
}

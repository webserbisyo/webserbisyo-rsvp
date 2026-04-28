import type { Metadata } from "next";
import { ComingSoonCard } from "@/components/feedback/coming-soon-card";
import { PageContainer } from "@/components/app-shell/page-container";
import { PageHeader } from "@/components/app-shell/page-header";

export const metadata: Metadata = {
  title: "Logs",
};

export default function AdminLogsPage() {
  return (
    <PageContainer>
      <PageHeader
        title="Logs"
        description="Operational email and audit log shell for reviewed admin workflows."
      />
      <ComingSoonCard description="Audit and email log reads remain deferred." />
    </PageContainer>
  );
}

import type { Metadata } from "next";
import { ComingSoonCard } from "@/components/feedback/coming-soon-card";
import { PageContainer } from "@/components/app-shell/page-container";
import { PageHeader } from "@/components/app-shell/page-header";

export const metadata: Metadata = {
  title: "Events",
};

export default function AdminEventsPage() {
  return (
    <PageContainer>
      <PageHeader
        title="Events"
        description="Admin event inventory shell for future draft and published RSVP events."
      />
      <ComingSoonCard description="Event records are not fetched in this foundation task." />
    </PageContainer>
  );
}

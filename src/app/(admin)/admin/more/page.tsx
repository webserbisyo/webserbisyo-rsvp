import type { Metadata } from "next";
import { AdminMoreMenu } from "@/components/app-shell/admin-more-menu";
import { PageContainer } from "@/components/app-shell/page-container";
import { PageHeader } from "@/components/app-shell/page-header";

export const metadata: Metadata = {
  title: "More",
};

export default function AdminMorePage() {
  return (
    <PageContainer>
      <PageHeader
        title="More"
        description="Mobile overflow destinations for secondary admin sections."
      />
      <AdminMoreMenu />
    </PageContainer>
  );
}

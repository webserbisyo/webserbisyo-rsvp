import type { Metadata } from "next";
import { requireAdmin } from "@/lib/permissions";
import { MetaPixelsClientPage } from "@/components/meta-pixels/meta-pixels-client-page";
import { PageContainer } from "@/components/app-shell/page-container";
import { PageHeader } from "@/components/app-shell/page-header";
import { getAdminPixels } from "@/server/queries/admin-pixels";

export const metadata: Metadata = {
  robots: {
    follow: false,
    index: false,
  },
  title: "Meta Pixels",
};

export default async function AdminMetaPixelsPage() {
  await requireAdmin();
  const initialData = await getAdminPixels();

  return (
    <PageContainer>
      <PageHeader
        title="Meta Pixels"
        description="Manage public Pixel scopes and review server-side Purchase conversion readiness."
      />
      <MetaPixelsClientPage initialData={initialData} />
    </PageContainer>
  );
}

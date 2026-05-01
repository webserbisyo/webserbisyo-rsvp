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
        description="Manage public browser Pixel scopes and review server-side Purchase conversion readiness for Mark as Paid."
      />
      <MetaPixelsClientPage initialData={initialData} />
    </PageContainer>
  );
}

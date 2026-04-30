import type { Metadata } from "next";
import Link from "next/link";
import { PackageSettingsForm } from "@/components/admin/settings/package-settings-form";
import { PageContainer } from "@/components/app-shell/page-container";
import { PageHeader } from "@/components/app-shell/page-header";
import { Button } from "@/components/ui/button";
import { requireAdmin } from "@/lib/permissions";
import { SectionCard } from "@/components/shared/section-card";
import { getAdminPackageSettings } from "@/server/queries/platform-package-settings";

export const metadata: Metadata = {
  title: "Settings",
};

export default async function AdminSettingsPage() {
  const profile = await requireAdmin();
  const packageSettings = await getAdminPackageSettings();

  return (
    <PageContainer>
      <PageHeader
        title="Settings"
        description="Manage platform defaults, event access windows, and payment configuration used by the admin workflow."
      />

      <SectionCard
        title="Signed-in admin"
        description="Read-only profile values from the existing admin permission boundary."
      >
        <dl className="grid gap-4 text-sm sm:grid-cols-3">
          <div>
            <dt className="text-muted-foreground">Name</dt>
            <dd className="mt-1 font-medium">{profile.full_name || "Platform admin"}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Email</dt>
            <dd className="mt-1 font-medium break-all">{profile.email || "Not set"}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Role</dt>
            <dd className="mt-1 font-medium">{profile.role}</dd>
          </div>
        </dl>
      </SectionCard>

      <SectionCard
        title="Manual payment options"
        description="Existing Phase D settings are preserved on their dedicated route."
      >
        <Button asChild variant="outline">
          <Link href="/admin/payment-options">Open payment options</Link>
        </Button>
      </SectionCard>

      <SectionCard
        title="Package defaults"
        description="Configure the database-backed Pro and Max pricing and access defaults used by approvals and payment confirmation."
      >
        <PackageSettingsForm initialData={packageSettings} />
      </SectionCard>
    </PageContainer>
  );
}

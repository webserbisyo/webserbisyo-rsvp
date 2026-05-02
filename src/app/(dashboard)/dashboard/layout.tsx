import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/dashboard/shell";
import { AuthenticationError, PermissionError, requireTenantMember } from "@/lib/permissions";

type DashboardLayoutProps = {
  children: React.ReactNode;
};

export default async function DashboardLayout({ children }: DashboardLayoutProps) {
  let profile: Awaited<ReturnType<typeof requireTenantMember>>;

  try {
    profile = await requireTenantMember();
  } catch (error) {
    if (error instanceof AuthenticationError) {
      redirect("/login?next=/dashboard");
    }

    if (error instanceof PermissionError) {
      redirect("/admin");
    }

    throw error;
  }

  return (
    <DashboardShell email={profile.email} displayName={profile.full_name ?? undefined}>
      {children}
    </DashboardShell>
  );
}

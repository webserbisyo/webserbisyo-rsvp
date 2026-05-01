import { redirect } from "next/navigation";
import { AuthenticationError, PermissionError, requireTenantMember } from "@/lib/permissions";

type DashboardLayoutProps = {
  children: React.ReactNode;
};

export default async function DashboardLayout({ children }: DashboardLayoutProps) {
  try {
    await requireTenantMember();
  } catch (error) {
    if (error instanceof AuthenticationError) {
      redirect("/login?next=/dashboard");
    }

    if (error instanceof PermissionError) {
      redirect("/admin");
    }

    throw error;
  }

  return <div className="bg-background min-h-screen">{children}</div>;
}

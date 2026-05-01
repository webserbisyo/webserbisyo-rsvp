import { redirect } from "next/navigation";
import { ClientDashboardShell } from "@/components/client-dashboard/shell/client-dashboard-shell";
import { AuthenticationError, PermissionError } from "@/lib/permissions";
import { getDashboardSummary } from "@/server/queries/dashboard";

type DashboardLayoutProps = {
  children: React.ReactNode;
};

export default async function DashboardLayout({ children }: DashboardLayoutProps) {
  let summary: Awaited<ReturnType<typeof getDashboardSummary>>;

  try {
    summary = await getDashboardSummary();
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
    <ClientDashboardShell
      client={{
        name: summary.client.name,
      }}
      profile={summary.profile}
    >
      {children}
    </ClientDashboardShell>
  );
}

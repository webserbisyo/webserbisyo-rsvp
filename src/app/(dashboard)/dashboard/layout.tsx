import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/dashboard/shell";
import { AuthenticationError, PermissionError, requireTenantMember } from "@/lib/permissions";
import { createServerSupabaseClient } from "@/lib/supabase/server";

type DashboardLayoutProps = {
  children: React.ReactNode;
};

export default async function DashboardLayout({ children }: DashboardLayoutProps) {
  let profile: Awaited<ReturnType<typeof requireTenantMember>>;
  let planType: string | null = null;

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

  if (profile.client_id) {
    const supabase = await createServerSupabaseClient();
    const { data: clientData } = await supabase
      .from("clients")
      .select("plan_type")
      .eq("id", profile.client_id)
      .single();

    planType = clientData?.plan_type ?? null;
  }

  return (
    <DashboardShell
      email={profile.email}
      displayName={profile.full_name ?? undefined}
      planType={planType}
    >
      {children}
    </DashboardShell>
  );
}

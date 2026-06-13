import { dashboardErrorJson, dashboardJson } from "@/app/api/dashboard/_utils";
import { PermissionError, requireTenantMember } from "@/lib/permissions";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { DashboardBootstrapDto } from "@/lib/dashboard/dashboard-dtos";

export async function GET() {
  try {
    const profile = await requireTenantMember();
    const clientId = profile.client_id;

    if (!clientId) {
      throw new PermissionError("Client tenant access is required.");
    }

    const supabase = await createServerSupabaseClient();
    const { data: clientData, error } = await supabase
      .from("clients")
      .select("plan_type")
      .eq("id", clientId)
      .single();

    if (error) {
      throw error;
    }

    const dto: DashboardBootstrapDto = {
      clientId,
      displayName: profile.full_name ?? undefined,
      email: profile.email,
      planType: clientData?.plan_type ?? null,
      profileId: profile.id,
    };

    return dashboardJson(dto);
  } catch (error) {
    return dashboardErrorJson(error, "bootstrap");
  }
}

import { dashboardErrorJson, dashboardJson } from "@/app/api/dashboard/_utils";
import { getDashboardSummary } from "@/server/queries/dashboard";

export async function GET() {
  try {
    return dashboardJson(await getDashboardSummary());
  } catch (error) {
    return dashboardErrorJson(error, "home");
  }
}

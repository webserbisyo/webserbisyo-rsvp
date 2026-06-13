import { dashboardErrorJson, dashboardJson } from "@/app/api/dashboard/_utils";
import { getDashboardResponses } from "@/server/queries/responses";

export async function GET() {
  try {
    return dashboardJson(await getDashboardResponses());
  } catch (error) {
    return dashboardErrorJson(error, "responses");
  }
}

import { dashboardErrorJson, dashboardJson } from "@/app/api/dashboard/_utils";
import { getDashboardEventWebsiteData } from "@/server/queries/dashboard-event";

export async function GET() {
  try {
    return dashboardJson(await getDashboardEventWebsiteData());
  } catch (error) {
    return dashboardErrorJson(error, "event");
  }
}

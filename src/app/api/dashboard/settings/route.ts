import { dashboardErrorJson, dashboardJson } from "@/app/api/dashboard/_utils";
import { getSettingsPageData } from "@/server/queries/settings";

export async function GET() {
  try {
    return dashboardJson(await getSettingsPageData());
  } catch (error) {
    return dashboardErrorJson(error, "settings");
  }
}

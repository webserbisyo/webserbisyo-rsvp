import { dashboardErrorJson, dashboardJson } from "@/app/api/dashboard/_utils";
import { getWebsiteAccessData } from "@/server/queries/website-access";

export async function GET() {
  try {
    return dashboardJson(await getWebsiteAccessData());
  } catch (error) {
    return dashboardErrorJson(error, "website-access");
  }
}

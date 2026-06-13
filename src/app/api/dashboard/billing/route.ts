import { dashboardErrorJson, dashboardJson } from "@/app/api/dashboard/_utils";
import { getBillingPageData } from "@/server/queries/billing";

export async function GET() {
  try {
    return dashboardJson(await getBillingPageData());
  } catch (error) {
    return dashboardErrorJson(error, "billing");
  }
}

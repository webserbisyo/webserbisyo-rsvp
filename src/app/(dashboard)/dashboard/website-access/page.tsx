import { WebsiteAccessPage } from "@/components/dashboard/website-access/website-access-page";
import { getWebsiteAccessData } from "@/server/queries/website-access";

export default async function DashboardWebsiteAccessPage() {
  const initialData = await getWebsiteAccessData();

  return <WebsiteAccessPage initialData={initialData} />;
}

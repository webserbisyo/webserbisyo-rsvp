import { SettingsPage } from "@/components/dashboard/settings/settings-page";
import { getSettingsPageData } from "@/server/queries/settings";

export default async function DashboardSettingsPage() {
  const data = await getSettingsPageData();

  return <SettingsPage data={data} />;
}

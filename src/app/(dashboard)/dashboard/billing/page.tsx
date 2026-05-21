import { getBillingPageData } from "@/server/queries/billing";
import { BillingPage } from "@/components/dashboard/billing/billing-page";

export default async function DashboardBillingPage() {
  const data = await getBillingPageData();

  return <BillingPage data={data} />;
}

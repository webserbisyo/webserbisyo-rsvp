import { getBillingPageData } from "@/server/queries/billing";
import { DashboardRouteRefresh } from "@/components/dashboard/dashboard-route-refresh";
import { BillingPage } from "@/components/dashboard/billing/billing-page";

export default async function DashboardBillingPage() {
  const data = await getBillingPageData();

  return (
    <>
      <DashboardRouteRefresh refreshOnFocus refreshOnVisibility />
      <BillingPage data={data} />
    </>
  );
}

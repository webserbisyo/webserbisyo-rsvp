"use client";

import { ErrorState } from "@/components/feedback/error-state";
import { DashboardViewLoading } from "@/components/dashboard/dashboard-view-loading";
import { BillingPage } from "@/components/dashboard/billing/billing-page";
import { useDashboardBillingQuery } from "@/lib/dashboard/dashboard-queries";

export default function DashboardBillingView() {
  const query = useDashboardBillingQuery();

  if (!query.data) {
    if (query.isError) {
      return (
        <ErrorState
          title="Billing could not be loaded"
          description="Refresh the page or try again after checking your connection."
        />
      );
    }

    return <DashboardViewLoading view="billing" />;
  }

  return <BillingPage data={query.data} />;
}

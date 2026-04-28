import type { Metadata } from "next";
import { PaymentOptionsForm } from "@/components/admin/payment-options/payment-options-form";
import { getAdminPaymentOptions } from "@/server/queries/platform-payment-options";
import { PageContainer } from "@/components/app-shell/page-container";
import { PageHeader } from "@/components/app-shell/page-header";

export const metadata: Metadata = {
  title: "Manual payment options",
};

export const dynamic = "force-dynamic";

export default async function AdminPaymentOptionsPage() {
  const paymentOptions = await getAdminPaymentOptions();

  return (
    <PageContainer>
      <PageHeader
        title="Manual payment options"
        description="Configure the GCash and Maya details that appear in the public application funnel, plus the Messenger page used for follow-up."
      />
      <PaymentOptionsForm initialData={paymentOptions} />
    </PageContainer>
  );
}

import { PaymentOptionsForm } from "@/components/admin/payment-options/payment-options-form";
import { getAdminPaymentOptions } from "@/server/queries/platform-payment-options";

export const dynamic = "force-dynamic";

export default async function AdminPaymentOptionsPage() {
  const paymentOptions = await getAdminPaymentOptions();

  return (
    <main className="rsvp-shell min-h-screen">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
        <section className="space-y-3">
          <p className="text-rsvp-brand text-sm font-semibold tracking-[0.22em] uppercase">Admin</p>
          <h1 className="text-4xl font-semibold tracking-tight">Manual payment options</h1>
          <p className="text-muted-foreground max-w-3xl text-base leading-7">
            Configure the GCash and Maya details that appear in the public application funnel, plus
            the Messenger page used for follow-up.
          </p>
        </section>
        <PaymentOptionsForm initialData={paymentOptions} />
      </div>
    </main>
  );
}

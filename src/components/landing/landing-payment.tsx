"use client";

import Link from "next/link";
import { ArrowRight, MessageCircleMore, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { PaymentOptionCard } from "@/components/apply/payment-option-card";
import { TrackedLink } from "@/components/meta-pixels/tracked-link";
import { buildMessengerContinueUrl } from "@/lib/apply/messenger";
import type { PublicPaymentOption } from "@/lib/apply/public-payment-option-dto";
import { getPaymentOptionLabel } from "@/lib/apply/public-payment-option-dto";
import { Button } from "@/components/ui/button";

type LandingPaymentProps = {
  messengerPageUrl: string | null;
  paymentOptions: PublicPaymentOption[];
};

export function LandingPayment({ messengerPageUrl, paymentOptions }: LandingPaymentProps) {
  const messengerUrl = buildMessengerContinueUrl(messengerPageUrl);

  return (
    <section
      id="payment"
      className="landing-theme-dark relative isolate w-full scroll-mt-28 bg-[var(--landing-bg)] overflow-hidden py-20 sm:py-28"
    >
      {/* Background Grid Pattern */}
      <div
        className="absolute inset-0 z-0 pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='64' height='64' viewBox='0 0 64 64' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M 64 0 L 0 0 0 64' fill='none' stroke='rgba(255,138,92,0.08)' stroke-width='1' stroke-dasharray='4 4' /%3E%3C/svg%3E")`,
          maskImage: "radial-gradient(ellipse at 50% 50%, transparent 15%, black 50%, black 85%, transparent 100%)",
          WebkitMaskImage: "radial-gradient(ellipse at 50% 50%, transparent 15%, black 50%, black 85%, transparent 100%)",
        }}
      />

      {/* Background Ambient Glow */}
      <div
        className="absolute top-1/3 left-1/2 -translate-x-1/2 z-0 size-[500px] rounded-full pointer-events-none bg-[radial-gradient(circle_at_center,rgba(255,138,92,0.04)_0%,rgba(60,20,40,0.12)_50%,transparent_75%)] blur-3xl"
        aria-hidden="true"
      />

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col items-center">
        {/* Header Block */}
        <div className="text-center mb-10 flex flex-col items-center gap-3 max-w-3xl">
          <span className="bg-gradient-to-r from-[#ff8a5c] to-amber-500 bg-clip-text text-transparent text-xs font-black tracking-widest uppercase">
            PAYMENT OPTIONS
          </span>
          <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl leading-tight sm:leading-none">
            Flexible Payment Options
          </h2>
          <div className="mt-2 inline-flex items-center gap-2 rounded-full border border-[#ff8a5c]/25 bg-[#ff8a5c]/[0.06] px-4 py-1.5 text-xs sm:text-sm font-semibold text-[#ff8a5c]">
            <ShieldCheck className="size-4 shrink-0 text-[#ff8a5c]" />
            <span>Website muna, bago bayad.</span>
          </div>
          <p className="text-sm sm:text-base md:text-lg text-white/70 mt-2 max-w-2xl">
            Apply first, review your website preview, and pay only when you’re ready to continue.
          </p>
        </div>

        {/* Streamlined Payment Options Container */}
        <div className="w-full max-w-4xl rounded-3xl border border-white/[0.08] bg-white/[0.02] p-6 sm:p-10 backdrop-blur-2xl shadow-xl flex flex-col items-center">
          <div className="text-center mb-8 max-w-2xl">
            <h3 className="text-lg sm:text-xl font-bold text-white mb-2">
              Already submitted your application?
            </h3>
            <p className="text-xs sm:text-sm text-white/60 leading-relaxed">
              Choose your preferred payment method below. Use the same email from your application so we can correctly match your payment.
            </p>
          </div>

          {/* Payment Cards Grid */}
          {paymentOptions.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full mb-8">
              {paymentOptions.map((option) => (
                <PaymentOptionCard
                  key={option.provider}
                  isSelected={false}
                  showProviderTitle={true}
                  option={option}
                  onCopyNumber={
                    option.accountNumber
                      ? async () => {
                          try {
                            await navigator.clipboard.writeText(option.accountNumber ?? "");
                            toast.success(`${getPaymentOptionLabel(option.provider)} number copied.`);
                          } catch {
                            toast.error("Could not copy the account number.");
                          }
                        }
                      : undefined
                  }
                />
              ))}
            </div>
          ) : (
            <div className="w-full rounded-xl border border-white/10 bg-white/[0.01] p-6 text-center text-xs text-white/50 mb-8">
              No QR payment methods published yet. Payment details will be sent directly on Messenger.
            </div>
          )}

          {/* Proof Instructions */}
          <div className="w-full text-center border-t border-white/[0.08] pt-6 mb-8">
            <p className="text-xs sm:text-sm text-white/75 leading-relaxed max-w-xl mx-auto">
              After paying, send us your proof of payment on Messenger together with your application email, reference code, and selected package.
            </p>
          </div>

          {/* CTA Row */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full max-w-md">
            {messengerUrl ? (
              <Button
                asChild
                size="lg"
                className="w-full sm:w-auto h-12 px-6 rounded-xl bg-gradient-to-r from-[#ff8a5c] to-[#ff6b3b] text-white font-bold shadow-lg shadow-orange-950/20 hover:brightness-110"
              >
                <Link href={messengerUrl} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2">
                  <MessageCircleMore className="size-4" />
                  Send Payment Proof on Messenger
                </Link>
              </Button>
            ) : null}

            <TrackedLink
              href="/apply"
              className="w-full sm:w-auto inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/[0.04] px-6 text-sm font-semibold text-white transition-all hover:bg-white/10"
              trackingEvent="StartApplicationClick"
              trackingParams={{
                content_category: "RSVP Website Application",
                destination: "/apply",
                source: "payment_section",
              }}
            >
              Start Application <ArrowRight className="size-4" />
            </TrackedLink>
          </div>
        </div>
      </div>
    </section>
  );
}

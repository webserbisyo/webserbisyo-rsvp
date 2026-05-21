import { BillingCard } from "@/components/dashboard/billing/billing-card";
import { BillingDetailRow } from "@/components/dashboard/billing/billing-detail-row";
import { BillingStatCard } from "@/components/dashboard/billing/billing-stat-card";
import { BillingStatusBadge, type BillingPaymentStatus } from "@/components/dashboard/billing/billing-status-badge";
import { MessengerLogo } from "@/components/dashboard/billing/messenger-logo";
import { Button } from "@/components/ui/button";
import { CalendarDays, ChevronRight, ReceiptText, ShieldCheck, Sparkles, WalletCards } from "lucide-react";

type BillingPlan = "max" | "pro";

type BillingPageData = {
  currentPlan: BillingPlan;
  latestPayment: {
    amountLabel: string;
    confirmedAtLabel: string;
    methodLabel: string;
    referenceLabel: string;
    status: BillingPaymentStatus;
  };
  overview: {
    amountPaidLabel: string;
    paymentStatus: BillingPaymentStatus;
    remainingBalanceLabel: string;
    totalPackageLabel: string;
  };
  servicePeriod: {
    endsLabel: string;
    helperText: string;
    renewalLabel: string;
    startsLabel: string;
  };
};

const PLAN_DESCRIPTIONS: Record<BillingPlan, string> = {
  max: "Max includes designer-created monogram details, richer animations, and a more customized event website experience than Pro.",
  pro: "Pro includes a polished event website with refined standard styling, essential animations, and a clean guest-friendly RSVP experience.",
};

const PAYMENT_INSTRUCTIONS_COPY: Record<BillingPaymentStatus, string> = {
  confirmed: "Your payment is complete. No further action needed.",
  partial:
    "Please complete your remaining balance using the payment instructions shared by WebSerbisyo. Your billing status will update after confirmation.",
  pending:
    "Please send your payment using the payment instructions shared by WebSerbisyo. Your billing status will update after confirmation.",
  unpaid:
    "Please complete your payment using the payment instructions shared by WebSerbisyo. Your billing status will update after confirmation.",
};

// TODO: Replace mock billing data with a tenant-scoped billing query.
const BILLING_PAGE_DATA: BillingPageData = {
  currentPlan: "max",
  latestPayment: {
    amountLabel: "₱8,500",
    confirmedAtLabel: "May 2, 2026",
    methodLabel: "GCash",
    referenceLabel: "#REF12345",
    status: "confirmed",
  },
  overview: {
    amountPaidLabel: "₱8,500",
    paymentStatus: "confirmed",
    remainingBalanceLabel: "₱0",
    totalPackageLabel: "₱8,500",
  },
  servicePeriod: {
    endsLabel: "Jun 30, 2026",
    helperText: "Your website and RSVP dashboard will be active through your service period.",
    renewalLabel: "Jun 15, 2026",
    startsLabel: "Jun 1, 2026",
  },
};

// TODO: Replace mock support URL with the admin/platform settings support link.
const SUPPORT_URL = "https://m.me/webserbisyo";

export function BillingPage() {
  const planLabel = BILLING_PAGE_DATA.currentPlan === "max" ? "Max" : "Pro";

  return (
    <div className="space-y-6 pb-24 pt-2 md:pb-8">
      {/* ── Two-column layout ── */}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_330px] xl:grid-cols-[minmax(0,1fr)_348px]">
        {/* ── Left / main column ── */}
        <div className="space-y-6">
          {/* Current Plan card */}
          <BillingCard
            className="overflow-hidden border-[color:color-mix(in_srgb,var(--dash-brand)_28%,var(--dash-border))] bg-gradient-to-br from-[color:color-mix(in_srgb,var(--dash-brand-subtle)_55%,white)] via-[color:color-mix(in_srgb,var(--dash-surface)_80%,#fff7f1)] to-[color:color-mix(in_srgb,var(--dash-surface-muted)_70%,#ffeedd)] shadow-[0_16px_40px_rgba(201,107,72,0.1),0_3px_0_rgba(201,107,72,0.14)]"
            contentClassName="px-6 py-7 sm:px-7 sm:py-8"
          >
            <div className="max-w-2xl">
              {/* CURRENT PLAN eyebrow label */}
              <p className="text-xs font-bold uppercase tracking-[0.17em] text-[color:var(--dash-heading-muted)]">
                Current Plan
              </p>
              {/* Plan name — large serif terracotta */}
              <h2 className="mt-3 font-serif text-[3.25rem] font-black leading-[0.92] tracking-tight text-[color:var(--dash-brand)]">
                {planLabel}
              </h2>
              {/* Plan description */}
              <p className="mt-5 text-[17px] font-semibold leading-relaxed text-[color:color-mix(in_srgb,var(--dash-foreground)_72%,var(--dash-heading-muted))]">
                {PLAN_DESCRIPTIONS[BILLING_PAGE_DATA.currentPlan]}
              </p>
            </div>
          </BillingCard>

          {/* Payment overview — 4 stat cards in one row at xl, 2×2 at sm */}
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Payment overview">
            <BillingStatCard
              icon={<WalletCards className="h-[18px] w-[18px]" aria-hidden="true" />}
              label="Total Package"
              value={BILLING_PAGE_DATA.overview.totalPackageLabel}
            />
            <BillingStatCard
              icon={<ShieldCheck className="h-[18px] w-[18px]" aria-hidden="true" />}
              label="Amount Paid"
              value={BILLING_PAGE_DATA.overview.amountPaidLabel}
            />
            <BillingStatCard
              icon={<ReceiptText className="h-[18px] w-[18px]" aria-hidden="true" />}
              label="Remaining Balance"
              value={BILLING_PAGE_DATA.overview.remainingBalanceLabel}
            />
            <BillingStatCard
              icon={<Sparkles className="h-[18px] w-[18px]" aria-hidden="true" />}
              label="Payment Status"
              value={<BillingStatusBadge status={BILLING_PAGE_DATA.overview.paymentStatus} />}
            />
          </section>

          {/* Latest Payment card */}
          <BillingCard contentClassName="px-6 py-6 sm:px-7 sm:py-7">
            <p className="mb-1 text-xs font-bold uppercase tracking-[0.17em] text-[color:var(--dash-heading-muted)]">
              Latest Payment
            </p>
            <div className="mt-4">
              <BillingDetailRow
                label="Status"
                value={<BillingStatusBadge status={BILLING_PAGE_DATA.latestPayment.status} />}
              />
              <BillingDetailRow label="Amount" value={BILLING_PAGE_DATA.latestPayment.amountLabel} />
              <BillingDetailRow label="Method" value={BILLING_PAGE_DATA.latestPayment.methodLabel} />
              <BillingDetailRow label="Confirmed" value={BILLING_PAGE_DATA.latestPayment.confirmedAtLabel} />
              <BillingDetailRow label="Reference" value={BILLING_PAGE_DATA.latestPayment.referenceLabel} />
            </div>
          </BillingCard>
        </div>

        {/* ── Right / sticky column (desktop only) ── */}
        <aside className="space-y-5 self-start lg:sticky lg:top-[calc(var(--dash-header-height)+1rem)]">
          {/* Hosting & Service Period */}
          <BillingCard contentClassName="px-5 py-5 sm:px-6 sm:py-6">
            <p className="text-xs font-bold uppercase tracking-[0.17em] text-[color:var(--dash-heading-muted)]">
              Hosting &amp; Service Period
            </p>
            <div className="mt-4">
              <div className="flex items-center justify-between gap-5 border-b border-[color:var(--dash-divider)] py-3.5 last:border-b-0">
                <div className="flex items-center gap-2.5 text-[color:var(--dash-heading-muted)]">
                  <CalendarDays className="h-4 w-4 shrink-0 text-[color:var(--dash-brand)]" aria-hidden="true" />
                  <span className="text-[15px] font-medium">Starts</span>
                </div>
                <span className="text-right text-[15px] font-semibold text-[color:var(--dash-foreground)]">
                  {BILLING_PAGE_DATA.servicePeriod.startsLabel}
                </span>
              </div>
              <div className="flex items-center justify-between gap-5 border-b border-[color:var(--dash-divider)] py-3.5 last:border-b-0">
                <div className="flex items-center gap-2.5 text-[color:var(--dash-heading-muted)]">
                  <CalendarDays className="h-4 w-4 shrink-0 text-[color:var(--dash-brand)]" aria-hidden="true" />
                  <span className="text-[15px] font-medium">Ends</span>
                </div>
                <span className="text-right text-[15px] font-semibold text-[color:var(--dash-foreground)]">
                  {BILLING_PAGE_DATA.servicePeriod.endsLabel}
                </span>
              </div>
              <div className="flex items-center justify-between gap-5 py-3.5">
                <div className="flex items-center gap-2.5 text-[color:var(--dash-heading-muted)]">
                  <CalendarDays className="h-4 w-4 shrink-0 text-[color:var(--dash-brand)]" aria-hidden="true" />
                  <span className="text-[15px] font-medium">Renewal</span>
                </div>
                <span className="text-right text-[15px] font-semibold text-[color:var(--dash-foreground)]">
                  {BILLING_PAGE_DATA.servicePeriod.renewalLabel}
                </span>
              </div>
            </div>
            <p className="mt-3 text-sm font-medium leading-relaxed text-[color:var(--dash-heading-muted)]">
              {BILLING_PAGE_DATA.servicePeriod.helperText}
            </p>
          </BillingCard>

          {/* Payment Instructions */}
          <BillingCard contentClassName="px-5 py-5 sm:px-6 sm:py-6">
            <p className="text-xs font-bold uppercase tracking-[0.17em] text-[color:var(--dash-heading-muted)]">
              Payment Instructions
            </p>
            <p className="mt-4 text-base font-medium leading-relaxed text-[color:var(--dash-muted)]">
              {PAYMENT_INSTRUCTIONS_COPY[BILLING_PAGE_DATA.overview.paymentStatus]}
            </p>
          </BillingCard>

          {/* Need help? */}
          <BillingCard contentClassName="px-5 py-5 sm:px-6 sm:py-6">
            <div className="flex gap-3.5">
              {/* Messenger icon bubble */}
              <div
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[color:color-mix(in_srgb,var(--dash-brand-subtle)_90%,white)] shadow-[inset_0_1px_0_rgba(255,255,255,0.75)]"
                aria-hidden="true"
              >
                <MessengerLogo className="h-[18px] w-[18px]" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-base font-black text-[color:var(--dash-foreground)]">Need help with billing?</h3>
                <p className="mt-1 text-sm font-medium leading-relaxed text-[color:var(--dash-heading-muted)]">
                  Contact WebSerbisyo for payment, receipt, or renewal questions.
                </p>
              </div>
            </div>
            {/* TODO: Replace with admin/platform settings support link. */}
            <Button
              asChild
              className="mt-5 h-11 w-full rounded-full bg-[color:var(--dash-brand)] px-5 text-sm font-black text-white shadow-[0_12px_26px_rgba(201,107,72,0.28)] hover:bg-[color:var(--dash-brand-hover)] focus-visible:ring-[color:color-mix(in_srgb,var(--dash-brand)_28%,white)]"
            >
              <a href={SUPPORT_URL} target="_blank" rel="noreferrer">
                <span className="flex items-center justify-center gap-2">
                  Contact Support
                  <ChevronRight className="h-4 w-4" aria-hidden="true" />
                </span>
              </a>
            </Button>
          </BillingCard>
        </aside>
      </div>
    </div>
  );
}

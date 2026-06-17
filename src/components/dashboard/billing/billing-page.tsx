import { BillingCard } from "@/components/dashboard/billing/billing-card";
import { BillingDetailRow } from "@/components/dashboard/billing/billing-detail-row";
import { BillingPaymentInstructions } from "@/components/dashboard/billing/billing-payment-instructions";
import { BillingStatCard } from "@/components/dashboard/billing/billing-stat-card";
import { BillingStatusBadge } from "@/components/dashboard/billing/billing-status-badge";
import type { BillingPageData } from "@/components/dashboard/billing/billing-types";
import { MessengerLogo } from "@/components/dashboard/billing/messenger-logo";
import { Button } from "@/components/ui/button";
import {
  CalendarDays,
  ChevronRight,
  ReceiptText,
  ShieldCheck,
  Sparkles,
  WalletCards,
} from "lucide-react";

export function BillingPage({ data }: { data: BillingPageData }) {
  const latestPaymentStatus = data.latestPayment?.status ?? data.paymentStatus;

  return (
    <div className="space-y-6 pt-2 pb-24 md:pb-8">
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
              <p className="text-xs font-bold tracking-[0.17em] text-[color:var(--dash-heading-muted)] uppercase">
                Current Plan
              </p>
              {/* Plan name — large serif terracotta */}
              <h2 className="mt-3 font-serif text-[3.25rem] leading-[0.92] font-black tracking-tight text-[color:var(--dash-brand)]">
                {data.planName}
              </h2>
              {/* Plan description */}
              <p className="mt-5 text-[17px] leading-relaxed font-semibold text-[color:color-mix(in_srgb,var(--dash-foreground)_72%,var(--dash-heading-muted))]">
                {data.planDescription}
              </p>
            </div>
          </BillingCard>

          {/* Payment overview — 4 stat cards in one row at xl, 2×2 at sm */}
          <section
            className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
            aria-label="Payment overview"
          >
            <BillingStatCard
              icon={<WalletCards className="h-[18px] w-[18px]" aria-hidden="true" />}
              label="Total Package"
              value={formatCurrency(data.totalPackageAmount, data.currency, "Pending")}
            />
            <BillingStatCard
              icon={<ShieldCheck className="h-[18px] w-[18px]" aria-hidden="true" />}
              label="Amount Paid"
              value={formatCurrency(data.amountPaid, data.currency)}
            />
            <BillingStatCard
              icon={<ReceiptText className="h-[18px] w-[18px]" aria-hidden="true" />}
              label="Remaining Balance"
              value={formatCurrency(data.remainingBalance, data.currency, "Pending")}
            />
            <BillingStatCard
              icon={<Sparkles className="h-[18px] w-[18px]" aria-hidden="true" />}
              label="Payment Status"
              value={<BillingStatusBadge status={data.paymentStatus} />}
            />
          </section>

          {/* Latest Payment card */}
          <BillingCard contentClassName="px-6 py-6 sm:px-7 sm:py-7">
            <p className="mb-1 text-xs font-bold tracking-[0.17em] text-[color:var(--dash-heading-muted)] uppercase">
              Latest Payment
            </p>
            <div className="mt-4">
              <BillingDetailRow
                label="Status"
                value={<BillingStatusBadge status={latestPaymentStatus} />}
              />
              <BillingDetailRow
                label="Amount"
                value={formatCurrency(data.latestPayment?.amount ?? null, data.currency)}
              />
              <BillingDetailRow
                label="Method"
                value={formatPaymentMethod(data.latestPayment?.method)}
              />
              <BillingDetailRow
                label="Confirmed"
                value={formatDateLabel(data.latestPayment?.confirmedAt)}
              />
              <BillingDetailRow label="Reference" value={data.latestPayment?.reference ?? "—"} />
            </div>
          </BillingCard>
        </div>

        {/* ── Right / sticky column (desktop only) ── */}
        <aside className="space-y-5 self-start lg:sticky lg:top-[calc(var(--dash-header-height)+1rem)]">
          {/* Hosting & Service Period */}
          <BillingCard contentClassName="px-5 py-5 sm:px-6 sm:py-6">
            <p className="text-xs font-bold tracking-[0.17em] text-[color:var(--dash-heading-muted)] uppercase">
              Hosting &amp; Service Period
            </p>
            <div className="mt-4">
              <div className="flex items-center justify-between gap-5 border-b border-[color:var(--dash-divider)] py-3.5 last:border-b-0">
                <div className="flex items-center gap-2.5 text-[color:var(--dash-heading-muted)]">
                  <CalendarDays
                    className="h-4 w-4 shrink-0 text-[color:var(--dash-brand)]"
                    aria-hidden="true"
                  />
                  <span className="text-[15px] font-medium">Starts</span>
                </div>
                <span className="text-right text-[15px] font-semibold text-[color:var(--dash-foreground)]">
                  {formatServiceDateLabel(data.servicePeriod.startsAt, data.serviceState)}
                </span>
              </div>
              <div className="flex items-center justify-between gap-5 border-b border-[color:var(--dash-divider)] py-3.5 last:border-b-0">
                <div className="flex items-center gap-2.5 text-[color:var(--dash-heading-muted)]">
                  <CalendarDays
                    className="h-4 w-4 shrink-0 text-[color:var(--dash-brand)]"
                    aria-hidden="true"
                  />
                  <span className="text-[15px] font-medium">Ends</span>
                </div>
                <span className="text-right text-[15px] font-semibold text-[color:var(--dash-foreground)]">
                  {formatServiceDateLabel(data.servicePeriod.endsAt, data.serviceState)}
                </span>
              </div>
              <div className="flex items-center justify-between gap-5 py-3.5">
                <div className="flex items-center gap-2.5 text-[color:var(--dash-heading-muted)]">
                  <CalendarDays
                    className="h-4 w-4 shrink-0 text-[color:var(--dash-brand)]"
                    aria-hidden="true"
                  />
                  <span className="text-[15px] font-medium">Renewal</span>
                </div>
                <span className="text-right text-[15px] font-semibold text-[color:var(--dash-foreground)]">
                  {formatServiceDateLabel(data.servicePeriod.renewalAt, data.serviceState)}
                </span>
              </div>
            </div>
            <p className="mt-3 text-sm leading-relaxed font-medium text-[color:var(--dash-heading-muted)]">
              {data.serviceDescription}
            </p>
          </BillingCard>

          {/* Payment Instructions */}
          <BillingCard contentClassName="px-5 py-5 sm:px-6 sm:py-6">
            <BillingPaymentInstructions
              paymentInstructions={data.paymentInstructions}
              support={data.support}
            />
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
                <h3 className="text-base font-black text-[color:var(--dash-foreground)]">
                  Need help with billing?
                </h3>
                <p className="mt-1 text-sm leading-relaxed font-medium text-[color:var(--dash-heading-muted)]">
                  Contact WebSerbisyo for payment, receipt, or renewal questions.
                </p>
              </div>
            </div>
            {data.support.isEnabled && data.support.url ? (
              <Button
                asChild
                className="mt-5 h-11 w-full rounded-full bg-[color:var(--dash-brand)] px-5 text-sm font-black text-white shadow-[0_12px_26px_rgba(201,107,72,0.28)] hover:bg-[color:var(--dash-brand-hover)] focus-visible:ring-[color:color-mix(in_srgb,var(--dash-brand)_28%,white)]"
              >
                <a href={data.support.url} target="_blank" rel="noreferrer">
                  <span className="flex items-center justify-center gap-2">
                    {data.support.label}
                    <ChevronRight className="h-4 w-4" aria-hidden="true" />
                  </span>
                </a>
              </Button>
            ) : (
              <Button
                disabled
                className="mt-5 h-11 w-full rounded-full bg-[color:var(--dash-brand)] px-5 text-sm font-black text-white shadow-[0_12px_26px_rgba(201,107,72,0.2)] disabled:cursor-not-allowed disabled:opacity-70"
              >
                <span className="flex items-center justify-center gap-2">
                  {data.support.label}
                  <ChevronRight className="h-4 w-4" aria-hidden="true" />
                </span>
              </Button>
            )}
          </BillingCard>
        </aside>
      </div>
    </div>
  );
}

function formatCurrency(value: number | null, currency: string, fallback = "—") {
  if (value === null) {
    return fallback;
  }

  return new Intl.NumberFormat("en-PH", {
    currency,
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
    style: "currency",
  }).format(value);
}

function formatDateLabel(value: string | null | undefined) {
  if (!value) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-PH", {
    day: "numeric",
    month: "short",
    timeZone: "Asia/Manila",
    year: "numeric",
  }).format(new Date(value));
}

function formatPaymentMethod(value: string | null | undefined) {
  switch (value) {
    case "gcash":
      return "GCash";
    case "maya":
      return "Maya";
    case "manual":
      return "Manual";
    default:
      return value || "—";
  }
}

function formatServiceDateLabel(
  value: string | null,
  serviceState: BillingPageData["serviceState"],
) {
  if (!value) {
    return serviceState === "unpaid" ? "Pending" : "—";
  }

  return formatDateLabel(value);
}

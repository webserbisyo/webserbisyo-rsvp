"use client";

import { Globe, Star, User, Wallet } from "lucide-react";
import { ErrorState } from "@/components/feedback/error-state";
import { PaymentConfirmedDialog } from "@/components/dashboard/billing/payment-confirmed-dialog";
import { DashboardViewLoading } from "@/components/dashboard/dashboard-view-loading";
import { EventCountdownCard } from "@/components/dashboard/home/event-countdown-card";
import { HomeSummaryCard } from "@/components/dashboard/home/home-summary-card";
import { QuickStatsCard } from "@/components/dashboard/home/quick-stats-card";
import { RsvpWebsiteCard } from "@/components/dashboard/home/rsvp-website-card";
import { SetupChecklistCard } from "@/components/dashboard/home/setup-checklist-card";
import { useDashboardHomeQuery } from "@/lib/dashboard/dashboard-queries";
import type { DashboardHomeDto } from "@/lib/dashboard/dashboard-dtos";

export default function DashboardHomeView() {
  const query = useDashboardHomeQuery();

  if (!query.data) {
    if (query.isError) {
      return (
        <ErrorState
          title="Dashboard could not be loaded"
          description="Refresh the page or try again after checking your connection."
        />
      );
    }

    return <DashboardViewLoading view="home" />;
  }

  return <DashboardHomeContent summary={query.data} />;
}

function DashboardHomeContent({ summary }: { summary: DashboardHomeDto }) {
  return (
    <div className="ws-home-page pb-24 md:pb-8">
      {summary.payment.paymentId ? (
        <PaymentConfirmedDialog
          amountPaid={summary.payment.amountPaid}
          currency={summary.payment.currency}
          customerEmail={summary.payment.customerEmail}
          customerFullName={summary.payment.customerFullName}
          customerPhone={summary.payment.customerPhone}
          externalId={summary.payment.paymentId}
          paidAt={summary.payment.paidAt}
          paymentId={summary.payment.paymentId}
          paymentStatus={summary.payment.isConfirmed ? "confirmed" : summary.payment.status}
          planType={summary.client.planType}
        />
      ) : null}
      <section className="ws-intro">
        <div className="ws-intro-line">
          <h2>
            <span>Welcome back, {summary.profile.firstName}</span>
            <span className="ws-intro-sparkle" aria-hidden="true">
              ✦
            </span>
          </h2>
        </div>
      </section>

      {summary.warning ? (
        <div
          className="mb-4 rounded-2xl border border-[var(--dash-border)] bg-[var(--dash-brand-subtle)] px-4 py-3 text-sm text-[var(--dash-ink)]"
          role="status"
        >
          {summary.warning}
        </div>
      ) : null}

      <EventCountdownCard
        eventDateLabel={summary.event.eventDateLabel}
        eventDateTime={summary.event.eventDateTime}
        hasEventDate={summary.event.hasEventDate}
        hasEventTime={summary.event.hasEventTime}
        rsvpDeadlineLabel={summary.event.rsvpDeadlineLabel}
      />

      <section className="ws-summary-grid">
        <HomeSummaryCard
          chip="Primary account"
          chipTone="neutral"
          icon={<User size={22} />}
          label="Account"
          meta={summary.profile.email}
          subtitle="Primary account for managing your RSVP website and event setup."
          theme="neutral"
          title={summary.profile.roleLabel}
        />
        <HomeSummaryCard
          chip="Active"
          chipTone="success"
          icon={<Star size={22} />}
          label="Package"
          subtitle={summary.client.planDescription}
          theme="premium"
          title={summary.client.planLabel}
        />
        <HomeSummaryCard
          chip={summary.payment.isConfirmed ? "Confirmed" : summary.payment.status}
          chipTone={summary.payment.isConfirmed ? "success" : "warning"}
          icon={<Wallet size={22} />}
          label="Payment"
          subtitle={summary.payment.description}
          theme="warning"
          title={summary.payment.status}
        />
        <HomeSummaryCard
          chip={summary.event.statusChipLabel}
          chipTone={summary.event.isPublished ? "success" : "brand"}
          icon={<Globe size={22} />}
          label="Website"
          subtitle="Open your live RSVP page, manage guest access, and continue publishing updates."
          theme="website"
          title={summary.event.statusChipLabel}
        />
      </section>

      <section className="ws-bottom-grid">
        <SetupChecklistCard items={summary.checklist.items} />
        <div className="ws-right-stack">
          <RsvpWebsiteCard
            isShareable={summary.event.isShareable}
            publicUrl={summary.event.publicUrl}
            shareHint={summary.event.shareHint}
          />
          <QuickStatsCard
            coverageLabel={summary.stats.rsvpCoverageLabel}
            eventId={summary.stats.eventId}
            guestLimitValue={summary.stats.guestLimitValue}
            responsesLabel={summary.stats.responsesLabel}
          />
        </div>
      </section>
    </div>
  );
}

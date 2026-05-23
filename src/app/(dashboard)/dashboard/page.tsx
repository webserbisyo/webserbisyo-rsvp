import { Globe, Star, User, Wallet } from "lucide-react";
import { EventCountdownCard } from "@/components/dashboard/home/event-countdown-card";
import { HomeSummaryCard } from "@/components/dashboard/home/home-summary-card";
import { QuickStatsCard } from "@/components/dashboard/home/quick-stats-card";
import { RsvpWebsiteCard } from "@/components/dashboard/home/rsvp-website-card";
import { SetupChecklistCard } from "@/components/dashboard/home/setup-checklist-card";
import { getDashboardSummary } from "@/server/queries/dashboard";

export default async function DashboardPage() {
  const summary = await getDashboardSummary();

  return (
    <div className="ws-home-page pb-24 md:pb-8">
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

      <EventCountdownCard
        countdownStartAt={summary.event.countdownStartAt}
        eventDateTime={summary.event.eventDateTime}
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
          chip={summary.payment.isConfirmed ? "Confirmed" : "Pending review"}
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
          <RsvpWebsiteCard slug={summary.event.slug ?? null} />
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

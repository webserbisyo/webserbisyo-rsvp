import { Globe, Star, User, Wallet } from "lucide-react";
import { EventCountdownCard } from "@/components/dashboard/home/event-countdown-card";
import { HomeSummaryCard } from "@/components/dashboard/home/home-summary-card";
import { QuickStatsCard } from "@/components/dashboard/home/quick-stats-card";
import { RsvpWebsiteCard } from "@/components/dashboard/home/rsvp-website-card";
import { SetupChecklistCard } from "@/components/dashboard/home/setup-checklist-card";
import { getDashboardSummary } from "@/server/queries/dashboard";

export default async function DashboardPage() {
  const summary = await getDashboardSummary();

  const checklistItems = [
    {
      completed: true,
      id: "account",
      label: "Account created",
    },
    {
      completed: summary.checklist.paymentConfirmed,
      href: summary.checklist.paymentConfirmed ? undefined : "/dashboard/billing",
      id: "payment",
      label: "Payment confirmed",
    },
    {
      completed: summary.checklist.eventDetailsCompleted,
      href: "/dashboard/event",
      id: "details",
      label: "Event details",
    },
    {
      completed: summary.checklist.websiteContentCompleted,
      href: "/dashboard/website-content",
      id: "content",
      label: "Website content",
    },
    {
      completed: summary.checklist.websitePublished,
      href: "/dashboard/website-access",
      id: "publish",
      label: "RSVP page published",
    },
  ];

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
          <div className="ws-intro-event">
            <strong className="ws-intro-event-title" title={summary.event.title}>
              {summary.event.title}
            </strong>
            <span aria-hidden="true">·</span>
            <span className="ws-intro-venue" title={summary.event.venueLabel}>
              {summary.event.venueLabel}
            </span>
          </div>
        </div>
        <span className="ws-intro-pill">Client dashboard</span>
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
          chip={summary.event.isPublished ? "Published" : "Building"}
          chipTone={summary.event.isPublished ? "success" : "brand"}
          icon={<Globe size={22} />}
          label="Website"
          subtitle={summary.event.websiteDescription}
          theme="website"
          title={summary.event.websiteStatus}
        />
      </section>

      <section className="ws-bottom-grid">
        <SetupChecklistCard items={checklistItems} />
        <div className="ws-right-stack">
          <RsvpWebsiteCard
            isPublished={summary.event.isPublished}
            slug={summary.event.slug ?? null}
            status={summary.event.websiteStatus}
          />
          <QuickStatsCard
            coverageLabel={summary.stats.rsvpCoverageLabel}
            guestLimitLabel={summary.stats.guestLimitLabel}
            responsesLabel={summary.stats.responsesLabel}
          />
        </div>
      </section>
    </div>
  );
}

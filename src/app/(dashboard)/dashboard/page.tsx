import { getDashboardSummary } from "@/server/queries/dashboard";
import { formatUserRoleLabel } from "@/lib/auth/role-labels";
import { Badge } from "@/components/ui/badge";
import { User, Package, Wallet, Globe, Sparkles } from "lucide-react";
import { HomeSummaryCard } from "@/components/dashboard/home/home-summary-card";
import { EventCountdownCard } from "@/components/dashboard/home/event-countdown-card";
import { SetupChecklistCard } from "@/components/dashboard/home/setup-checklist-card";
import { RsvpWebsiteCard } from "@/components/dashboard/home/rsvp-website-card";
import { QuickStatsCard } from "@/components/dashboard/home/quick-stats-card";

export default async function DashboardPage() {
  const summary = await getDashboardSummary();
  
  const clientName = summary.profile.fullName ?? summary.client.contact_name ?? summary.client.name;
  
  // Format Payment
  const paymentStatus = summary.payment?.payment_status ? formatWords(summary.payment.payment_status) : "Pending";
  const paymentMeta = formatPaymentMeta(summary.payment?.amount_paid ?? null, summary.payment?.amount_due ?? null);
  const paymentColor = paymentStatus.toLowerCase() === "paid" || paymentStatus.toLowerCase() === "confirmed" ? "success" : "warning";

  // Format Plan
  const planName = summary.client.plan_type === "max" ? "Max" : "Pro";
  const planStatus = formatWords(summary.client.status);
  
  // Format Website
  const websiteStatusRaw = summary.event?.status === "published" && summary.client.custom_frontend_status === "connected" 
    ? "Published" 
    : summary.event?.status === "published" 
    ? "Published" 
    : "Draft";
  const websiteMeta = websiteStatusRaw === "Published" ? (summary.event?.visibility ? formatWords(summary.event.visibility) : "Public") : "Not published";
  const websiteColor = websiteStatusRaw === "Published" ? "brand" : "default";

  // Checklist items
  const checklistItems = [
    { id: "account", label: "Account created", completed: true },
    { id: "payment", label: "Payment confirmed", completed: paymentStatus.toLowerCase() === "paid" || paymentStatus.toLowerCase() === "confirmed", href: "/dashboard/billing" },
    { id: "details", label: "Event details", completed: Boolean(summary.event?.event_date && summary.application?.event_location), href: "/dashboard/event" },
    { id: "content", label: "Website content", completed: false, href: "/dashboard/website" },
    { id: "publish", label: "RSVP page published", completed: websiteStatusRaw === "Published", href: "/dashboard/event" },
  ];

  return (
    <div className="space-y-8">
      {/* Intro Row */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[var(--dash-foreground)]">
            Welcome back, {clientName.split(" ")[0]} <Sparkles className="inline h-5 w-5 text-[var(--dash-brand)]" />
          </h1>
          <p className="text-[var(--dash-muted)]">
            {summary.event?.title ?? "Your Event"} &middot; {summary.application?.event_location ?? "Venue pending"}
          </p>
        </div>
        <Badge variant="outline" className="w-fit border-[var(--dash-border)] bg-[var(--dash-surface-muted)] text-[var(--dash-muted)]">
          Client dashboard
        </Badge>
      </div>

      {/* Hero Countdown */}
      <EventCountdownCard 
        eventDate={summary.event?.event_date ?? null} 
        eventTime={summary.event?.event_time ?? null} 
      />

      {/* Four Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <HomeSummaryCard
          title="ACCOUNT"
          icon={<User className="h-5 w-5" />}
          primary={formatUserRoleLabel(summary.profile.role)}
          secondary={summary.profile.email}
          status="Primary account"
        />
        <HomeSummaryCard
          title="PACKAGE"
          icon={<Package className="h-5 w-5" />}
          primary={planName}
          secondary={planStatus}
          status="Active"
          statusColor="brand"
        />
        <HomeSummaryCard
          title="PAYMENT"
          icon={<Wallet className="h-5 w-5" />}
          primary={paymentStatus}
          secondary={paymentMeta}
          status={paymentStatus === "Pending" ? "Pending review" : "Confirmed"}
          statusColor={paymentColor}
        />
        <HomeSummaryCard
          title="WEBSITE"
          icon={<Globe className="h-5 w-5" />}
          primary={websiteStatusRaw}
          secondary={websiteMeta}
          status={websiteStatusRaw === "Draft" ? "Setup in progress" : "Live"}
          statusColor={websiteColor}
        />
      </div>

      {/* Bottom Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <SetupChecklistCard items={checklistItems} />
        </div>
        <div className="space-y-6 lg:col-span-2">
          <div className="grid gap-6 sm:grid-cols-2">
            <RsvpWebsiteCard 
              slug={summary.event?.event_slug ?? null}
              status={websiteStatusRaw}
              isPublished={websiteStatusRaw === "Published"}
            />
            <QuickStatsCard 
              coverageDays={365} 
              guestLimit={200} 
              responsesCount={0} 
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function formatWords(value: string) {
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatPaymentMeta(amountPaid: number | null, amountDue: number | null) {
  if (amountPaid !== null) {
    return formatCurrency(amountPaid);
  }
  if (amountDue !== null) {
    return `Due ${formatCurrency(amountDue)}`;
  }
  return "No confirmed amount";
}

function formatCurrency(value: number | null) {
  if (value === null) return "No confirmed amount";
  return new Intl.NumberFormat("en-PH", {
    currency: "PHP",
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
    style: "currency",
  }).format(value);
}

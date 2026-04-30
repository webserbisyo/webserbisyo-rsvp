import { getDashboardSummary } from "@/server/queries/dashboard";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function DashboardPage() {
  const summary = await getDashboardSummary();

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.12),transparent_34rem),linear-gradient(180deg,#ffffff,#f8fafc)] p-4 sm:p-8">
      <div className="mx-auto grid max-w-6xl gap-6">
        <section className="space-y-3">
          <Badge variant="outline">Client dashboard preview</Badge>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            {summary.client.name}
          </h1>
          <p className="text-muted-foreground max-w-3xl leading-7">
            This read-only dashboard placeholder confirms your client workspace, event setup, and
            payment/access status. Full client admin tools will be added later.
          </p>
        </section>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <SummaryCard
            title="Role"
            value={formatWords(summary.profile.role)}
            meta={summary.profile.email}
          />
          <SummaryCard
            title="Package"
            value={formatPlan(summary.client.plan_type)}
            meta={formatWords(summary.client.status)}
          />
          <SummaryCard
            title="Payment"
            value={formatPayment(summary.payment?.payment_status ?? null)}
            meta={formatCurrency(summary.payment?.amount_paid ?? null)}
          />
          <SummaryCard
            title="Website Access"
            value={formatWords(summary.client.custom_frontend_status)}
            meta={formatAccessWindow(summary.client.hosting_ends_at)}
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="rounded-3xl">
            <CardHeader>
              <CardTitle>Event</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <DefinitionList
                rows={[
                  ["Event name", summary.event?.title ?? "Not configured yet"],
                  ["Type", summary.event?.event_type ? formatWords(summary.event.event_type) : "—"],
                  ["Date", formatDate(summary.event?.event_date ?? null)],
                  ["Status", summary.event?.status ? formatWords(summary.event.status) : "—"],
                  [
                    "Visibility",
                    summary.event?.visibility ? formatWords(summary.event.visibility) : "—",
                  ],
                  ["Reserved slug", summary.event?.event_slug ?? "—"],
                ]}
              />
            </CardContent>
          </Card>

          <Card className="rounded-3xl">
            <CardHeader>
              <CardTitle>Onboarding</CardTitle>
            </CardHeader>
            <CardContent>
              <DefinitionList
                rows={[
                  ["Owner", summary.profile.fullName ?? "Client user"],
                  ["Email", summary.profile.email],
                  [
                    "Onboarding email",
                    summary.onboardingEmail?.status
                      ? formatWords(summary.onboardingEmail.status)
                      : "Not sent yet",
                  ],
                  ["Last update", formatDateTime(summary.onboardingEmail?.updated_at ?? null)],
                  ["Client admin", "Read-only placeholder"],
                ]}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}

function SummaryCard({ meta, title, value }: { meta: string; title: string; value: string }) {
  return (
    <Card className="rounded-3xl">
      <CardHeader className="pb-2">
        <CardTitle className="text-muted-foreground text-sm font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-1">
        <p className="text-2xl font-semibold">{value}</p>
        <p className="text-muted-foreground truncate text-sm">{meta}</p>
      </CardContent>
    </Card>
  );
}

function DefinitionList({ rows }: { rows: Array<[string, string]> }) {
  return (
    <dl className="grid gap-3">
      {rows.map(([label, value]) => (
        <div key={label} className="grid gap-1 sm:grid-cols-[9rem_minmax(0,1fr)]">
          <dt className="text-muted-foreground text-sm">{label}</dt>
          <dd className="min-w-0 text-sm font-medium break-words">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

function formatPlan(value: string) {
  return value === "max" ? "Max" : "Pro";
}

function formatPayment(value: string | null) {
  return value ? formatWords(value) : "Pending";
}

function formatAccessWindow(value: string | null) {
  return value ? `Until ${formatDateTime(value)}` : "Not configured yet";
}

function formatCurrency(value: number | null) {
  if (value === null) {
    return "No confirmed amount";
  }

  return new Intl.NumberFormat("en-PH", {
    currency: "PHP",
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
    style: "currency",
  }).format(value);
}

function formatDate(value: string | null) {
  if (!value) {
    return "Not scheduled";
  }

  return new Intl.DateTimeFormat("en-PH", {
    dateStyle: "medium",
    timeZone: "Asia/Manila",
  }).format(new Date(`${value}T00:00:00.000Z`));
}

function formatDateTime(value: string | null) {
  if (!value) {
    return "Not available";
  }

  return new Intl.DateTimeFormat("en-PH", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Manila",
  }).format(new Date(value));
}

function formatWords(value: string) {
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

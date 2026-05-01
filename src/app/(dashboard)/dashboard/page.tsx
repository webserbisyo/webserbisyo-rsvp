import { getDashboardSummary } from "@/server/queries/dashboard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function DashboardPage() {
  const summary = await getDashboardSummary();
  const publicPageUrl = getPublicPageUrl(
    summary.client.custom_frontend_url,
    summary.event?.event_slug ?? null,
  );
  const onboardingStatus = summary.onboardingEmail?.status
    ? formatWords(summary.onboardingEmail.status)
    : "Not sent yet";

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(232,109,82,0.14),transparent_28rem),radial-gradient(circle_at_top_right,rgba(215,181,109,0.12),transparent_24rem),linear-gradient(180deg,#fbf5ee,#f8f1e8)] px-4 py-6 sm:px-6 sm:py-10">
      <div className="mx-auto grid max-w-6xl gap-6">
        <section className="overflow-hidden rounded-[2rem] border border-stone-200/80 bg-white/80 p-6 shadow-[0_30px_80px_-40px_rgba(54,36,28,0.35)] backdrop-blur sm:p-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-3">
              <Badge variant="outline" className="border-[#e9c59c] bg-[#fff8ef] text-[#9a593f]">
                Client dashboard
              </Badge>
              <div className="space-y-2">
                <h1 className="text-3xl font-semibold tracking-tight text-stone-950 sm:text-4xl">
                  Welcome,{" "}
                  {summary.profile.fullName ?? summary.client.contact_name ?? summary.client.name}
                </h1>
                <p className="max-w-3xl text-sm leading-7 text-stone-600 sm:text-base">
                  Review your account, event, payment, and website access details in one place.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              {publicPageUrl ? (
                <Button asChild className="bg-[#e86d52] text-white hover:bg-[#d95b3f]">
                  <a href={publicPageUrl} target="_blank" rel="noreferrer">
                    Open public page
                  </a>
                </Button>
              ) : null}
              <Button asChild variant="outline">
                <a href="mailto:webserbisyo@gmail.com">Contact WebSerbisyo</a>
              </Button>
            </div>
          </div>
        </section>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <SummaryCard
            title="Account"
            value={formatWords(summary.profile.role)}
            meta={summary.client.contact_email ?? summary.profile.email}
          />
          <SummaryCard
            title="Package"
            value={formatPlan(summary.client.plan_type)}
            meta={formatWords(summary.client.status)}
          />
          <SummaryCard
            title="Payment"
            value={formatPayment(summary.payment?.payment_status ?? null)}
            meta={formatPaymentMeta(
              summary.payment?.amount_paid ?? null,
              summary.payment?.amount_due ?? null,
            )}
          />
          <SummaryCard
            title="Website Access"
            value={formatWords(summary.client.custom_frontend_status)}
            meta={formatAccessWindow(summary.client.hosting_ends_at)}
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="rounded-[1.75rem] border-stone-200/80 bg-white/80">
            <CardHeader>
              <CardTitle className="text-stone-950">Event</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <DefinitionList
                rows={[
                  ["Event title", summary.event?.title ?? "Not configured yet"],
                  ["Type", summary.event?.event_type ? formatWords(summary.event.event_type) : "—"],
                  ["Date", formatDate(summary.event?.event_date ?? null)],
                  ["Venue", summary.application?.event_location ?? "Not provided yet"],
                  ["Status", summary.event?.status ? formatWords(summary.event.status) : "—"],
                  [
                    "Visibility",
                    summary.event?.visibility ? formatWords(summary.event.visibility) : "—",
                  ],
                  ["Public page", publicPageUrl ?? "Not available yet"],
                ]}
              />
            </CardContent>
          </Card>

          <Card className="rounded-[1.75rem] border-stone-200/80 bg-white/80">
            <CardHeader>
              <CardTitle className="text-stone-950">Account and support</CardTitle>
            </CardHeader>
            <CardContent>
              <DefinitionList
                rows={[
                  ["Client name", summary.client.name],
                  ["Contact email", summary.client.contact_email ?? summary.profile.email],
                  ["Role", formatWords(summary.profile.role)],
                  ["Onboarding email", onboardingStatus],
                  [
                    "Last access email",
                    formatDateTime(summary.onboardingEmail?.updated_at ?? null),
                  ],
                  [
                    "Password help",
                    "Use Forgot password from the sign-in page if you need a new temporary password.",
                  ],
                ]}
              />
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <Card className="rounded-[1.75rem] border-stone-200/80 bg-white/80">
            <CardHeader>
              <CardTitle className="text-stone-950">Package and payment</CardTitle>
            </CardHeader>
            <CardContent>
              <DefinitionList
                rows={[
                  ["Plan", formatPlan(summary.client.plan_type)],
                  ["Payment status", formatPayment(summary.payment?.payment_status ?? null)],
                  ["Amount paid", formatCurrency(summary.payment?.amount_paid ?? null)],
                  ["Amount due", formatCurrency(summary.payment?.amount_due ?? null)],
                  [
                    "Payment method",
                    summary.payment?.payment_method
                      ? formatWords(summary.payment.payment_method)
                      : "Manual confirmation",
                  ],
                  ["Confirmed at", formatDateTime(summary.payment?.paid_at ?? null)],
                ]}
              />
            </CardContent>
          </Card>

          <Card className="rounded-[1.75rem] border-stone-200/80 bg-white/80">
            <CardHeader>
              <CardTitle className="text-stone-950">Website access</CardTitle>
            </CardHeader>
            <CardContent>
              <DefinitionList
                rows={[
                  ["Access status", formatWords(summary.client.custom_frontend_status)],
                  ["Access window", formatAccessWindow(summary.client.hosting_ends_at)],
                  ["Starts", formatDateTime(summary.client.hosting_starts_at ?? null)],
                  ["Ends", formatDateTime(summary.client.hosting_ends_at ?? null)],
                  ["Custom frontend", summary.client.custom_frontend_url ?? "Not connected yet"],
                  ["Support", summary.onboardingEmail?.recipient_email ?? summary.profile.email],
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

function formatPaymentMeta(amountPaid: number | null, amountDue: number | null) {
  if (amountPaid !== null) {
    return formatCurrency(amountPaid);
  }

  if (amountDue !== null) {
    return `Due ${formatCurrency(amountDue)}`;
  }

  return "No confirmed amount";
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

function getPublicPageUrl(customUrl: string | null, eventSlug: string | null) {
  if (customUrl) {
    return customUrl;
  }

  if (!eventSlug) {
    return null;
  }

  const baseUrl = process.env.APP_BASE_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? "";

  if (!baseUrl) {
    return `/r/${eventSlug}`;
  }

  return `${baseUrl.replace(/\/+$/, "")}/r/${eventSlug}`;
}

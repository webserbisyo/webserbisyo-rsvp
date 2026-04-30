import type { ReactNode } from "react";
import Link from "next/link";
import type { ClientDetailResult, ClientDetailView } from "@/server/queries/admin-clients";
import {
  ClientEventLifecycleBadge,
  ClientEventSetupStatusBadge,
  ClientHostingLifecycleBadge,
  ClientLifecycleStatusBadge,
  ClientPaymentStatusBadge,
  ClientPlanBadge,
  ClientStoredStatusBadge,
} from "@/components/clients/client-badges";
import { ErrorState } from "@/components/feedback/error-state";
import { SectionCard } from "@/components/shared/section-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";

type ClientDetailSectionsProps = {
  client: ClientDetailView;
  errors?: ClientDetailResult["errors"];
};

export function ClientDetailSections({ client, errors }: ClientDetailSectionsProps) {
  return (
    <div className="grid items-start gap-4 xl:grid-cols-2">
      <SectionCard className="h-fit" title="Client Summary">
        <DefinitionList
          rows={[
            ["Client name", client.client.name],
            ["Email", client.client.email],
            ["Phone", client.client.phone ?? "—"],
            [
              "Plan",
              <ClientPlanBadge
                key="client-plan"
                label={client.client.planLabel}
                plan={client.client.plan}
              />,
            ],
            [
              "Client status",
              <ClientStoredStatusBadge
                key="client-status"
                label={client.client.statusLabel}
                status={client.client.status}
              />,
            ],
            [
              "Lifecycle status",
              <ClientLifecycleStatusBadge
                key="lifecycle-status"
                label={client.status.label}
                status={client.status.value}
              />,
            ],
            ["Created at", formatDateTime(client.client.createdAt)],
            ["Updated at", formatDateTime(client.client.updatedAt)],
          ]}
        />
      </SectionCard>

      <SectionCard className="h-fit" title="Linked Application">
        {errors?.application ? (
          <ErrorState
            title="Linked application could not be loaded"
            description="Refresh the page or try again."
          />
        ) : client.application.id ? (
          <div className="space-y-4">
            <DefinitionList
              rows={[
                ["Reference", client.application.referenceCode ?? client.application.id],
                [
                  "Status",
                  <StatusBadge key="application-status" tone="muted">
                    {client.application.statusLabel ?? "—"}
                  </StatusBadge>,
                ],
                ["Submitted at", formatDateTime(client.application.submittedAt)],
                ["Approved at", formatDateTime(client.application.approvedAt)],
              ]}
            />
            {client.application.href ? (
              <Button asChild size="sm" variant="outline">
                <Link href={client.application.href}>View application</Link>
              </Button>
            ) : null}
          </div>
        ) : (
          <p className="text-muted-foreground text-sm">No linked application found.</p>
        )}
      </SectionCard>

      <SectionCard className="h-fit" title="Event Setup">
        {errors?.event ? (
          <ErrorState
            title="Linked event could not be loaded"
            description="Refresh the page or try again."
          />
        ) : client.event.id ? (
          <div className="space-y-4">
            <DefinitionList
              rows={[
                ["Event type", client.event.type ?? "—"],
                ["Event date", formatDate(client.event.date)],
                ["Location", client.event.location ?? "—"],
                ["Guest count", formatNumber(client.event.guestCount)],
                [
                  "Event status",
                  client.event.statusLabel ? (
                    <StatusBadge key="event-status" tone="muted">
                      {client.event.statusLabel}
                    </StatusBadge>
                  ) : (
                    "—"
                  ),
                ],
                [
                  "Setup status",
                  <ClientEventSetupStatusBadge
                    key="event-setup"
                    label={client.event.setupStatusLabel}
                    status={client.event.setupStatus}
                  />,
                ],
                [
                  "Event lifecycle",
                  <ClientEventLifecycleBadge
                    key="event-lifecycle"
                    label={client.event.lifecycleLabel}
                    lifecycle={client.event.lifecycle}
                  />,
                ],
                [
                  "Visibility",
                  client.event.visibility ? formatWords(client.event.visibility) : "—",
                ],
                [
                  "Public preview",
                  client.event.publicUrl ? (
                    <Link
                      key="event-public-preview"
                      href={client.event.publicUrl}
                      className="text-rsvp-brand underline underline-offset-4"
                    >
                      {client.event.publicUrl}
                    </Link>
                  ) : (
                    client.event.publicPreviewLabel
                  ),
                ],
                ["Reserved slug", client.event.slug ?? "—"],
              ]}
            />
          </div>
        ) : (
          <p className="text-muted-foreground text-sm">No event created yet.</p>
        )}
      </SectionCard>

      <SectionCard className="h-fit" title="Payment and Website Access">
        {errors?.payment ? (
          <ErrorState
            title="Payment and access details could not be loaded"
            description="Refresh the page or try again."
          />
        ) : (
          <div className="space-y-5">
            <div className="space-y-3">
              <div className="space-y-1">
                <p className="text-muted-foreground text-xs font-medium">Payment</p>
                <ClientPaymentStatusBadge
                  label={client.payment.statusLabel}
                  status={client.payment.status}
                />
              </div>
              <DefinitionList
                rows={[
                  ["Amount due", formatCurrency(client.payment.amountDue)],
                  ["Amount paid", formatCurrency(client.payment.amountPaid)],
                  ["Method", client.payment.methodLabel],
                  ["Reference", client.payment.referenceNumber ?? "—"],
                  ["Confirmed at", formatDateTime(client.payment.paidAt)],
                ]}
              />
              {client.payment.refund ? (
                <DefinitionList
                  rows={[
                    ["Refund amount", formatCurrency(client.payment.refund.amount)],
                    ["Refund method", client.payment.refund.methodLabel],
                    ["Refund reference", client.payment.refund.referenceNumber ?? "—"],
                    ["Refunded at", formatDateTime(client.payment.refund.confirmedAt)],
                    ["Refund note", client.payment.refund.note ?? "—"],
                  ]}
                />
              ) : null}
            </div>

            <div className="space-y-3">
              <div className="space-y-1">
                <p className="text-muted-foreground text-xs font-medium">Website access</p>
                <ClientHostingLifecycleBadge
                  label={client.hosting.lifecycleLabel}
                  lifecycle={client.hosting.lifecycle}
                />
              </div>
              <DefinitionList
                rows={[
                  ["Website access", client.client.customFrontendStatusLabel],
                  ["Website URL", client.client.customFrontendUrl ?? "—"],
                  ["Access starts", formatDateTime(client.hosting.startsAt)],
                  ["Access ends", formatDateTime(client.hosting.endsAt)],
                  [
                    "Access ending notice",
                    formatDateTime(client.hosting.renewalRequiredAt, "Not scheduled"),
                  ],
                ]}
              />
            </div>
          </div>
        )}
      </SectionCard>

      <SectionCard className="h-fit" title="Owner / Onboarding">
        {errors?.onboarding ? (
          <ErrorState
            title="Onboarding records could not be loaded"
            description="Refresh the page or try again."
          />
        ) : client.onboarding.ownerProfileId || client.onboarding.lastEmailSentAt ? (
          <DefinitionList
            rows={[
              ["Owner profile ID", client.onboarding.ownerProfileId ?? "—"],
              ["Owner email", client.onboarding.ownerEmail ?? "—"],
              ["Owner name", client.onboarding.ownerName ?? "—"],
              [
                "Profile role",
                client.onboarding.profileRole ? formatWords(client.onboarding.profileRole) : "—",
              ],
              [
                "Onboarding email status",
                client.onboarding.emailStatus ? (
                  <StatusBadge key="onboarding-status" tone="muted">
                    {formatWords(client.onboarding.emailStatus)}
                  </StatusBadge>
                ) : (
                  "—"
                ),
              ],
              ["Last onboarding email", formatDateTime(client.onboarding.lastEmailSentAt)],
            ]}
          />
        ) : (
          <p className="text-muted-foreground text-sm">
            Onboarding status will appear after provisioning email records are available.
          </p>
        )}
      </SectionCard>

      <SectionCard className="h-fit" title="Lifecycle / Cleanup">
        <DefinitionList
          rows={[
            [
              "Lifecycle status",
              <ClientLifecycleStatusBadge
                key="cleanup-status"
                label={client.status.label}
                status={client.status.value}
              />,
            ],
            ["Event passed", client.cleanup.eventPassed ? "Yes" : "No"],
            ["Access expired", client.cleanup.hostingExpired ? "Yes" : "No"],
            ["Archive eligible", client.cleanup.archiveEligible ? "Yes" : "No"],
            ["Delete eligible", client.cleanup.deleteEligible ? "Yes" : "Not yet"],
            ["Delete rule", formatWords(client.cleanup.deleteEligibilityReasonCode)],
            ["Delete reason", client.cleanup.deleteEligibilityReason],
          ]}
        />
      </SectionCard>

      <SectionCard className="h-fit xl:col-span-2" title="Activity / Audit Preview">
        {errors?.activity ? (
          <ErrorState
            title="Activity could not be loaded"
            description="Refresh the page or try again."
          />
        ) : client.activity.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            Detailed activity history will be available in a later phase.
          </p>
        ) : (
          <ol className="space-y-3">
            {client.activity.map((activity) => (
              <li key={activity.id} className="flex min-w-0 gap-3">
                <div className="bg-rsvp-brand mt-1 size-2 shrink-0 rounded-full" />
                <div className="min-w-0 space-y-1">
                  <p className="truncate text-sm font-medium">{activity.actionLabel}</p>
                  <p className="text-muted-foreground text-xs">
                    {formatDateTime(activity.createdAt)}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        )}
      </SectionCard>
    </div>
  );
}

function DefinitionList({ rows }: { rows: Array<[string, ReactNode]> }) {
  return (
    <dl className="grid gap-3">
      {rows.map(([label, value]) => (
        <div key={label} className="grid min-w-0 gap-1 sm:grid-cols-[11rem_minmax(0,1fr)]">
          <dt className="text-muted-foreground text-xs font-medium">{label}</dt>
          <dd className="text-foreground min-w-0 text-sm break-words">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

function formatDateTime(value: string | null, fallback = "—") {
  if (!value) {
    return fallback;
  }

  return new Intl.DateTimeFormat("en-PH", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Manila",
  }).format(new Date(value));
}

function formatDate(value: string | null) {
  if (!value) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-PH", {
    dateStyle: "medium",
    timeZone: "Asia/Manila",
  }).format(new Date(`${value}T00:00:00.000Z`));
}

function formatCurrency(value: number | null) {
  if (value === null) {
    return "—";
  }

  return new Intl.NumberFormat("en-PH", {
    currency: "PHP",
    style: "currency",
  }).format(value);
}

function formatNumber(value: number | null) {
  if (value === null) {
    return "—";
  }

  return new Intl.NumberFormat("en-PH").format(value);
}

function formatWords(value: string) {
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

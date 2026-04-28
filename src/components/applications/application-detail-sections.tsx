import type { ReactNode } from "react";
import type { ApplicationDetailView } from "@/server/queries/admin-applications";
import {
  ApplicationPlanBadge,
  ApplicationStatusBadge,
  PaymentPreferenceBadge,
} from "@/components/applications/application-badges";
import { ErrorState } from "@/components/feedback/error-state";
import { SectionCard } from "@/components/shared/section-card";

type ApplicationDetailSectionsProps = {
  activityError?: string;
  application: ApplicationDetailView;
};

export function ApplicationDetailSections({
  activityError,
  application,
}: ApplicationDetailSectionsProps) {
  return (
    <div className="grid items-start gap-4 xl:grid-cols-2">
      <SectionCard className="h-fit" title="Applicant Summary">
        <DefinitionList
          rows={[
            ["Full name", application.applicant.fullName],
            ["Email", application.applicant.email],
            ["Phone", application.applicant.phone ?? "—"],
            ["Submitted at", formatDateTime(application.timestamps.submittedAt)],
            ["Updated at", formatDateTime(application.timestamps.updatedAt)],
          ]}
        />
      </SectionCard>

      <SectionCard className="h-fit" title="Event Request">
        <DefinitionList
          rows={[
            ["Event type", application.event.type],
            ["Event date", formatDate(application.event.date)],
            ["Event location", application.event.location ?? "—"],
            [
              "Estimated guests",
              application.event.estimatedGuestCount
                ? String(application.event.estimatedGuestCount)
                : "—",
            ],
          ]}
        />
        <div className="mt-4 min-w-0 space-y-1">
          <p className="text-muted-foreground text-xs font-medium">Message / notes</p>
          <p className="text-foreground max-h-40 overflow-hidden text-sm leading-6 break-words">
            {application.event.message ?? "—"}
          </p>
        </div>
      </SectionCard>

      <SectionCard className="h-fit" title="Plan and Payment Preference">
        <DefinitionList
          rows={[
            [
              "Preferred plan",
              <ApplicationPlanBadge
                key="preferred-plan"
                label={application.plan.preferredPlanLabel}
                plan={application.plan.preferredPlan}
              />,
            ],
            [
              "Preferred manual payment option",
              <PaymentPreferenceBadge
                key="preferred-payment"
                label={application.plan.preferredManualPaymentOptionLabel}
                paymentPreference={application.plan.preferredManualPaymentOption}
              />,
            ],
          ]}
        />
      </SectionCard>

      <SectionCard className="h-fit" title="Review State">
        <div className="space-y-4">
          <DefinitionList
            rows={[
              [
                "Reviewed at",
                application.review.reviewedAt
                  ? formatDateTime(application.review.reviewedAt)
                  : "Not reviewed yet",
              ],
              [
                "Approved at",
                application.review.approvedAt ? formatDateTime(application.review.approvedAt) : "—",
              ],
              [
                "Rejected at",
                application.review.rejectedAt ? formatDateTime(application.review.rejectedAt) : "—",
              ],
            ]}
          />
          <div className="space-y-1">
            <p className="text-muted-foreground text-xs font-medium">Current status</p>
            <ApplicationStatusBadge
              label={application.review.statusLabel}
              status={application.review.status}
            />
          </div>
          <div className="min-w-0 space-y-1">
            <p className="text-muted-foreground text-xs font-medium">Internal notes</p>
            <p className="text-foreground max-h-40 overflow-hidden text-sm leading-6 break-words">
              {application.review.internalNotes ?? "—"}
            </p>
          </div>
        </div>
      </SectionCard>

      <SectionCard className="h-fit xl:col-span-2" title="Activity / Audit Preview">
        {activityError ? (
          <ErrorState
            title="Activity could not be loaded"
            description="Refresh the page or try again."
          />
        ) : application.activity.length === 0 ? (
          <p className="text-muted-foreground text-sm">No activity records yet.</p>
        ) : (
          <ol className="space-y-3">
            {application.activity.map((activity) => (
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

function formatDateTime(value: string | null) {
  if (!value) {
    return "—";
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

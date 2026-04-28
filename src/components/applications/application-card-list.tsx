import Link from "next/link";
import type { ApplicationListItem } from "@/server/queries/admin-applications";
import {
  ApplicationPlanBadge,
  ApplicationStatusBadge,
  PaymentPreferenceBadge,
} from "@/components/applications/application-badges";
import { EmptyState } from "@/components/feedback/empty-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

type ApplicationCardListProps = {
  hasActiveFilters: boolean;
  items: ApplicationListItem[];
};

export function ApplicationCardList({ hasActiveFilters, items }: ApplicationCardListProps) {
  if (items.length === 0) {
    return (
      <div className="xl:hidden">
        <EmptyState
          title={hasActiveFilters ? "No matching applications" : "No applications yet"}
          description={
            hasActiveFilters
              ? "Try clearing filters or changing the status tab."
              : "Applications from the public apply form will appear here."
          }
        />
      </div>
    );
  }

  return (
    <div className="grid gap-3 xl:hidden">
      {items.map((application) => (
        <Card key={application.id} className="shadow-none">
          <CardContent className="grid min-w-0 gap-4 p-4">
            <div className="min-w-0 space-y-1">
              <p className="truncate font-medium">{application.fullName}</p>
              <p className="text-muted-foreground text-sm break-all">{application.email}</p>
              {application.phone ? (
                <p className="text-muted-foreground text-xs break-words">{application.phone}</p>
              ) : null}
            </div>

            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <ApplicationPlanBadge
                label={application.preferredPlanLabel}
                plan={application.preferredPlan}
              />
              <PaymentPreferenceBadge
                label={application.preferredManualPaymentOptionLabel}
                paymentPreference={application.preferredManualPaymentOption}
              />
              <ApplicationStatusBadge label={application.statusLabel} status={application.status} />
            </div>

            <div className="grid min-w-0 gap-2 text-sm">
              <div className="min-w-0">
                <p className="font-medium">{application.eventType}</p>
                <p className="text-muted-foreground text-xs">
                  {application.eventDate ? formatDate(application.eventDate) : "No event date"}
                </p>
                <p className="text-muted-foreground text-xs break-words">
                  {application.eventLocation ?? "No location"}
                </p>
              </div>
              <p className="text-muted-foreground break-words">
                Payment preference: {application.preferredManualPaymentOptionLabel}
              </p>
              <p className="text-muted-foreground">
                Submitted {formatDateTime(application.submittedAt)}
              </p>
              <p className="text-muted-foreground">
                Updated {formatDateTime(application.updatedAt)}
              </p>
            </div>

            <Button asChild variant="outline">
              <Link href={application.href}>View</Link>
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
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

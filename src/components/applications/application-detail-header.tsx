import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { ApplicationDetailView } from "@/server/queries/admin-applications";
import {
  ApplicationPlanBadge,
  ApplicationStatusBadge,
  PaymentPreferenceBadge,
} from "@/components/applications/application-badges";
import { Button } from "@/components/ui/button";

type ApplicationDetailHeaderProps = {
  application: ApplicationDetailView;
};

export function ApplicationDetailHeader({ application }: ApplicationDetailHeaderProps) {
  const title = application.applicant.fullName || "Application";

  return (
    <div className="space-y-4">
      <Button asChild variant="ghost" className="w-fit">
        <Link href="/admin/applications">
          <ArrowLeft className="size-4" />
          Back to applications
        </Link>
      </Button>

      <div className="space-y-3">
        <div className="space-y-1">
          <p className="text-muted-foreground text-sm">
            Application reference {application.referenceCode}
          </p>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h1>
          <p className="text-muted-foreground text-sm leading-6">
            Review the submitted request, linked records, and workflow state before approval and
            client creation.
          </p>
        </div>
        <div className="flex min-w-0 flex-wrap gap-2">
          <ApplicationStatusBadge
            label={application.review.statusLabel}
            status={application.review.status}
          />
          <ApplicationPlanBadge
            label={application.plan.preferredPlanLabel}
            plan={application.plan.preferredPlan}
          />
          <PaymentPreferenceBadge
            label={application.plan.preferredManualPaymentOptionLabel}
            paymentPreference={application.plan.preferredManualPaymentOption}
          />
        </div>
      </div>
    </div>
  );
}

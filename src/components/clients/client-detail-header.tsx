import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { ClientDetailView } from "@/server/queries/admin-clients";
import {
  ClientEventLifecycleBadge,
  ClientEventSetupStatusBadge,
  ClientPaymentStatusBadge,
  ClientPlanBadge,
  ClientStoredStatusBadge,
} from "@/components/clients/client-badges";
import { Button } from "@/components/ui/button";

type ClientDetailHeaderProps = {
  client: ClientDetailView;
};

export function ClientDetailHeader({ client }: ClientDetailHeaderProps) {
  const isPaymentPending = client.payment.status === "pending";
  const canCancelClient =
    isPaymentPending && client.client.status !== "archived" && client.client.status !== "cancelled";

  return (
    <div className="space-y-4">
      <Button asChild variant="ghost" className="w-fit">
        <Link href="/admin/clients">
          <ArrowLeft className="size-4" />
          Back to clients
        </Link>
      </Button>

      <div className="flex min-w-0 flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 space-y-3">
          <div className="space-y-1">
            <p className="text-muted-foreground text-sm">Client ID {client.id}</p>
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              {client.client.name}
            </h1>
            <p className="text-muted-foreground text-sm leading-6">
              Review linked application, event, payment, onboarding, and cleanup context for this
              approved RSVP client.
            </p>
          </div>
          <div className="flex min-w-0 flex-wrap gap-2">
            <ClientPlanBadge label={client.client.planLabel} plan={client.client.plan} />
            <ClientStoredStatusBadge
              label={client.client.statusLabel}
              status={client.client.status}
            />
            <ClientPaymentStatusBadge
              label={client.payment.statusLabel}
              status={client.payment.status}
            />
            <ClientEventLifecycleBadge
              label={client.event.lifecycleLabel}
              lifecycle={client.event.lifecycle}
            />
            <ClientEventSetupStatusBadge
              label={client.event.setupStatusLabel}
              status={client.event.setupStatus}
            />
          </div>
        </div>

        <div className="flex shrink-0 flex-wrap gap-2 lg:justify-end">
          <Button
            type="button"
            disabled
            title={isPaymentPending ? "Enabled in Checkpoint C3" : "Payment is not pending"}
            className="bg-rsvp-brand text-rsvp-brand-foreground hover:bg-rsvp-brand/90"
          >
            Mark as Paid
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled
            title={canCancelClient ? "Enabled in Checkpoint C3" : "Client cannot be cancelled"}
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}

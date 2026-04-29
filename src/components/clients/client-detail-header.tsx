import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { ClientDetailView } from "@/server/queries/admin-clients";
import {
  ClientEventLifecycleBadge,
  ClientHostingLifecycleBadge,
  ClientPaymentStatusBadge,
  ClientPlanBadge,
  ClientStoredStatusBadge,
} from "@/components/clients/client-badges";
import { Button } from "@/components/ui/button";

type ClientDetailHeaderProps = {
  client: ClientDetailView;
};

export function ClientDetailHeader({ client }: ClientDetailHeaderProps) {
  return (
    <div className="space-y-4">
      <Button asChild variant="ghost" className="w-fit">
        <Link href="/admin/clients">
          <ArrowLeft className="size-4" />
          Back to clients
        </Link>
      </Button>

      <div className="space-y-3">
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
          <ClientPaymentStatusBadge
            label={client.payment.statusLabel}
            status={client.payment.status}
          />
          <ClientStoredStatusBadge
            label={client.client.statusLabel}
            status={client.client.status}
          />
          <ClientEventLifecycleBadge
            label={client.event.lifecycleLabel}
            lifecycle={client.event.lifecycle}
          />
          <ClientHostingLifecycleBadge
            label={client.hosting.lifecycleLabel}
            lifecycle={client.hosting.lifecycle}
          />
        </div>
      </div>
    </div>
  );
}

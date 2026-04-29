import Link from "next/link";
import type { ClientListItem } from "@/server/queries/admin-clients";
import {
  ClientPaymentStatusBadge,
  ClientPlanBadge,
  ClientStoredStatusBadge,
} from "@/components/clients/client-badges";
import { EmptyState } from "@/components/feedback/empty-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

type ClientCardListProps = {
  hasActiveFilters: boolean;
  items: ClientListItem[];
};

export function ClientCardList({ hasActiveFilters, items }: ClientCardListProps) {
  if (items.length === 0) {
    return (
      <div className="xl:hidden">
        <EmptyState
          title={hasActiveFilters ? "No matching clients" : "No clients yet"}
          description={
            hasActiveFilters
              ? "Try clearing filters or changing the lifecycle tab."
              : "Approved and provisioned client records will appear here."
          }
        />
      </div>
    );
  }

  return (
    <div className="grid gap-3 xl:hidden">
      {items.map((client) => (
        <Card key={client.id} className="shadow-none">
          <CardContent className="grid min-w-0 gap-4 p-4">
            <div className="min-w-0 space-y-1">
              <p className="truncate font-medium">{client.clientName}</p>
              <p className="text-muted-foreground text-sm break-all">{client.email}</p>
            </div>

            <div className="min-w-0 space-y-1">
              <p className="font-medium">{client.eventTypeLabel ?? "No event yet"}</p>
              {client.eventDate ? (
                <p className="text-muted-foreground text-xs">{formatDate(client.eventDate)}</p>
              ) : null}
            </div>

            <div className="flex min-w-0 flex-wrap gap-2">
              <ClientPlanBadge label={client.planLabel} plan={client.plan} />
              <ClientPaymentStatusBadge
                label={client.paymentStatusLabel}
                status={client.paymentStatus}
              />
              <ClientStoredStatusBadge
                label={client.clientStatusLabel}
                status={client.clientStatus}
              />
            </div>

            <Button asChild variant="outline">
              <Link href={client.href}>View</Link>
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-PH", {
    dateStyle: "medium",
    timeZone: "Asia/Manila",
  }).format(new Date(`${value}T00:00:00.000Z`));
}

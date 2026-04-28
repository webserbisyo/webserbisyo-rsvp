import type { ApplicationDetailView } from "@/server/queries/admin-applications";
import { PaymentStatusBadge } from "@/components/applications/application-badges";
import { ErrorState } from "@/components/feedback/error-state";
import { SectionCard } from "@/components/shared/section-card";
import { StatusBadge } from "@/components/shared/status-badge";

type ApplicationLinkedRecordsProps = {
  application: ApplicationDetailView;
  hasError?: boolean;
};

export function ApplicationLinkedRecords({
  application,
  hasError = false,
}: ApplicationLinkedRecordsProps) {
  const records = application.linkedRecords;

  return (
    <SectionCard className="h-fit" title="Linked Records">
      {hasError ? (
        <ErrorState
          title="Linked records could not be loaded"
          description="Refresh the page or try again."
        />
      ) : null}

      <div className="grid gap-4 md:grid-cols-3">
        <LinkedRecord
          emptyMessage="No client created yet"
          id={records.clientId}
          label="Approved client"
          name={records.clientName}
          status={records.clientStatus}
        />
        <LinkedRecord
          emptyMessage="No event created yet"
          id={records.eventId}
          label="Draft event"
          name={records.eventTitle}
          status={records.eventStatus}
        />
        <LinkedRecord
          emptyMessage="No payment record yet"
          id={records.paymentId}
          label="Payment record"
          name={records.paymentStatusLabel}
          status={records.paymentStatus}
        />
      </div>
    </SectionCard>
  );
}

function LinkedRecord({
  emptyMessage,
  id,
  label,
  name,
  status,
}: {
  emptyMessage: string;
  id: string | null;
  label: string;
  name: string | null;
  status: string | null;
}) {
  return (
    <div className="bg-muted/20 min-w-0 rounded-lg border p-4">
      <p className="text-muted-foreground text-xs font-medium">{label}</p>
      {id ? (
        <div className="mt-3 min-w-0 space-y-2">
          <p className="truncate text-sm font-medium">{name ?? id}</p>
          <p className="text-muted-foreground truncate font-mono text-xs">{id}</p>
          {status ? (
            label === "Payment record" ? (
              <PaymentStatusBadge label={status.replaceAll("_", " ")} status={status} />
            ) : (
              <StatusBadge tone="muted" className="capitalize">
                {status.replaceAll("_", " ")}
              </StatusBadge>
            )
          ) : null}
        </div>
      ) : (
        <p className="text-muted-foreground mt-3 text-sm">{emptyMessage}</p>
      )}
    </div>
  );
}

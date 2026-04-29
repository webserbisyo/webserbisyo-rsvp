"use client";

import type { SalesListItem } from "@/server/queries/admin-sales";
import { PaymentStatusBadge } from "@/components/applications/application-badges";
import { EmptyState } from "@/components/feedback/empty-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAdminWorkflowUiStore } from "@/stores/admin-workflow-ui-store";

type SalesCardListProps = {
  hasActiveFilters: boolean;
  items: SalesListItem[];
};

export function SalesCardList({ hasActiveFilters, items }: SalesCardListProps) {
  const openSalesDetail = useAdminWorkflowUiStore((state) => state.openSalesDetail);

  if (items.length === 0) {
    return (
      <div className="xl:hidden">
        <EmptyState
          title={hasActiveFilters ? "No matching payments" : "No payments yet"}
          description={
            hasActiveFilters
              ? "Try clearing filters or switching the payment status."
              : "Pending and confirmed manual payments will appear here."
          }
        />
      </div>
    );
  }

  return (
    <div className="grid gap-3 xl:hidden">
      {items.map((payment) => (
        <Card key={payment.id} className="shadow-none">
          <CardContent className="grid min-w-0 gap-4 p-4">
            <div className="min-w-0 space-y-1">
              <p className="truncate font-medium">
                {payment.client?.name ?? payment.application?.title ?? "Pending payment"}
              </p>
              <p className="text-muted-foreground text-sm">
                {payment.application?.referenceCode ?? payment.id}
              </p>
              <p className="text-muted-foreground text-xs">
                {payment.client?.email ?? payment.application?.email ?? "No client email yet"}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <PaymentStatusBadge
                label={payment.paymentStatusLabel}
                status={payment.paymentStatus}
              />
            </div>

            <div className="grid gap-1 text-sm">
              <p className="font-medium">{payment.planTypeLabel}</p>
              <p className="text-muted-foreground">
                Amount due {formatCurrency(payment.amountDue)}
              </p>
              <p className="text-muted-foreground">
                {payment.paidAt
                  ? `Paid ${formatDateTime(payment.paidAt)}`
                  : `Created ${formatDateTime(payment.createdAt)}`}
              </p>
            </div>

            <Button type="button" variant="outline" onClick={() => openSalesDetail(payment.id)}>
              View payment
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-PH", {
    currency: "PHP",
    style: "currency",
  }).format(value);
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en-PH", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Manila",
  }).format(new Date(value));
}

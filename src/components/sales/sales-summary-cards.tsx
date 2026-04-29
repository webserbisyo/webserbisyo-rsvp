import type { AdminSalesSummary } from "@/server/queries/admin-sales";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type SalesSummaryCardsProps = {
  summary: AdminSalesSummary;
};

export function SalesSummaryCards({ summary }: SalesSummaryCardsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <SummaryCard
        title="Total confirmed revenue"
        value={formatCurrency(summary.totalConfirmedRevenue)}
        hint={`${summary.confirmedPaymentsCount} confirmed payments`}
      />
      <SummaryCard
        title="Pro payments"
        value={formatCurrency(summary.proConfirmedRevenue)}
        hint="Confirmed Pro revenue"
      />
      <SummaryCard
        title="Max payments"
        value={formatCurrency(summary.maxConfirmedRevenue)}
        hint="Confirmed Max revenue"
      />
      <SummaryCard
        title="Pending payments"
        value={String(summary.pendingPayments)}
        hint="Awaiting manual confirmation"
      />
    </div>
  );
}

function SummaryCard({ hint, title, value }: { hint: string; title: string; value: string }) {
  return (
    <Card className="rsvp-panel border-border/70 rounded-3xl">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-1">
        <p className="text-2xl font-semibold tracking-tight">{value}</p>
        <p className="text-muted-foreground text-xs">{hint}</p>
      </CardContent>
    </Card>
  );
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-PH", {
    currency: "PHP",
    style: "currency",
  }).format(value);
}

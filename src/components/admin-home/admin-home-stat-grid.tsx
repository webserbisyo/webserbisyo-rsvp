import { CreditCard, ListChecks, PhilippinePeso, Users } from "lucide-react";
import type { AdminHomeSummary } from "@/server/queries/admin-home";
import { StatCard } from "@/components/shared/stat-card";

type AdminHomeStatGridProps = {
  errorMessage?: string;
  stats: AdminHomeSummary["stats"];
};

export function AdminHomeStatGrid({ errorMessage, stats }: AdminHomeStatGridProps) {
  return (
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard
        icon={ListChecks}
        label="Pending Applications"
        value={formatCount(stats.pendingApplications)}
        caption={stats.pendingApplications === null ? errorMessage : "Submitted and reviewing"}
      />
      <StatCard
        icon={CreditCard}
        label="Awaiting Payment"
        value={formatCount(stats.awaitingPayment)}
        caption={stats.awaitingPayment === null ? errorMessage : "Approved or pending payment"}
      />
      <StatCard
        icon={Users}
        label="Active Clients"
        value={formatCount(stats.activeClients)}
        caption={stats.activeClients === null ? errorMessage : "Current active client records"}
      />
      <StatCard
        icon={PhilippinePeso}
        label="Revenue This Month"
        value={formatCurrency(stats.revenueThisMonth)}
        caption={stats.revenueThisMonth === null ? errorMessage : "Confirmed paid payments only"}
      />
    </section>
  );
}

function formatCount(value: number | null) {
  if (value === null) {
    return "—";
  }

  return new Intl.NumberFormat("en-PH").format(value);
}

function formatCurrency(value: number | null) {
  if (value === null) {
    return "—";
  }

  return new Intl.NumberFormat("en-PH", {
    currency: "PHP",
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
    style: "currency",
  }).format(value);
}

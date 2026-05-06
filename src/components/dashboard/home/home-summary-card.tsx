import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ReactNode } from "react";

export function HomeSummaryCard({
  title,
  icon,
  primary,
  secondary,
  status,
  statusColor = "default",
}: {
  title: string;
  icon: ReactNode;
  primary: string;
  secondary: string;
  status: string;
  statusColor?: "default" | "success" | "warning" | "destructive" | "brand";
}) {
  const statusStyles = {
    default: "bg-[var(--dash-surface-muted)] text-[var(--dash-muted)] border-[var(--dash-border)]",
    success: "bg-[var(--dash-success-subtle)] text-[var(--dash-success)] border-[var(--dash-success)]",
    warning: "bg-[var(--dash-warning-subtle)] text-[var(--dash-warning)] border-[var(--dash-warning)]",
    destructive: "bg-[var(--dash-destructive-subtle)] text-[var(--dash-destructive)] border-[var(--dash-destructive)]",
    brand: "bg-[var(--dash-brand-subtle)] text-[var(--dash-brand-active)] border-[var(--dash-brand)]",
  };

  return (
    <Card className="rounded-3xl border border-[var(--dash-border)] bg-[var(--dash-surface)] shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-xs font-semibold uppercase tracking-wider text-[var(--dash-muted)]">
          {title}
        </CardTitle>
        <div className="text-[var(--dash-brand)]">{icon}</div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <p className="text-xl font-semibold text-[var(--dash-foreground)]">{primary}</p>
          <p className="truncate text-sm text-[var(--dash-muted)]">{secondary}</p>
        </div>
        <div className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${statusStyles[statusColor]}`}>
          {status}
        </div>
      </CardContent>
    </Card>
  );
}

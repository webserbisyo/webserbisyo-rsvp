import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type BillingPaymentStatus = "confirmed" | "pending" | "partial" | "unpaid";

const STATUS_LABELS: Record<BillingPaymentStatus, string> = {
  confirmed: "Confirmed",
  partial: "Partial",
  pending: "Pending",
  unpaid: "Unpaid",
};

const STATUS_STYLES: Record<BillingPaymentStatus, string> = {
  confirmed:
    "border-[color:color-mix(in_srgb,var(--dash-success)_30%,transparent)] bg-[color:var(--dash-success-subtle)] text-[color:color-mix(in_srgb,var(--dash-success)_88%,#283618)]",
  partial:
    "border-[color:color-mix(in_srgb,var(--dash-warning)_32%,transparent)] bg-[color:var(--dash-warning-subtle)] text-[color:color-mix(in_srgb,var(--dash-warning)_86%,#5a3a10)]",
  pending:
    "border-[color:color-mix(in_srgb,var(--dash-warning)_26%,transparent)] bg-[color:color-mix(in_srgb,var(--dash-warning-subtle)_72%,white)] text-[color:color-mix(in_srgb,var(--dash-warning)_82%,#5a3a10)]",
  unpaid:
    "border-[color:color-mix(in_srgb,var(--dash-destructive)_26%,transparent)] bg-[color:var(--dash-destructive-subtle)] text-[color:color-mix(in_srgb,var(--dash-destructive)_82%,#5c1f1f)]",
};

/** Dot colour per status — matches the status text colour family. */
const DOT_STYLES: Record<BillingPaymentStatus, string> = {
  confirmed: "bg-[color:var(--dash-success)]",
  partial: "bg-[color:var(--dash-warning)]",
  pending: "bg-[color:var(--dash-warning)]",
  unpaid: "bg-[color:var(--dash-destructive)]",
};

type BillingStatusBadgeProps = {
  children?: ReactNode;
  className?: string;
  /** `lg` adds extra padding and a status dot — used in the page header. */
  size?: "default" | "lg";
  status: BillingPaymentStatus;
};

export function BillingStatusBadge({
  children,
  className,
  size = "default",
  status,
}: BillingStatusBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full font-semibold shadow-[inset_0_1px_0_rgba(255,255,255,0.65)]",
        size === "lg" ? "h-8 px-3.5 text-sm" : "h-6 px-2.5 text-xs",
        STATUS_STYLES[status],
        className,
      )}
    >
      {size === "lg" && (
        <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", DOT_STYLES[status])} aria-hidden="true" />
      )}
      {children ?? STATUS_LABELS[status]}
    </Badge>
  );
}

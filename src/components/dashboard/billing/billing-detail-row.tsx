import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type BillingDetailRowProps = {
  className?: string;
  label: string;
  value: ReactNode;
};

export function BillingDetailRow({ className, label, value }: BillingDetailRowProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-6 border-b border-[color:var(--dash-divider)] py-3.5 last:border-b-0",
        className,
      )}
    >
      <span className="text-[15px] font-medium text-[color:var(--dash-heading-muted)]">
        {label}
      </span>
      <div className="text-right text-[15px] font-semibold text-[color:var(--dash-foreground)]">
        {value}
      </div>
    </div>
  );
}

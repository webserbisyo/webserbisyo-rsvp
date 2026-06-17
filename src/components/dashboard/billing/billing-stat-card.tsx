import type { ReactNode } from "react";
import { BillingCard } from "@/components/dashboard/billing/billing-card";

type BillingStatCardProps = {
  icon: ReactNode;
  label: string;
  value: ReactNode;
};

export function BillingStatCard({ icon, label, value }: BillingStatCardProps) {
  return (
    <BillingCard className="group transition-transform duration-200 hover:-translate-y-0.5 hover:border-[color:var(--dash-border-hover)] hover:shadow-[var(--dash-shadow-md)]">
      <div className="mb-5">
        {/* Icon bubble — terracotta warm tile matching Figma */}
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[color:color-mix(in_srgb,var(--dash-brand-subtle)_90%,white)] text-[color:var(--dash-brand)] shadow-[inset_0_1px_0_rgba(255,255,255,0.75)]">
          {icon}
        </div>
      </div>
      <p className="mb-2 text-sm font-medium text-[color:var(--dash-heading-muted)]">{label}</p>
      <div className="text-xl font-black tracking-tight text-[color:var(--dash-foreground)]">
        {value}
      </div>
    </BillingCard>
  );
}

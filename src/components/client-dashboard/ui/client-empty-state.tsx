import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { ClientCard } from "./client-card";

type ClientEmptyStateProps = {
  action?: React.ReactNode;
  badgeLabel?: string;
  className?: string;
  description: string;
  icon: React.ReactNode;
  title: string;
};

export function ClientEmptyState({
  action,
  badgeLabel,
  className,
  description,
  icon,
  title,
}: ClientEmptyStateProps) {
  return (
    <ClientCard
      elevation="raised"
      className={cn("overflow-hidden rounded-[var(--client-radius-2xl)]", className)}
    >
      <div className="flex flex-col gap-5 px-5 py-6 sm:px-8 sm:py-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
          <div className="client-placeholder-icon flex size-14 shrink-0 items-center justify-center rounded-[var(--client-radius-lg)] text-[var(--client-accent-hover)]">
            {icon}
          </div>
          <div className="min-w-0 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-semibold tracking-tight text-[var(--client-text)]">
                {title}
              </h2>
              {badgeLabel ? (
                <Badge variant="outline" className="client-soon-badge rounded-full">
                  {badgeLabel}
                </Badge>
              ) : null}
            </div>
            <p className="max-w-2xl text-sm leading-7 text-[var(--client-text-muted)] sm:text-base">
              {description}
            </p>
          </div>
        </div>
        {action ? <div className="flex flex-wrap gap-3">{action}</div> : null}
      </div>
    </ClientCard>
  );
}

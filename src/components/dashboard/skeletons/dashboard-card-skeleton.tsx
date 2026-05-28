import type { ReactNode } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const warmSkeletonClassName =
  "bg-[color:color-mix(in_srgb,var(--dash-brand-subtle)_42%,var(--dash-surface-hover))]";

export function DashboardCardSkeleton({
  children,
  className,
  contentClassName,
}: {
  children?: ReactNode;
  className?: string;
  contentClassName?: string;
}) {
  return (
    <section
      className={cn(
        "rounded-[1.75rem] border border-[color:var(--dash-border)] bg-[color:color-mix(in_srgb,var(--dash-surface)_88%,white)] shadow-[var(--dash-shadow-sm)]",
        className,
      )}
    >
      <div className={cn("p-5 sm:p-6", contentClassName)}>{children}</div>
    </section>
  );
}

export function DashboardSkeletonLine({
  className,
}: {
  className?: string;
}) {
  return <Skeleton className={cn(warmSkeletonClassName, className)} />;
}

export function DashboardSkeletonCircle({
  className,
}: {
  className?: string;
}) {
  return <Skeleton className={cn("rounded-full", warmSkeletonClassName, className)} />;
}

export function DashboardSkeletonBlock({
  className,
}: {
  className?: string;
}) {
  return <Skeleton className={cn("rounded-2xl", warmSkeletonClassName, className)} />;
}

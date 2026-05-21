import type { ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type BillingCardProps = {
  children: ReactNode;
  className?: string;
  /**
   * Extra classes for the inner CardContent wrapper.
   * If supplied with padding utilities they will take precedence over the default
   * `px-5 py-5 sm:px-6 sm:py-6` baseline via Tailwind Merge.
   */
  contentClassName?: string;
  description?: ReactNode;
  headerClassName?: string;
  title?: ReactNode;
  titleAction?: ReactNode;
};

export function BillingCard({
  children,
  className,
  contentClassName,
  description,
  headerClassName,
  title,
  titleAction,
}: BillingCardProps) {
  return (
    <Card
      className={cn(
        "rounded-[1.6rem] border border-[color:var(--dash-border)] bg-[color:color-mix(in_srgb,var(--dash-surface)_80%,#fff4ea)] shadow-[var(--dash-shadow-sm)]",
        className,
      )}
    >
      {title ? (
        <CardHeader className={cn("px-5 pt-5 pb-0 sm:px-6 sm:pt-6", headerClassName)}>
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <CardTitle className="text-[1rem] font-semibold tracking-[-0.01em] text-[color:var(--dash-foreground)]">
                {title}
              </CardTitle>
              {description ? (
                <p className="text-sm leading-6 text-[color:var(--dash-muted)]">{description}</p>
              ) : null}
            </div>
            {titleAction}
          </div>
        </CardHeader>
      ) : null}
      {/*
       * Default padding: px-5 py-5 sm:px-6 sm:py-6.
       * When a title is present the top spacing is tightened to pt-4.
       * Callers can pass `contentClassName` to override any of these defaults.
       */}
      <CardContent
        className={cn(
          "px-5 py-5 sm:px-6 sm:py-6",
          title && "pt-4 sm:pt-5",
          contentClassName,
        )}
      >
        {children}
      </CardContent>
    </Card>
  );
}

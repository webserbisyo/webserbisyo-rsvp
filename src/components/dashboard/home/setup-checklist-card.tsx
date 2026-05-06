import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Check, Circle, ArrowRight } from "lucide-react";
import Link from "next/link";
import React from "react";

export function SetupChecklistCard({
  items,
}: {
  items: Array<{
    id: string;
    label: string;
    completed: boolean;
    href?: string;
  }>;
}) {
  const completedCount = items.filter((i) => i.completed).length;
  const totalCount = items.length;
  const progress = Math.round((completedCount / totalCount) * 100);

  const nextItemIndex = items.findIndex((i) => !i.completed);

  return (
    <Card className="rounded-3xl border-[var(--dash-border)] bg-[var(--dash-surface)] shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold uppercase tracking-wider text-[var(--dash-muted)]">
            SETUP CHECKLIST
          </CardTitle>
          <span className="text-sm font-medium text-[var(--dash-foreground)]">
            {progress}%
          </span>
        </div>
        <p className="text-sm text-[var(--dash-muted)]">
          {completedCount} of {totalCount} completed
        </p>
        <div style={{ "--primary": "var(--dash-success)" } as React.CSSProperties}>
          <Progress value={progress} className="mt-1 h-2 bg-[var(--dash-surface-muted)]" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4 pt-2">
          {items.map((item, index) => {
            const isNext = index === nextItemIndex;
            return (
              <div key={item.id} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {item.completed ? (
                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--dash-success)] text-white">
                      <Check className="h-3 w-3" strokeWidth={3} />
                    </div>
                  ) : (
                    <Circle className="h-5 w-5 text-[var(--dash-border-hover)]" strokeWidth={2} />
                  )}
                  <span className={`text-sm ${item.completed ? "text-[var(--dash-muted)]" : "font-medium text-[var(--dash-foreground)]"}`}>
                    {item.label}
                  </span>
                </div>
                {isNext && item.href && (
                  <Link href={item.href} className="flex items-center text-sm font-medium text-[var(--dash-brand)] hover:text-[var(--dash-brand-hover)]">
                    Review <ArrowRight className="ml-1 h-3.5 w-3.5" />
                  </Link>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

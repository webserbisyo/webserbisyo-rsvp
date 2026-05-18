"use client";

import { CheckCircle2, Mail, Users, XCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

type RsvpResponsesStatsProps = {
  attendingCount: number;
  notAttendingCount: number;
  totalPartySize: number;
  totalResponses: number;
};

export function RsvpResponsesStats({
  attendingCount,
  notAttendingCount,
  totalPartySize,
  totalResponses,
}: RsvpResponsesStatsProps) {
  const stats = [
    {
      label: "Total responses",
      value: totalResponses,
      icon: Mail,
      accent: "var(--dash-brand-subtle)",
      color: "var(--dash-brand-active)",
    },
    {
      label: "Attending",
      value: attendingCount,
      icon: CheckCircle2,
      accent: "var(--dash-success-subtle)",
      color: "var(--dash-success)",
    },
    {
      label: "Not attending",
      value: notAttendingCount,
      icon: XCircle,
      accent: "var(--dash-destructive-subtle)",
      color: "var(--dash-destructive)",
    },
    {
      label: "Total party size",
      value: totalPartySize,
      icon: Users,
      accent: "var(--dash-surface-muted)",
      color: "var(--dash-brand)",
    },
  ];

  return (
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {stats.map((stat) => {
        const Icon = stat.icon;

        return (
          <Card
            key={stat.label}
            className="rsvp-panel min-h-[116px] rounded-[28px] border-[color:var(--dash-border)] bg-[color:var(--dash-surface)] py-0 shadow-[var(--dash-shadow-sm)]"
          >
            <CardContent className="flex h-full items-start justify-between gap-3 px-4 py-3.5">
              <div className="flex flex-1 flex-col gap-2.5">
                <p className="text-[1.8rem] font-semibold tracking-tight text-[--dash-foreground]">
                  {stat.value}
                </p>
                <p className="text-sm font-medium leading-5" style={{ color: "var(--dash-muted)" }}>
                  {stat.label}
                </p>
              </div>
              <div
                className="flex size-11 shrink-0 items-center justify-center rounded-[18px] border shadow-[inset_0_1px_0_rgba(255,255,255,0.55)]"
                style={{
                  backgroundColor: stat.accent,
                  borderColor: "color-mix(in srgb, var(--dash-border) 78%, white)",
                  color: stat.color,
                }}
              >
                <Icon className="size-5" aria-hidden="true" />
              </div>
            </CardContent>
          </Card>
        );
      })}
    </section>
  );
}

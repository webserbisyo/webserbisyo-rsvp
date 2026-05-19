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
      accent: "var(--responses-brand-subtle)",
      color: "var(--responses-brand-active)",
    },
    {
      label: "Attending",
      value: attendingCount,
      icon: CheckCircle2,
      accent: "var(--responses-success-subtle)",
      color: "var(--responses-success)",
    },
    {
      label: "Not attending",
      value: notAttendingCount,
      icon: XCircle,
      accent: "var(--responses-destructive-subtle)",
      color: "var(--responses-destructive)",
    },
    {
      label: "Total party size",
      value: totalPartySize,
      icon: Users,
      accent: "var(--responses-surface-muted)",
      color: "var(--responses-brand)",
    },
  ];

  return (
    <section className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-4">
      {stats.map((stat) => {
        const Icon = stat.icon;

        return (
          <Card
            key={stat.label}
            className="rsvp-panel min-h-[134px] rounded-[30px] border-[color:var(--responses-border)] bg-[color:var(--responses-surface)] py-0 shadow-[var(--responses-shadow-sm)]"
          >
            <CardContent className="flex h-full items-start justify-between gap-4 px-5 py-4.5 md:px-5.5">
              <div className="flex flex-1 flex-col gap-3 pt-0.5">
                <p className="text-[2rem] font-semibold tracking-tight text-[var(--responses-foreground)] md:text-[2.1rem]">
                  {stat.value}
                </p>
                <p
                  className="max-w-[16ch] text-sm font-medium leading-5"
                  style={{ color: "var(--responses-muted)" }}
                >
                  {stat.label}
                </p>
              </div>
              <div
                className="flex size-12 shrink-0 items-center justify-center rounded-[18px] border shadow-[inset_0_1px_0_rgba(255,255,255,0.58)] md:size-[52px]"
                style={{
                  backgroundColor: stat.accent,
                  borderColor: "color-mix(in srgb, var(--responses-border) 82%, white)",
                  color: stat.color,
                }}
              >
                <Icon className="size-5 md:size-[1.35rem]" aria-hidden="true" />
              </div>
            </CardContent>
          </Card>
        );
      })}
    </section>
  );
}

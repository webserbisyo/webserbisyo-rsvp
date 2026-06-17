"use client";

import { CheckCircle2, Mail, Users, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

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
      tone: "terracotta" as const,
    },
    {
      label: "Attending",
      value: attendingCount,
      icon: CheckCircle2,
      tone: "green" as const,
    },
    {
      label: "Not attending",
      value: notAttendingCount,
      icon: XCircle,
      tone: "red" as const,
    },
    {
      label: "Total party size",
      value: totalPartySize,
      icon: Users,
      tone: "neutral" as const,
    },
  ];

  const tones = {
    neutral: "bg-[#fbf7f3] text-[#7b6255]",
    green: "bg-emerald-50 text-emerald-700",
    red: "bg-rose-50 text-rose-700",
    terracotta: "bg-[#fff0e8] text-[#c96f4c]",
  };

  return (
    <section className="grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
      {stats.map((stat) => {
        const Icon = stat.icon;

        return (
          <div
            key={stat.label}
            className="rounded-[1.6rem] border border-[#eadbd0] bg-white/80 p-4 shadow-sm shadow-[#8a4b2e]/5"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-2xl font-bold tracking-tight text-[#2b2521]">{stat.value}</p>
                <p className="mt-1 text-sm font-medium text-[#8a7c72]">{stat.label}</p>
              </div>
              <div
                className={cn("grid h-10 w-10 place-items-center rounded-2xl", tones[stat.tone])}
              >
                <Icon className="h-5 w-5" />
              </div>
            </div>
          </div>
        );
      })}
    </section>
  );
}

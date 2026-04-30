"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { AdminHomeRecentItem } from "@/server/queries/admin-home";
import { ErrorState } from "@/components/feedback/error-state";
import { EmptyState } from "@/components/feedback/empty-state";
import { SectionCard } from "@/components/shared/section-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";

type RecentRecordFilter = "all" | "activity" | "application" | "client" | "payment";

type RecentRecordsFeedProps = {
  errorMessage?: string;
  items: AdminHomeRecentItem[];
};

const filterOptions: Array<{ label: string; value: RecentRecordFilter }> = [
  { label: "All", value: "all" },
  { label: "Applications", value: "application" },
  { label: "Clients", value: "client" },
  { label: "Payments", value: "payment" },
  { label: "Activity", value: "activity" },
];

export function RecentRecordsFeed({ errorMessage, items }: RecentRecordsFeedProps) {
  const [activeFilter, setActiveFilter] = useState<RecentRecordFilter>("all");

  const filteredItems = useMemo(() => {
    if (activeFilter === "all") {
      return items;
    }

    return items.filter((item) => item.type === activeFilter);
  }, [activeFilter, items]);

  return (
    <SectionCard
      title="Recent Records"
      description="Latest applications, clients, payments, and admin activity in one operational feed."
      actions={
        <div className="flex flex-wrap justify-end gap-2">
          {filterOptions.map((filterOption) => (
            <Button
              key={filterOption.value}
              type="button"
              size="sm"
              variant={activeFilter === filterOption.value ? "default" : "outline"}
              className={
                activeFilter === filterOption.value
                  ? "bg-rsvp-brand text-rsvp-brand-foreground hover:bg-rsvp-brand/90"
                  : undefined
              }
              onClick={() => setActiveFilter(filterOption.value)}
            >
              {filterOption.label}
            </Button>
          ))}
        </div>
      }
    >
      {errorMessage ? (
        <ErrorState
          title="Unable to load recent records"
          description="This feed is temporarily unavailable. Other summary sections may still be current."
        />
      ) : filteredItems.length > 0 ? (
        <div className="overflow-hidden rounded-lg border">
          <div className="bg-muted/50 grid grid-cols-[7rem_minmax(0,1.25fr)_minmax(0,1.6fr)_9rem_8rem_5.5rem] gap-3 px-4 py-3 text-xs font-medium">
            <span>Type</span>
            <span>Name / Client</span>
            <span>Details</span>
            <span>Status</span>
            <span>Updated</span>
            <span className="text-right">Action</span>
          </div>
          <div className="max-h-[26rem] overflow-y-auto">
            <div className="divide-border divide-y">
              {filteredItems.map((item) => (
                <div
                  key={`${item.type}-${item.id}`}
                  className="grid grid-cols-[7rem_minmax(0,1.25fr)_minmax(0,1.6fr)_9rem_8rem_5.5rem] gap-3 px-4 py-3 text-sm"
                >
                  <div className="min-w-0">
                    <StatusBadge tone="muted">{formatTypeLabel(item.type)}</StatusBadge>
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-medium">{item.title}</p>
                    <p className="text-muted-foreground truncate text-xs">{item.caption}</p>
                  </div>
                  <div className="min-w-0">
                    <p className="truncate">{item.meta}</p>
                  </div>
                  <div className="min-w-0">
                    <StatusBadge tone={toStatusBadgeTone(item.statusTone)}>
                      {item.statusLabel}
                    </StatusBadge>
                  </div>
                  <div className="text-muted-foreground text-xs">
                    {formatDateTime(item.timestamp)}
                  </div>
                  <div className="text-right">
                    <Button asChild size="sm" variant="outline">
                      <Link href={item.href}>View</Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <EmptyState
          title="No recent records"
          description="New admin records will appear here after the next application, client, payment, or workflow activity."
        />
      )}
    </SectionCard>
  );
}

function formatTypeLabel(type: AdminHomeRecentItem["type"]) {
  switch (type) {
    case "application":
      return "Application";
    case "client":
      return "Client";
    case "payment":
      return "Payment";
    case "activity":
    default:
      return "Activity";
  }
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en-PH", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Manila",
  }).format(new Date(value));
}

function toStatusBadgeTone(tone: AdminHomeRecentItem["statusTone"]) {
  switch (tone) {
    case "warning":
      return "warning";
    case "success":
      return "success";
    case "danger":
      return "danger";
    case "neutral":
    default:
      return "muted";
  }
}

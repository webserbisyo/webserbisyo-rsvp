import Link from "next/link";
import { Activity, CreditCard, Inbox, Users } from "lucide-react";
import type { AdminHomeRecentItem } from "@/server/queries/admin-home";
import { EmptyState } from "@/components/feedback/empty-state";
import { ErrorState } from "@/components/feedback/error-state";
import { SectionCard } from "@/components/shared/section-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";

type RecentHomeSectionsProps = {
  sections: Array<{
    description: string;
    emptyDescription: string;
    emptyTitle: string;
    errorMessage?: string;
    items: AdminHomeRecentItem[];
    title: string;
    viewMoreHref: string;
  }>;
};

export function RecentHomeSections({ sections }: RecentHomeSectionsProps) {
  return (
    <div className="grid gap-6 xl:grid-cols-2">
      {sections.map((section) => (
        <SectionCard
          key={section.title}
          title={section.title}
          description={section.description}
          actions={
            <Button asChild variant="ghost" size="sm">
              <Link href={section.viewMoreHref}>View more</Link>
            </Button>
          }
        >
          {section.errorMessage ? (
            <ErrorState
              title={`${section.title} could not be loaded`}
              description="This section is temporarily unavailable. Other admin summary sections may still be current."
            />
          ) : section.items.length > 0 ? (
            <div className="max-h-80 space-y-3 overflow-y-auto pr-1">
              {section.items.map((item) => (
                <RecentItemRow key={`${item.type}-${item.id}`} item={item} />
              ))}
            </div>
          ) : (
            <EmptyState
              title={section.emptyTitle}
              description={section.emptyDescription}
              icon={getSectionIcon(section.title)}
            />
          )}
        </SectionCard>
      ))}
    </div>
  );
}

function RecentItemRow({ item }: { item: AdminHomeRecentItem }) {
  return (
    <div className="border-border/70 flex min-w-0 flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0 space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="min-w-0 truncate text-sm font-semibold">{item.title}</h2>
          <StatusBadge tone={toStatusBadgeTone(item.statusTone)}>{item.statusLabel}</StatusBadge>
        </div>
        <p className="text-muted-foreground line-clamp-2 text-sm leading-6">{item.caption}</p>
        <p className="text-muted-foreground text-xs">
          {item.meta} · {formatDateTime(item.timestamp)}
        </p>
      </div>
      <Button asChild variant="outline" size="sm" className="sm:self-center">
        <Link href={item.href}>View</Link>
      </Button>
    </div>
  );
}

function getSectionIcon(title: string) {
  if (title.includes("Clients")) {
    return <Users className="size-5" />;
  }

  if (title.includes("Payments")) {
    return <CreditCard className="size-5" />;
  }

  if (title.includes("Activity")) {
    return <Activity className="size-5" />;
  }

  return <Inbox className="size-5" />;
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

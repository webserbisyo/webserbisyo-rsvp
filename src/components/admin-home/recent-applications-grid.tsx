import Link from "next/link";
import { Inbox } from "lucide-react";
import type { AdminHomeApplicationItem } from "@/server/queries/admin-home";
import { EmptyState } from "@/components/feedback/empty-state";
import { ErrorState } from "@/components/feedback/error-state";
import { SectionCard } from "@/components/shared/section-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type RecentApplicationsGridProps = {
  errorMessage?: string;
  items: AdminHomeApplicationItem[];
};

export function RecentApplicationsGrid({ errorMessage, items }: RecentApplicationsGridProps) {
  return (
    <SectionCard
      title="Recent Applications"
      description="Latest applications submitted through the public apply flow."
      actions={
        <Button asChild variant="ghost" size="sm">
          <Link href="/admin/applications">View all</Link>
        </Button>
      }
    >
      {errorMessage ? (
        <ErrorState
          title="Unable to load recent applications"
          description="This section is temporarily unavailable. Other admin summary sections may still be current."
        />
      ) : items.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {items.map((item) => (
            <div
              key={item.id}
              className="border-border/70 flex min-w-0 flex-col gap-4 rounded-lg border p-4"
            >
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="min-w-0 truncate text-sm font-semibold">{item.name}</h2>
                  <Badge variant="outline" className="shrink-0">
                    {item.plan}
                  </Badge>
                </div>
                <p className="text-muted-foreground truncate text-sm">{item.email}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge tone={toStatusBadgeTone(item.statusTone)}>
                  {item.statusLabel}
                </StatusBadge>
                <span className="text-muted-foreground text-xs">
                  Submitted {formatDateTime(item.submittedAt)}
                </span>
              </div>
              <Button asChild variant="outline" size="sm" className="w-fit">
                <Link href={item.href}>View</Link>
              </Button>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          title="No applications yet."
          description="Recent applications will appear here after the first public submission."
          icon={<Inbox className="size-5" />}
        />
      )}
    </SectionCard>
  );
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en-PH", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Manila",
  }).format(new Date(value));
}

function toStatusBadgeTone(tone: AdminHomeApplicationItem["statusTone"]) {
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

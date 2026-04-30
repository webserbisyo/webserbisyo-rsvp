import Link from "next/link";
import { AlertCircle } from "lucide-react";
import type { AdminHomeQueueItem } from "@/server/queries/admin-home";
import { EmptyState } from "@/components/feedback/empty-state";
import { ErrorState } from "@/components/feedback/error-state";
import { SectionCard } from "@/components/shared/section-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";

type NeedsAttentionListProps = {
  errorMessage?: string;
  items: AdminHomeQueueItem[];
};

export function NeedsAttentionList({ errorMessage, items }: NeedsAttentionListProps) {
  return (
    <SectionCard
      title={`Needs Attention (${items.length})`}
      description="Priority items that need review in the current admin workflow."
      className="h-full"
    >
      {errorMessage ? (
        <ErrorState
          title="Unable to load priority items"
          description="This section is temporarily unavailable. Other admin summary sections may still be current."
        />
      ) : items.length > 0 ? (
        <div className="max-h-[15.5rem] overflow-y-auto pr-1">
          <div className="divide-border divide-y">
            {items.map((item) => (
              <div
                key={`${item.type}-${item.id}`}
                className="flex flex-col gap-4 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-start sm:justify-between"
              >
                <div className="min-w-0 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="min-w-0 truncate text-sm font-semibold">{item.title}</h2>
                    <StatusBadge tone={toStatusBadgeTone(item.statusTone)}>
                      {item.statusLabel}
                    </StatusBadge>
                  </div>
                  <p className="text-muted-foreground line-clamp-2 text-sm leading-6">
                    {item.subtitle}
                  </p>
                  <p className="text-muted-foreground text-xs">
                    Updated {formatDateTime(item.updatedAt)}
                  </p>
                </div>
                <Button asChild variant="outline" size="sm" className="sm:self-center">
                  <Link href={item.href}>View</Link>
                </Button>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <EmptyState
          title="No items need attention right now."
          description="Pending applications will appear here."
          icon={<AlertCircle className="size-5" />}
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

function toStatusBadgeTone(tone: AdminHomeQueueItem["statusTone"]) {
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

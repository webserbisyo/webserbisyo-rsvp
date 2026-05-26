import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type {
  EventWebsiteOperationalStatus,
  EventWebsiteSectionSummary,
} from "@/lib/event-website/readiness";
import { cn } from "@/lib/utils";
import { ArrowUpRight, Cloud, CloudOff, ExternalLink } from "lucide-react";
import type { EventWebsiteStatusPill } from "@/components/dashboard/event/event-website-left-pane";

type EventWebsiteStatusCardProps = {
  autoSaveEnabled: boolean;
  onToggleAutoSave: () => void;
  publicPageUrl: string | null;
  sectionSummary: EventWebsiteSectionSummary;
  statusPill: EventWebsiteStatusPill;
  sticky?: boolean;
  websiteAccessHref: string;
  workflowStatus: EventWebsiteOperationalStatus;
};

export function EventWebsiteStatusCard({
  autoSaveEnabled,
  onToggleAutoSave,
  publicPageUrl,
  sectionSummary,
  statusPill,
  sticky = true,
  websiteAccessHref,
  workflowStatus,
}: EventWebsiteStatusCardProps) {
  const canPreviewPublicPage =
    Boolean(publicPageUrl) &&
    (workflowStatus.state === "published_up_to_date" ||
      workflowStatus.state === "draft_newer_than_published");

  return (
    <Card
      className={cn(
        "event-website-status-card gap-0 px-4 py-3",
        sticky && "sticky top-[calc(var(--dash-header-height)+1rem)] z-20",
      )}
    >
      <div className="event-status-card-top-row flex items-center justify-between gap-2">
        {statusPill.href ? (
          <Link
            href={statusPill.href}
            className={cn(
              "event-status-badge event-status-badge-link",
              statusPill.tone === "success" && "is-ready",
              statusPill.tone === "warning" && "is-warning",
              statusPill.tone === "neutral" && "is-neutral",
            )}
          >
            <span className="event-status-badge-dot" aria-hidden="true" />
            {statusPill.label}
            <ArrowUpRight className="size-3" aria-hidden="true" />
          </Link>
        ) : (
          <span
            className={cn(
              "event-status-badge",
              statusPill.tone === "success" && "is-ready",
              statusPill.tone === "warning" && "is-warning",
              statusPill.tone === "neutral" && "is-neutral",
            )}
          >
            <span className="event-status-badge-dot" aria-hidden="true" />
            {statusPill.label}
          </span>
        )}
        <span className="event-status-card-count text-sm font-semibold tabular-nums text-[--dash-foreground]">
          {sectionSummary.activeSectionCount}/{sectionSummary.totalSectionCount}
        </span>
      </div>

      <Progress
        value={sectionSummary.progressPercent}
        aria-label={`${sectionSummary.progressPercent}% of Event Website sections are active`}
        className="event-website-progress my-2.5"
      />

      <div className="event-status-card-meta-row mb-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-[--dash-muted]">
        <span className="event-status-sections">
          {sectionSummary.activeSectionCount} active section
          {sectionSummary.activeSectionCount === 1 ? "" : "s"}
        </span>
      </div>

      <div className="event-status-card-action-row flex items-center justify-between gap-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="event-status-autosave-btn h-8 gap-1.5 px-2.5 text-xs"
          aria-pressed={autoSaveEnabled}
          title={autoSaveEnabled ? "Turn auto-save off" : "Turn auto-save on"}
          onClick={onToggleAutoSave}
        >
          {autoSaveEnabled ? (
            <Cloud className="size-3.5" aria-hidden="true" />
          ) : (
            <CloudOff className="size-3.5" aria-hidden="true" />
          )}
          {autoSaveEnabled ? "Auto-save on" : "Auto-save off"}
        </Button>
        <Button
          asChild
          type="button"
          variant="outline"
          size="sm"
          className="event-status-publish-btn h-7 gap-1 px-2.5 text-xs"
        >
          <Link
            href={canPreviewPublicPage ? (publicPageUrl ?? websiteAccessHref) : websiteAccessHref}
            target={canPreviewPublicPage ? "_blank" : undefined}
            rel={canPreviewPublicPage ? "noreferrer" : undefined}
          >
            {canPreviewPublicPage ? "View public page" : "Website Access"}
            <ExternalLink className="size-3" aria-hidden="true" />
          </Link>
        </Button>
      </div>
    </Card>
  );
}

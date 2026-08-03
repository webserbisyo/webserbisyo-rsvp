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
  publicationStatusPill: EventWebsiteStatusPill;
  onReloadServerVersion?: () => void;
  onRetry?: () => void;
  onSaveNow?: () => void;
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
  publicationStatusPill,
  onReloadServerVersion,
  onRetry,
  onSaveNow,
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
      <div className="event-status-card-top-row flex flex-wrap items-center justify-between gap-2">
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
            aria-live="polite"
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
        {publicationStatusPill.href ? (
          <Link
            href={publicationStatusPill.href}
            className={cn(
              "event-status-badge event-status-badge-link",
              publicationStatusPill.tone === "success" && "is-ready",
              publicationStatusPill.tone === "warning" && "is-warning",
              publicationStatusPill.tone === "neutral" && "is-neutral",
            )}
          >
            {publicationStatusPill.label}
            <ArrowUpRight className="size-3" aria-hidden="true" />
          </Link>
        ) : (
          <span
            className={cn(
              "event-status-badge",
              publicationStatusPill.tone === "success" && "is-ready",
              publicationStatusPill.tone === "warning" && "is-warning",
              publicationStatusPill.tone === "neutral" && "is-neutral",
            )}
          >
            {publicationStatusPill.label}
          </span>
        )}
        <span className="event-status-card-count text-sm font-semibold text-[--dash-foreground] tabular-nums">
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
        {onRetry ? (
          <Button
            type="button"
            variant="link"
            size="sm"
            className="h-auto p-0 text-xs"
            onClick={onRetry}
          >
            Retry
          </Button>
        ) : null}
        {onSaveNow ? (
          <Button
            type="button"
            variant="link"
            size="sm"
            className="h-auto p-0 text-xs"
            onClick={onSaveNow}
          >
            Save now
          </Button>
        ) : null}
        {onReloadServerVersion ? (
          <Button
            type="button"
            variant="link"
            size="sm"
            className="h-auto p-0 text-xs"
            onClick={onReloadServerVersion}
          >
            Reload server version
          </Button>
        ) : null}
      </div>

      <div className="event-status-card-action-row flex items-center justify-between gap-2">
        <Button
          hidden
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

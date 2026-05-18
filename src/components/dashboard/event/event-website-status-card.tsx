import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type {
  EventWebsiteOperationalStatus,
  EventWebsiteSectionSummary,
} from "@/lib/event-website/readiness";
import { cn } from "@/lib/utils";
import { ArrowUpRight, ExternalLink } from "lucide-react";

type EventWebsiteStatusCardProps = {
  eventSlug: string | null;
  sectionSummary: EventWebsiteSectionSummary;
  websiteAccessHref: string;
  workflowStatus: EventWebsiteOperationalStatus;
};

export function EventWebsiteStatusCard({
  eventSlug,
  sectionSummary,
  websiteAccessHref,
  workflowStatus,
}: EventWebsiteStatusCardProps) {
  const canPreviewPublicPage =
    Boolean(eventSlug) &&
    (workflowStatus.state === "published_up_to_date" ||
      workflowStatus.state === "draft_newer_than_published");

  return (
    <Card className="event-website-status-card sticky top-[calc(var(--dash-header-height)+1rem)] z-20 gap-0 px-4 py-3">
      <div className="flex items-center justify-between gap-2">
        <span
          className={cn(
            "event-status-badge",
            workflowStatus.tone === "success" && "is-ready",
            workflowStatus.tone === "warning" && "is-warning",
            workflowStatus.tone === "neutral" && "is-neutral",
          )}
        >
          <span className="event-status-badge-dot" aria-hidden="true" />
          {workflowStatus.label}
        </span>
        <span className="text-sm font-semibold tabular-nums text-[--dash-foreground]">
          {sectionSummary.activeSectionCount}/{sectionSummary.totalSectionCount}
        </span>
      </div>

      <Progress
        value={sectionSummary.progressPercent}
        aria-label={`${sectionSummary.progressPercent}% of Event Website sections are active`}
        className="event-website-progress my-2.5"
      />

      <div className="mb-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-[--dash-muted]">
        <span className="event-status-sections">
          {sectionSummary.activeSectionCount} active section
          {sectionSummary.activeSectionCount === 1 ? "" : "s"}
        </span>
      </div>

      <div className="flex items-center justify-between gap-2">
        {canPreviewPublicPage ? (
          <Button asChild type="button" variant="ghost" size="sm" className="event-status-preview-btn h-7 gap-1 px-2 text-xs">
            <Link href={`/r/${eventSlug}`} target="_blank" rel="noreferrer">
              Preview
              <ArrowUpRight className="size-3.5" aria-hidden="true" />
            </Link>
          </Button>
        ) : (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled
            className="event-status-preview-btn h-7 gap-1 px-2 text-xs"
          >
            Preview
            <ArrowUpRight className="size-3.5" aria-hidden="true" />
          </Button>
        )}
        <Button
          asChild
          type="button"
          variant="outline"
          size="sm"
          className="event-status-publish-btn h-7 gap-1 px-2.5 text-xs"
        >
          <Link
            href={canPreviewPublicPage ? `/r/${eventSlug}` : websiteAccessHref}
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

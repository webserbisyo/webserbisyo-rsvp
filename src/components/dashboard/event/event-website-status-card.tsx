import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { EventWebsiteReadinessResult } from "@/lib/event-website/readiness";
import { ArrowUpRight, Rocket } from "lucide-react";

type EventWebsiteStatusCardProps = {
  isDirty: boolean;
  onOpenReadiness: () => void;
  readiness: EventWebsiteReadinessResult;
};

export function EventWebsiteStatusCard({ isDirty, onOpenReadiness, readiness }: EventWebsiteStatusCardProps) {
  const badgeLabel =
    readiness.state === "ready"
      ? "Ready"
      : readiness.state === "ready_with_warnings"
        ? "Ready with warnings"
        : "Needs review";

  return (
    <Card className="event-website-status-card sticky top-[calc(var(--dash-header-height)+1rem)] z-20 gap-0 px-4 py-3">
      <div className="flex items-center justify-between gap-2">
        <span className="event-status-badge">
          <span className="event-status-badge-dot" aria-hidden="true" />
          {badgeLabel}
        </span>
        <span className="text-sm font-semibold tabular-nums text-[--dash-foreground]">
          {readiness.readySectionCount}/{readiness.totalSectionCount}
        </span>
      </div>

      <Progress
        value={readiness.progressPercent}
        aria-label={`${readiness.progressPercent}% of active website sections are publish-ready`}
        className="event-website-progress my-2.5"
      />

      <div className="mb-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-[--dash-muted]">
        <span>{readiness.blockerCount} blockers</span>
        <span>{readiness.warningCount} warnings</span>
        {isDirty ? <span className="font-medium text-amber-700">Unsaved changes</span> : null}
      </div>

      <div className="flex items-center justify-between gap-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="event-status-preview-btn h-7 gap-1 px-2 text-xs"
        >
          Preview
          <ArrowUpRight className="size-3.5" aria-hidden="true" />
        </Button>
        <Button
          type="button"
          size="sm"
          className="event-status-publish-btn h-7 gap-1 px-2.5 text-xs"
          onClick={onOpenReadiness}
        >
          <Rocket className="size-3" aria-hidden="true" />
          Publish readiness
        </Button>
      </div>
    </Card>
  );
}

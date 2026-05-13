import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ArrowUpRight, Rocket } from "lucide-react";

type EventWebsiteStatusCardProps = {
  enabledCount: number;
  totalCount: number;
};

export function EventWebsiteStatusCard({
  enabledCount,
  totalCount,
}: EventWebsiteStatusCardProps) {
  const progress = Math.round((enabledCount / totalCount) * 100);

  return (
    <Card className="event-website-status-card sticky top-[calc(var(--dash-header-height)+1rem)] z-20 gap-0 px-4 py-3">
      {/* Row 1: badge + count */}
      <div className="flex items-center justify-between gap-2">
        <span className="event-status-badge">
          <span className="event-status-badge-dot" aria-hidden="true" />
          In progress
        </span>
        <span className="text-sm font-semibold tabular-nums text-[--dash-foreground]">
          {enabledCount}/{totalCount}
        </span>
      </div>

      {/* Row 2: progress bar */}
      <Progress
        value={progress}
        aria-label={`${progress}% of website sections enabled`}
        className="event-website-progress my-2.5"
      />

      {/* Row 3: Preview (left) + Publish readiness (right) */}
      <div className="flex items-center justify-between gap-2">
        <Button type="button" variant="ghost" size="sm" className="event-status-preview-btn h-7 gap-1 px-2 text-xs">
          Preview
          <ArrowUpRight className="size-3.5" aria-hidden="true" />
        </Button>
        <Button type="button" size="sm" className="event-status-publish-btn h-7 gap-1 px-2.5 text-xs">
          <Rocket className="size-3" aria-hidden="true" />
          Publish readiness
        </Button>
      </div>
    </Card>
  );
}

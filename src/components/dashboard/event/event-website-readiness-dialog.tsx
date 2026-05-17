"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type {
  EventWebsiteReadinessIssue,
  EventWebsiteReadinessResult,
} from "@/lib/event-website/readiness";
import type { EventWebsiteSectionKey } from "@/config/event-website-sections";

type EventWebsiteReadinessDialogProps = {
  isDirty: boolean;
  onIssueSelect: (sectionKey: EventWebsiteSectionKey) => void;
  onOpenChange: (open: boolean) => void;
  open: boolean;
  readiness: EventWebsiteReadinessResult;
  sectionLabels: Partial<Record<EventWebsiteSectionKey, string>>;
};

export function EventWebsiteReadinessDialog({
  isDirty,
  onIssueSelect,
  onOpenChange,
  open,
  readiness,
  sectionLabels,
}: EventWebsiteReadinessDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Publish readiness</DialogTitle>
          <DialogDescription>
            This checker reviews the current Event Website draft only. It does not publish your
            website or update Website Access.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          {isDirty ? (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
              Unsaved changes are included in this readiness check. Save the draft when you are
              ready to keep these updates.
            </div>
          ) : null}

          <div className="grid gap-2 rounded-lg border bg-muted/40 px-3 py-3 text-sm">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={readiness.blockerCount > 0 ? "destructive" : "secondary"}>
                {readiness.blockerCount} blocker{readiness.blockerCount === 1 ? "" : "s"}
              </Badge>
              <Badge variant="outline">
                {readiness.warningCount} warning{readiness.warningCount === 1 ? "" : "s"}
              </Badge>
              <Badge variant="outline">
                {readiness.readySectionCount}/{readiness.totalSectionCount} sections ready
              </Badge>
            </div>
            <p className="text-muted-foreground text-xs">
              Required sections need zero blockers. Enabled optional sections can still show
              warnings.
            </p>
          </div>

          {readiness.blockerCount === 0 && readiness.warningCount === 0 ? (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-3 text-sm text-emerald-900">
              This draft is ready. No blockers or warnings were found in the active Event Website
              sections.
            </div>
          ) : (
            <div className="grid gap-4">
              <IssueGroup
                issues={readiness.blockers}
                level="blocker"
                sectionLabels={sectionLabels}
                title="Blockers"
                onIssueSelect={onIssueSelect}
              />
              <IssueGroup
                issues={readiness.warnings}
                level="warning"
                sectionLabels={sectionLabels}
                title="Warnings"
                onIssueSelect={onIssueSelect}
              />
            </div>
          )}
        </div>

        <DialogFooter showCloseButton />
      </DialogContent>
    </Dialog>
  );
}

function IssueGroup({
  issues,
  level,
  onIssueSelect,
  sectionLabels,
  title,
}: {
  issues: EventWebsiteReadinessIssue[];
  level: "blocker" | "warning";
  onIssueSelect: (sectionKey: EventWebsiteSectionKey) => void;
  sectionLabels: Partial<Record<EventWebsiteSectionKey, string>>;
  title: string;
}) {
  if (issues.length === 0) {
    return null;
  }

  return (
    <section className="grid gap-2">
      <div className="flex items-center gap-2">
        <Badge variant={level === "blocker" ? "destructive" : "outline"}>{title}</Badge>
        <span className="text-muted-foreground text-xs">
          {issues.length} item{issues.length === 1 ? "" : "s"}
        </span>
      </div>

      <div className="grid gap-2">
        {issues.map((issue) => (
          <Button
            key={issue.id}
            type="button"
            variant="outline"
            className="h-auto items-start justify-start gap-2 px-3 py-3 text-left"
            onClick={() => onIssueSelect(issue.sectionKey)}
          >
            <span className="grid gap-1">
              <span className="text-muted-foreground text-[11px] uppercase tracking-wide">
                {sectionLabels[issue.sectionKey] ?? issue.sectionKey}
              </span>
              <span className="text-sm font-medium">{issue.title}</span>
              {issue.description ? (
                <span className="text-muted-foreground text-xs">{issue.description}</span>
              ) : null}
            </span>
          </Button>
        ))}
      </div>
    </section>
  );
}

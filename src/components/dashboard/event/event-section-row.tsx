"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import type { EventWebsiteSectionDefinition } from "@/config/event-website-sections";
import { ArrowDown, ArrowUp, Hourglass, Lock } from "lucide-react";
import { cn } from "@/lib/utils";

type EventSectionRowProps = {
  section: EventWebsiteSectionDefinition;
  selected: boolean;
  enabled: boolean;
  reorderable?: boolean;
  canMoveUp?: boolean;
  canMoveDown?: boolean;
  onSelect: () => void;
  onToggle?: (enabled: boolean) => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
};

export function EventSectionRow({
  canMoveDown = false,
  canMoveUp = false,
  enabled,
  onMoveDown,
  onMoveUp,
  onSelect,
  onToggle,
  reorderable = false,
  section,
  selected,
}: EventSectionRowProps) {
  const Icon = section.icon;
  const showRequiredLock = section.required && !section.comingSoon;
  const showComingSoonIndicator = Boolean(section.comingSoon);
  const rowAriaLabel = section.comingSoon ? `${section.label}. ${section.helper}` : undefined;

  return (
    <div
      className={cn(
        "event-section-row group w-full text-left",
        selected && "is-selected",
        section.comingSoon && "is-coming-soon",
        section.generated && "is-generated",
      )}
    >
      <button
        type="button"
        className="event-section-main"
        aria-label={rowAriaLabel}
        title={section.comingSoon ? section.helper : undefined}
        onClick={onSelect}
      >
        <span className="event-section-icon" aria-hidden="true">
          <Icon className="size-4" />
        </span>

        <span className="min-w-0 flex-1">
          <span className="flex min-w-0 flex-wrap items-center gap-2">
            <span className="event-section-title">{section.label}</span>
            {section.comingSoon ? (
              <Badge variant="outline" className="event-section-badge">
                Coming soon
              </Badge>
            ) : null}
          </span>
        </span>
      </button>

      <span className="event-section-actions" onClick={(event) => event.stopPropagation()}>
        {reorderable ? (
          <>
            {!section.comingSoon ? (
              <>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Move ${section.label} up`}
                  className="event-section-reorder-btn"
                  disabled={!canMoveUp}
                  onClick={onMoveUp}
                >
                  <ArrowUp className="size-3.5" aria-hidden="true" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Move ${section.label} down`}
                  className="event-section-reorder-btn"
                  disabled={!canMoveDown}
                  onClick={onMoveDown}
                >
                  <ArrowDown className="size-3.5" aria-hidden="true" />
                </Button>
              </>
            ) : null}
          </>
        ) : null}

        {showRequiredLock ? (
          <span className="event-section-lock" aria-label="Required">
            <Lock className="size-3.5" aria-hidden="true" />
          </span>
        ) : null}

        {showComingSoonIndicator ? (
          <span className="event-section-coming-soon-indicator" aria-label={section.helper}>
            <Hourglass className="size-3.5" aria-hidden="true" />
          </span>
        ) : null}

        {!showRequiredLock && !showComingSoonIndicator ? (
          <Switch
            className="dashboard-toggle event-section-toggle"
            checked={enabled}
            onCheckedChange={onToggle}
            aria-label={`Toggle ${section.label}`}
          />
        ) : null}
      </span>
    </div>
  );
}

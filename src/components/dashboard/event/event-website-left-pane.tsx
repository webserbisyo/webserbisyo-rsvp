"use client";

import { useEffect, useMemo, useState } from "react";
import { Reorder } from "motion/react";
import { Button } from "@/components/ui/button";
import { EventSectionRow } from "@/components/dashboard/event/event-section-row";
import { EventWebsiteStatusCard } from "@/components/dashboard/event/event-website-status-card";
import { setDashboardBreadcrumbDetail } from "@/components/dashboard/shell/dashboard-breadcrumb-state";
import {
  type EventWebsiteSectionDefinition,
  type EventWebsiteSectionKey,
} from "@/config/event-website-sections";
import { EVENT_WEBSITE_REORDER_UI_ENABLED } from "@/config/event-website-capabilities";
import type {
  EventWebsiteOperationalStatus,
  EventWebsiteSectionSummary,
} from "@/lib/event-website/readiness";
import { RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";

export type EventWebsiteStatusPill = {
  href?: string;
  label: string;
  tone: "neutral" | "success" | "warning";
};

type EventWebsiteLeftPaneProps = {
  allowFullCardDrag?: boolean;
  autoSaveEnabled: boolean;
  className?: string;
  defaultWebsiteFlowSections: EventWebsiteSectionDefinition[];
  enabledSections: Record<EventWebsiteSectionKey, boolean>;
  publicPageUrl: string | null;
  publicationStatusPill: EventWebsiteStatusPill;
  onReloadServerVersion?: () => void;
  onRetry?: () => void;
  onSaveNow?: () => void;
  futureDevelopmentSections: EventWebsiteSectionDefinition[];
  onEnabledSectionChange: (section: EventWebsiteSectionKey, enabled: boolean) => void;
  onResetWebsiteFlowOrder: () => void;
  onSelectedSectionChange?: (section: EventWebsiteSectionKey) => void;
  onToggleAutoSave: () => void;
  onWebsiteFlowSectionsChange: (sections: EventWebsiteSectionDefinition[]) => void;
  sectionSummary: EventWebsiteSectionSummary;
  selectedSection?: EventWebsiteSectionKey;
  showStatusCard?: boolean;
  statusPill: EventWebsiteStatusPill;
  statusCardSticky?: boolean;
  websiteFlowSections: EventWebsiteSectionDefinition[];
  workflowStatus: EventWebsiteOperationalStatus;
};

export function EventWebsiteLeftPane({
  allowFullCardDrag = true,
  autoSaveEnabled,
  className,
  defaultWebsiteFlowSections,
  enabledSections,
  publicPageUrl,
  publicationStatusPill,
  onReloadServerVersion,
  onRetry,
  onSaveNow,
  futureDevelopmentSections,
  onEnabledSectionChange,
  onResetWebsiteFlowOrder,
  onSelectedSectionChange,
  onToggleAutoSave,
  onWebsiteFlowSectionsChange,
  sectionSummary,
  selectedSection: selectedSectionProp,
  showStatusCard = true,
  statusPill,
  statusCardSticky = true,
  websiteFlowSections,
  workflowStatus,
}: EventWebsiteLeftPaneProps) {
  const defaultWebsiteFlowKeys = useMemo(
    () => defaultWebsiteFlowSections.map((section) => section.key),
    [defaultWebsiteFlowSections],
  );
  const [internalSelectedSection, setInternalSelectedSection] =
    useState<EventWebsiteSectionKey>("host_info");
  const selectedSection = selectedSectionProp ?? internalSelectedSection;

  const allSectionsByKey = useMemo(
    () =>
      new Map(
        [...websiteFlowSections, ...futureDevelopmentSections].map((section) => [
          section.key,
          section,
        ]),
      ),
    [futureDevelopmentSections, websiteFlowSections],
  );

  const selectedSectionLabel =
    allSectionsByKey.get(selectedSection)?.label ?? websiteFlowSections[0]?.label ?? "Host Info";

  // Dirty detection: compare current order keys to default order keys
  const isOrderDirty =
    websiteFlowSections.map((s) => s.key).join("|") !== defaultWebsiteFlowKeys.join("|");

  function selectSection(key: EventWebsiteSectionKey) {
    setInternalSelectedSection(key);
    onSelectedSectionChange?.(key);
  }

  function moveFlowSection(key: EventWebsiteSectionKey, direction: -1 | 1) {
    const index = websiteFlowSections.findIndex((section) => section.key === key);
    const nextIndex = index + direction;

    if (index < 0 || nextIndex < 0 || nextIndex >= websiteFlowSections.length) {
      return;
    }

    const next = [...websiteFlowSections];
    const moved = next[index]!;
    const target = next[nextIndex]!;
    next[index] = target;
    next[nextIndex] = moved;
    onWebsiteFlowSectionsChange(next);
  }

  useEffect(() => {
    setDashboardBreadcrumbDetail(selectedSectionLabel);
    return () => setDashboardBreadcrumbDetail(null);
  }, [selectedSectionLabel]);

  return (
    <section
      className={cn("event-website-pane", className)}
      aria-label="Event Website setup sections"
    >
      {showStatusCard ? (
        <EventWebsiteStatusCard
          autoSaveEnabled={autoSaveEnabled}
          onToggleAutoSave={onToggleAutoSave}
          publicPageUrl={publicPageUrl}
          publicationStatusPill={publicationStatusPill}
          onReloadServerVersion={onReloadServerVersion}
          onRetry={onRetry}
          onSaveNow={onSaveNow}
          sectionSummary={sectionSummary}
          statusPill={statusPill}
          sticky={statusCardSticky}
          websiteAccessHref="/dashboard/website-access"
          workflowStatus={workflowStatus}
        />
      ) : null}

      <div className="event-section-group">
        <div className="event-section-heading">
          <span className="event-section-heading-label">Website Flow</span>
          {EVENT_WEBSITE_REORDER_UI_ENABLED ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              aria-label="Reset website flow order to default"
              className={cn(
                "event-section-reset-btn",
                isOrderDirty && "event-section-reset-btn--dirty",
              )}
              onClick={onResetWebsiteFlowOrder}
            >
              <RotateCcw className="size-3" aria-hidden="true" />
              Reset order
            </Button>
          ) : null}
        </div>

        {EVENT_WEBSITE_REORDER_UI_ENABLED && allowFullCardDrag ? (
          <Reorder.Group
            axis="y"
            values={websiteFlowSections}
            onReorder={onWebsiteFlowSectionsChange}
            className="event-section-list"
            as="div"
          >
            {websiteFlowSections.map((section, index) => (
              <Reorder.Item
                key={section.key}
                value={section}
                as="div"
                className={cn(
                  "event-section-row-reorder-wrapper",
                  !section.comingSoon && "event-section-row--draggable",
                )}
                style={{ position: "relative" }}
                whileDrag={{ zIndex: 20 }}
              >
                <EventSectionRow
                  canMoveDown={index < websiteFlowSections.length - 1}
                  canMoveUp={index > 0}
                  enabled={section.required || (enabledSections[section.key] ?? false)}
                  reorderable={EVENT_WEBSITE_REORDER_UI_ENABLED}
                  section={section}
                  selected={selectedSection === section.key}
                  onMoveDown={() => moveFlowSection(section.key, 1)}
                  onMoveUp={() => moveFlowSection(section.key, -1)}
                  onSelect={() => selectSection(section.key)}
                  onToggle={(enabled) => onEnabledSectionChange(section.key, enabled)}
                />
              </Reorder.Item>
            ))}
          </Reorder.Group>
        ) : (
          <div className="event-section-list event-section-list--touch">
            {websiteFlowSections.map((section, index) => (
              <div
                key={section.key}
                className="event-section-row-reorder-wrapper event-section-row-reorder-wrapper--touch"
              >
                <EventSectionRow
                  canMoveDown={index < websiteFlowSections.length - 1}
                  canMoveUp={index > 0}
                  enabled={section.required || (enabledSections[section.key] ?? false)}
                  reorderable={EVENT_WEBSITE_REORDER_UI_ENABLED}
                  section={section}
                  selected={selectedSection === section.key}
                  onMoveDown={() => moveFlowSection(section.key, 1)}
                  onMoveUp={() => moveFlowSection(section.key, -1)}
                  onSelect={() => selectSection(section.key)}
                  onToggle={(enabled) => onEnabledSectionChange(section.key, enabled)}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Future development sections — visible but not active for launch */}
      <div className="event-section-group">
        <div className="event-section-heading">
          <span className="event-section-heading-label">Future Development</span>
        </div>

        <div className="event-section-list">
          {futureDevelopmentSections.map((section) => (
            <EventSectionRow
              key={section.key}
              enabled={false}
              section={section}
              selected={selectedSection === section.key}
              onSelect={() => selectSection(section.key)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

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
import type { EventWebsiteReadinessResult } from "@/lib/event-website/readiness";
import { RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";

type EventWebsiteLeftPaneProps = {
  defaultWebsiteFlowSections: EventWebsiteSectionDefinition[];
  enabledSections: Record<EventWebsiteSectionKey, boolean>;
  futureDevelopmentSections: EventWebsiteSectionDefinition[];
  isDirty: boolean;
  onOpenReadiness: () => void;
  onEnabledSectionChange: (section: EventWebsiteSectionKey, enabled: boolean) => void;
  onResetWebsiteFlowOrder: () => void;
  onSelectedSectionChange?: (section: EventWebsiteSectionKey) => void;
  onWebsiteFlowSectionsChange: (sections: EventWebsiteSectionDefinition[]) => void;
  readiness: EventWebsiteReadinessResult;
  selectedSection?: EventWebsiteSectionKey;
  websiteFlowSections: EventWebsiteSectionDefinition[];
};

export function EventWebsiteLeftPane({
  defaultWebsiteFlowSections,
  enabledSections,
  futureDevelopmentSections,
  isDirty,
  onOpenReadiness,
  onEnabledSectionChange,
  onResetWebsiteFlowOrder,
  onSelectedSectionChange,
  onWebsiteFlowSectionsChange,
  readiness,
  selectedSection: selectedSectionProp,
  websiteFlowSections,
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
        [...websiteFlowSections, ...futureDevelopmentSections].map((section) => [section.key, section]),
      ),
    [futureDevelopmentSections, websiteFlowSections],
  );

  const selectedSectionLabel =
    allSectionsByKey.get(selectedSection)?.label ??
    websiteFlowSections[0]?.label ??
    "Host Info";

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
    <section className="event-website-pane" aria-label="Event Website setup sections">
      <EventWebsiteStatusCard
        isDirty={isDirty}
        readiness={readiness}
        onOpenReadiness={onOpenReadiness}
      />

      <div className="event-section-group">
        <div className="event-section-heading">
          <span className="event-section-heading-label">Website Flow</span>
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
        </div>

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
                reorderable
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

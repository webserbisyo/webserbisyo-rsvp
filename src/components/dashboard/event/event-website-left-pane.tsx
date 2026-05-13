"use client";

import { useEffect, useMemo, useState } from "react";
import { Reorder } from "motion/react";
import { Button } from "@/components/ui/button";
import { EventSectionRow } from "@/components/dashboard/event/event-section-row";
import { EventWebsiteStatusCard } from "@/components/dashboard/event/event-website-status-card";
import { setDashboardBreadcrumbDetail } from "@/components/dashboard/shell/dashboard-breadcrumb-state";
import {
  resolveEventWebsiteSections,
  type EventWebsiteSectionDefinition,
  type EventWebsiteSectionKey,
} from "@/config/event-website-sections";
import { RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";

type EventWebsiteLeftPaneProps = {
  eventType: string | null;
  onSelectedSectionChange?: (section: EventWebsiteSectionKey) => void;
  selectedSection?: EventWebsiteSectionKey;
};

function buildDefaultEnabledState(optionalSections: EventWebsiteSectionDefinition[]) {
  return Object.fromEntries(
    optionalSections.map((section) => [section.key, section.defaultEnabled]),
  ) as Record<EventWebsiteSectionKey, boolean>;
}

export function EventWebsiteLeftPane({
  eventType,
  onSelectedSectionChange,
  selectedSection: selectedSectionProp,
}: EventWebsiteLeftPaneProps) {
  const resolvedSections = useMemo(() => resolveEventWebsiteSections(eventType), [eventType]);
  const defaultOptionalSectionOrder = useMemo(
    () => resolvedSections.optionalSections.map((section) => section.key),
    [resolvedSections.optionalSections],
  );
  const [internalSelectedSection, setInternalSelectedSection] =
    useState<EventWebsiteSectionKey>("host_info");
  const selectedSection = selectedSectionProp ?? internalSelectedSection;
  // orderedOptionalSections holds the full objects — Reorder.Item needs stable value identity
  const [orderedOptionalSections, setOrderedOptionalSections] = useState<
    EventWebsiteSectionDefinition[]
  >(resolvedSections.optionalSections);
  const [enabledSections, setEnabledSections] = useState(() =>
    buildDefaultEnabledState(resolvedSections.optionalSections),
  );

  const allSectionsByKey = useMemo(
    () =>
      new Map(
        [
          ...resolvedSections.requiredSections,
          ...resolvedSections.optionalSections,
          ...resolvedSections.futureDevelopmentSections,
        ].map((section) => [section.key, section]),
      ),
    [
      resolvedSections.futureDevelopmentSections,
      resolvedSections.optionalSections,
      resolvedSections.requiredSections,
    ],
  );

  const selectedSectionLabel =
    allSectionsByKey.get(selectedSection)?.label ??
    resolvedSections.requiredSections[0]?.label ??
    "Host Info";

  const enabledCount =
    resolvedSections.requiredSections.length +
    resolvedSections.optionalSections.filter(
      (section) => !section.comingSoon && enabledSections[section.key],
    ).length;
  const totalCount =
    resolvedSections.requiredSections.length +
    resolvedSections.optionalSections.filter((section) => !section.comingSoon).length;

  // Dirty detection: compare current order keys to default order keys
  const isOrderDirty =
    orderedOptionalSections.map((s) => s.key).join("|") !== defaultOptionalSectionOrder.join("|");

  function toggleSection(key: EventWebsiteSectionKey, enabled: boolean) {
    setEnabledSections((current) => ({ ...current, [key]: enabled }));
  }

  function selectSection(key: EventWebsiteSectionKey) {
    setInternalSelectedSection(key);
    onSelectedSectionChange?.(key);
  }

  // Keyboard-accessible reorder (Move Up / Down buttons)
  function moveOptionalSection(key: EventWebsiteSectionKey, direction: -1 | 1) {
    setOrderedOptionalSections((current) => {
      const index = current.findIndex((s) => s.key === key);
      const nextIndex = index + direction;

      if (index < 0 || nextIndex < 0 || nextIndex >= current.length) {
        return current;
      }

      const next = [...current];
      const moved = next[index]!;
      const target = next[nextIndex]!;
      next[index] = target;
      next[nextIndex] = moved;
      return next;
    });
  }

  function resetOrder() {
    setOrderedOptionalSections(resolvedSections.optionalSections);
  }

  useEffect(() => {
    setDashboardBreadcrumbDetail(selectedSectionLabel);
    return () => setDashboardBreadcrumbDetail(null);
  }, [selectedSectionLabel]);

  return (
    <section className="event-website-pane" aria-label="Event Website setup sections">
      <EventWebsiteStatusCard enabledCount={enabledCount} totalCount={totalCount} />

      {/* Required sections — not reorderable */}
      <div className="event-section-group">
        <div className="event-section-heading">
          <span className="event-section-heading-label">Required</span>
        </div>

        <div className="event-section-list">
          {resolvedSections.requiredSections.map((section) => (
            <EventSectionRow
              key={section.key}
              enabled
              section={section}
              selected={selectedSection === section.key}
              onSelect={() => selectSection(section.key)}
            />
          ))}
        </div>
      </div>

      {/* Optional sections — drag-and-drop reorderable */}
      <div className="event-section-group">
        <div className="event-section-heading">
          <span className="event-section-heading-label">Optional</span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            aria-label="Reset optional section order to default"
            className={cn(
              "event-section-reset-btn",
              isOrderDirty && "event-section-reset-btn--dirty",
            )}
            onClick={resetOrder}
          >
            <RotateCcw className="size-3" aria-hidden="true" />
            Reset order
          </Button>
        </div>

        {/* Reorder.Group manages drag reordering; list role for accessibility */}
        <Reorder.Group
          axis="y"
          values={orderedOptionalSections}
          onReorder={setOrderedOptionalSections}
          className="event-section-list"
          as="div"
        >
          {orderedOptionalSections.map((section, index) => (
            <Reorder.Item
              key={section.key}
              value={section}
              as="div"
              // Prevent drag on coming-soon items for cleaner UX
              drag={section.comingSoon ? false : "y"}
              className={cn(
                "event-section-row-reorder-wrapper",
                !section.comingSoon && "event-section-row--draggable",
              )}
              style={{ position: "relative" }}
              // Lift dragging item above siblings — no shadow/scale to avoid ghost container artifact
              whileDrag={{ zIndex: 20 }}
            >
              <EventSectionRow
                canMoveDown={index < orderedOptionalSections.length - 1}
                canMoveUp={index > 0}
                enabled={enabledSections[section.key] ?? false}
                reorderable
                section={section}
                selected={selectedSection === section.key}
                onMoveDown={() => moveOptionalSection(section.key, 1)}
                onMoveUp={() => moveOptionalSection(section.key, -1)}
                onSelect={() => selectSection(section.key)}
                onToggle={(enabled) => toggleSection(section.key, enabled)}
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
          {resolvedSections.futureDevelopmentSections.map((section) => (
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

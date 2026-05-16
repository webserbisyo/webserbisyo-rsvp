"use client";

import { useMemo, useState } from "react";
import { EventWebsiteEditorPanel } from "@/components/dashboard/event/event-website-editor-panel";
import { EventWebsiteLeftPane } from "@/components/dashboard/event/event-website-left-pane";
import {
  buildInitialEnabledSections,
  buildInitialPreviewDraft,
  buildInitialWebsiteFlow,
  type EventWebsitePreviewDraft,
} from "@/components/dashboard/event/event-website-preview-data";
import { EventWebsitePreviewPanel } from "@/components/dashboard/event/event-website-preview-panel";
import {
  resolveEventWebsiteSections,
  type EventWebsiteSectionKey,
} from "@/config/event-website-sections";
import type { DashboardEventWebsiteData } from "@/server/queries/dashboard-event";

type EventWebsiteWorkspaceProps = {
  eventWebsiteData: DashboardEventWebsiteData;
};

export function EventWebsiteWorkspace({ eventWebsiteData }: EventWebsiteWorkspaceProps) {
  const [selectedSection, setSelectedSection] = useState<EventWebsiteSectionKey>("host_info");
  const [previewScrollRequest, setPreviewScrollRequest] = useState(0);
  const resolvedSections = useMemo(
    () => resolveEventWebsiteSections(eventWebsiteData.eventType),
    [eventWebsiteData.eventType],
  );
  const editableSections = useMemo(
    () => [...resolvedSections.requiredSections, ...resolvedSections.optionalSections],
    [resolvedSections.optionalSections, resolvedSections.requiredSections],
  );
  const defaultWebsiteFlowSections = useMemo(
    () => buildInitialWebsiteFlow(editableSections),
    [editableSections],
  );
  const [websiteFlowSections, setWebsiteFlowSections] = useState(defaultWebsiteFlowSections);
  const [enabledSections, setEnabledSections] = useState(() =>
    buildInitialEnabledSections(editableSections),
  );
  const [previewDraft, setPreviewDraft] = useState(() => buildInitialPreviewDraft(eventWebsiteData));
  const sectionsByKey = useMemo(
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
  const selectedSectionDefinition = sectionsByKey.get(selectedSection);

  function resetWebsiteFlowOrder() {
    setWebsiteFlowSections(defaultWebsiteFlowSections);
  }

  function updateEnabledSection(key: EventWebsiteSectionKey, enabled: boolean) {
    const section = sectionsByKey.get(key);

    if (section?.required) {
      return;
    }

    setEnabledSections((current) => ({ ...current, [key]: enabled }));
  }

  function updatePreviewDraft(nextDraft: EventWebsitePreviewDraft) {
    setPreviewDraft(nextDraft);
  }

  function handleSelectedSectionChange(section: EventWebsiteSectionKey) {
    setSelectedSection(section);
    setPreviewScrollRequest((current) => current + 1);
  }

  return (
    <>
      <EventWebsiteLeftPane
        enabledSections={enabledSections}
        defaultWebsiteFlowSections={defaultWebsiteFlowSections}
        futureDevelopmentSections={resolvedSections.futureDevelopmentSections}
        selectedSection={selectedSection}
        websiteFlowSections={websiteFlowSections}
        onEnabledSectionChange={updateEnabledSection}
        onResetWebsiteFlowOrder={resetWebsiteFlowOrder}
        onSelectedSectionChange={handleSelectedSectionChange}
        onWebsiteFlowSectionsChange={setWebsiteFlowSections}
      />
      <EventWebsiteEditorPanel
        eventData={eventWebsiteData}
        previewDraft={previewDraft}
        resolvedSections={resolvedSections}
        selectedSectionId={selectedSection}
        onPreviewDraftChange={updatePreviewDraft}
      />
      <EventWebsitePreviewPanel
        enabledSections={enabledSections}
        previewScrollRequest={previewScrollRequest}
        previewDraft={previewDraft}
        selectedSection={selectedSectionDefinition}
        websiteFlowSections={websiteFlowSections}
      />
    </>
  );
}

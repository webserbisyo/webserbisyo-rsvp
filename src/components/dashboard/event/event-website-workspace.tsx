"use client";

import { useMemo, useState } from "react";
import { EventWebsiteEditorPanel } from "@/components/dashboard/event/event-website-editor-panel";
import { EventWebsiteLeftPane } from "@/components/dashboard/event/event-website-left-pane";
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
  const resolvedSections = useMemo(
    () => resolveEventWebsiteSections(eventWebsiteData.eventType),
    [eventWebsiteData.eventType],
  );

  return (
    <>
      <EventWebsiteLeftPane
        eventType={eventWebsiteData.eventType}
        selectedSection={selectedSection}
        onSelectedSectionChange={setSelectedSection}
      />
      <EventWebsiteEditorPanel
        eventData={eventWebsiteData}
        resolvedSections={resolvedSections}
        selectedSectionId={selectedSection}
      />
      <div className="event-website-preview-space" aria-hidden="true" />
    </>
  );
}

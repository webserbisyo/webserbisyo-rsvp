"use client";

import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { EventWebsiteEditorPanel } from "@/components/dashboard/event/event-website-editor-panel";
import { EventWebsiteLeftPane } from "@/components/dashboard/event/event-website-left-pane";
import {
  buildEventWebsiteContentFromPreviewDraft,
  buildInitialEnabledSections,
  buildInitialPreviewDraft,
  buildInitialWebsiteFlow,
  buildPreviewDraftFromContent,
  type EventWebsitePreviewDraft,
} from "@/components/dashboard/event/event-website-preview-data";
import { EventWebsitePreviewPanel } from "@/components/dashboard/event/event-website-preview-panel";
import {
  resolveEventWebsiteSections,
  type EventWebsiteSectionKey,
} from "@/config/event-website-sections";
import {
  getEventWebsiteSavedAt,
  getEventWebsiteWorkspaceStatus,
  summarizeEventWebsiteSections,
} from "@/lib/event-website/readiness";
import { saveEventWebsiteAction } from "@/server/actions/event-website";
import type { DashboardEventWebsiteData } from "@/server/queries/dashboard-event";

type EventWebsiteWorkspaceProps = {
  eventWebsiteData: DashboardEventWebsiteData;
  initialSelectedSection?: string | null;
};

export function EventWebsiteWorkspace({
  eventWebsiteData,
  initialSelectedSection = null,
}: EventWebsiteWorkspaceProps) {
  const [isPending, startTransition] = useTransition();
  const resolvedSections = useMemo(
    () => resolveEventWebsiteSections(eventWebsiteData.eventType),
    [eventWebsiteData.eventType],
  );
  const [savedContent, setSavedContent] = useState(eventWebsiteData.eventWebsiteContent);
  const initialSectionKey = useMemo(
    () =>
      resolveInitialSelectedSection({
        enabledSections: eventWebsiteData.eventWebsiteContent.layout.enabledSections,
        requestedSection: initialSelectedSection,
        resolvedSections,
      }),
    [eventWebsiteData.eventWebsiteContent.layout.enabledSections, initialSelectedSection, resolvedSections],
  );
  const [selectedSection, setSelectedSection] = useState<EventWebsiteSectionKey>(initialSectionKey);
  const [previewScrollRequest, setPreviewScrollRequest] = useState(0);
  const editableSections = useMemo(
    () => [...resolvedSections.requiredSections, ...resolvedSections.optionalSections],
    [resolvedSections.optionalSections, resolvedSections.requiredSections],
  );
  const defaultWebsiteFlowSections = useMemo(
    () =>
      buildInitialWebsiteFlow(
        editableSections,
        savedContent.layout.sectionOrder,
      ),
    [editableSections, savedContent.layout.sectionOrder],
  );
  const [websiteFlowSections, setWebsiteFlowSections] = useState(defaultWebsiteFlowSections);
  const [enabledSections, setEnabledSections] = useState(() =>
    buildInitialEnabledSections(
      editableSections,
      savedContent.layout.enabledSections,
    ),
  );
  const [previewDraft, setPreviewDraft] = useState(() => buildInitialPreviewDraft(eventWebsiteData));
  const currentContent = useMemo(
    () =>
      buildEventWebsiteContentFromPreviewDraft({
        enabledSections,
        previewDraft,
        savedContent,
        sectionOrder: websiteFlowSections.map((section) => section.key),
      }),
    [enabledSections, previewDraft, savedContent, websiteFlowSections],
  );
  const isDirty = useMemo(
    () => JSON.stringify(currentContent) !== JSON.stringify(savedContent),
    [currentContent, savedContent],
  );
  const sectionSummary = useMemo(() => summarizeEventWebsiteSections(currentContent), [currentContent]);
  const savedAt = useMemo(() => getEventWebsiteSavedAt(savedContent), [savedContent]);
  const workflowStatus = useMemo(
    () =>
      getEventWebsiteWorkspaceStatus({
        isDirty,
        isPublished: eventWebsiteData.publishState === "published",
        publishedAt: eventWebsiteData.snapshotPublishedAt ?? eventWebsiteData.publishedAt,
        savedAt,
      }),
    [eventWebsiteData.publishState, eventWebsiteData.publishedAt, eventWebsiteData.snapshotPublishedAt, isDirty, savedAt],
  );
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

  function handleSaveChanges() {
    if (!eventWebsiteData.eventId) {
      toast.error("The current event could not be resolved for saving.");
      return;
    }

    startTransition(async () => {
      const result = await saveEventWebsiteAction({
        content: currentContent,
        eventId: eventWebsiteData.eventId,
      });

      if (!result.ok) {
        toast.error(
          result.error === "The request could not be completed."
            ? "Event Website draft could not be saved."
            : result.error,
        );
        return;
      }

      setSavedContent(result.data.content);
      setPreviewDraft(buildPreviewDraftFromContent(result.data.content));
      toast.success("Event Website draft saved.");
    });
  }

  const saveButtonLabel = isPending
    ? "Saving..."
    : !eventWebsiteData.eventId
      ? "Save unavailable"
      : isDirty
        ? "Save changes"
        : "All changes saved";

  return (
    <>
      <EventWebsiteLeftPane
        enabledSections={enabledSections}
        defaultWebsiteFlowSections={defaultWebsiteFlowSections}
        eventSlug={eventWebsiteData.eventSlug}
        futureDevelopmentSections={resolvedSections.futureDevelopmentSections}
        selectedSection={selectedSection}
        sectionSummary={sectionSummary}
        websiteFlowSections={websiteFlowSections}
        workflowStatus={workflowStatus}
        onEnabledSectionChange={updateEnabledSection}
        onResetWebsiteFlowOrder={resetWebsiteFlowOrder}
        onSelectedSectionChange={handleSelectedSectionChange}
        onWebsiteFlowSectionsChange={setWebsiteFlowSections}
      />
      <div className="event-website-middle-space grid content-start gap-4">
        <EventWebsiteEditorPanel
          eventData={eventWebsiteData}
          onPreviewDraftChange={updatePreviewDraft}
          previewDraft={previewDraft}
          resolvedSections={resolvedSections}
          saveButtonProps={{
            disabled: isPending || !eventWebsiteData.eventId || !isDirty,
            label: saveButtonLabel,
            onClick: handleSaveChanges,
          }}
          selectedSectionId={selectedSection}
        />
      </div>
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

function resolveInitialSelectedSection(input: {
  enabledSections: Record<string, boolean | undefined>;
  requestedSection: string | null;
  resolvedSections: ReturnType<typeof resolveEventWebsiteSections>;
}) {
  const requestedSection = input.requestedSection?.trim();

  if (!requestedSection) {
    return "host_info";
  }

  if (requestedSection === "website_content") {
    return getDefaultWebsiteContentSection(input) ?? "host_info";
  }

  const validKeys = new Set<EventWebsiteSectionKey>([
    ...input.resolvedSections.requiredSections.map((section) => section.key),
    ...input.resolvedSections.optionalSections.map((section) => section.key),
  ]);

  return validKeys.has(requestedSection as EventWebsiteSectionKey)
    ? (requestedSection as EventWebsiteSectionKey)
    : "host_info";
}

function getDefaultWebsiteContentSection(input: {
  enabledSections: Record<string, boolean | undefined>;
  resolvedSections: ReturnType<typeof resolveEventWebsiteSections>;
}) {
  const enabledOptionalSection = input.resolvedSections.optionalSections.find(
    (section) => input.enabledSections[section.key] !== false,
  );

  return enabledOptionalSection?.key ?? input.resolvedSections.optionalSections[0]?.key ?? null;
}

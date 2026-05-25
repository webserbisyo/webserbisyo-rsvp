"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  getEventTypeAvailability,
  isDashboardBuilderEventTypeEnabled,
} from "@/config/event-type-availability";
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
import { ArrowUpRight, LockKeyhole } from "lucide-react";

type EventWebsiteWorkspaceProps = {
  eventWebsiteData: DashboardEventWebsiteData;
  initialSelectedSection?: string | null;
};

export function EventWebsiteWorkspace({
  eventWebsiteData,
  initialSelectedSection = null,
}: EventWebsiteWorkspaceProps) {
  const eventTypeAvailability = getEventTypeAvailability(eventWebsiteData.eventType);

  if (!isDashboardBuilderEventTypeEnabled(eventWebsiteData.eventType)) {
    return (
      <LockedEventWebsiteWorkspace
        eventSlug={eventWebsiteData.eventSlug}
        eventTypeLabel={eventTypeAvailability?.label ?? "This"}
        lockedTitle={eventTypeAvailability?.lockedTitle ?? "This Event Website is in development"}
        lockedDescription={
          eventTypeAvailability?.lockedDescription ??
          "Wedding websites are available now. This event type is already supported in our system, but its dedicated website builder is still being prepared."
        }
      />
    );
  }

  return (
    <EnabledEventWebsiteWorkspace
      eventWebsiteData={eventWebsiteData}
      initialSelectedSection={initialSelectedSection}
    />
  );
}

function EnabledEventWebsiteWorkspace({
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

function LockedEventWebsiteWorkspace({
  eventSlug,
  eventTypeLabel,
  lockedDescription,
  lockedTitle,
}: {
  eventSlug: string | null;
  eventTypeLabel: string;
  lockedDescription: string;
  lockedTitle: string;
}) {
  return (
    <>
      <section className="event-website-pane" aria-label="Event Website availability">
        <div className="event-website-status-card sticky top-[calc(var(--dash-header-height)+1rem)] z-20 gap-3 px-4 py-4">
          <Badge variant="outline" className="w-fit">
            In development
          </Badge>
          <div className="space-y-1.5">
            <h2 className="text-sm font-semibold text-[--dash-foreground]">{eventTypeLabel} Event Website</h2>
            <p className="text-xs leading-5 text-[--dash-muted]">
              Wedding websites are available now. Other event website builders stay locked on this page for now.
            </p>
          </div>
          <Button asChild type="button" variant="outline" size="sm" className="w-fit">
            <Link href="/dashboard/website-access">
              Website Access
              <ArrowUpRight className="size-3.5" aria-hidden="true" />
            </Link>
          </Button>
          {eventSlug ? (
            <p className="text-[11px] text-[--dash-muted]">Current event record: {eventSlug}</p>
          ) : null}
        </div>
      </section>

      <div className="event-website-middle-space grid content-start gap-4">
        <section className="event-website-editor" aria-label="Event Website availability notice">
          <div className="event-editor-card relative overflow-hidden">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,233,213,0.9),transparent_45%),radial-gradient(circle_at_bottom_right,rgba(252,211,77,0.18),transparent_40%)]"
            />
            <header className="event-editor-header relative space-y-3">
              <Badge variant="outline" className="w-fit">
                Event Website availability
              </Badge>
              <div className="flex items-start gap-3">
                <div className="rounded-full bg-amber-100 p-2 text-amber-700">
                  <LockKeyhole className="size-4" aria-hidden="true" />
                </div>
                <div className="space-y-2">
                  <h1>{lockedTitle}</h1>
                  <p>{lockedDescription}</p>
                  <p className="text-sm text-[--dash-muted]">
                    Your account and event record are safe. This builder will be unlocked in a future update.
                  </p>
                </div>
              </div>
            </header>
          </div>
        </section>
      </div>

      <aside className="event-website-preview-space" aria-label="Event Website preview availability">
        <div className="event-preview-panel">
          <div className="event-preview-frame-shell">
            <div className="event-preview-browser-bar">
              <span className="event-preview-browser-dot is-red" />
              <span className="event-preview-browser-dot is-green" />
              <span className="event-preview-browser-dot is-neutral" />
              <span className="event-preview-address">{eventTypeLabel.toLowerCase()}.event-website.preview</span>
            </div>
            <div className="event-preview-frame grid place-items-center bg-[linear-gradient(180deg,#fff8ef_0%,#ffffff_55%,#fff6ec_100%)]">
              <div className="mx-auto max-w-sm rounded-[2rem] border border-[rgba(184,122,56,0.16)] bg-white/90 p-6 text-center shadow-[0_18px_46px_rgba(70,46,20,0.08)] backdrop-blur">
                <Badge variant="outline" className="mb-3">
                  Preview locked
                </Badge>
                <h3 className="text-lg font-semibold text-slate-900">{eventTypeLabel} preview is not available yet</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  The Wedding preview stays live in production. Other event website previews remain unavailable on this page until their dedicated builder is ready.
                </p>
              </div>
            </div>
          </div>
        </div>
      </aside>
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

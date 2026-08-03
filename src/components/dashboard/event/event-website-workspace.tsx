"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";
import { ErrorState } from "@/components/feedback/error-state";
import { EventWebsiteEditorPanel } from "@/components/dashboard/event/event-website-editor-panel";
import {
  EditorSaveButton,
  type EventWebsiteSaveButtonProps,
} from "@/components/dashboard/event/event-website-optional-fields";
import {
  EventWebsiteLeftPane,
  type EventWebsiteStatusPill,
} from "@/components/dashboard/event/event-website-left-pane";
import {
  buildEventWebsiteContentFromPreviewDraft,
  buildInitialEnabledSections,
  buildInitialPreviewDraft,
  buildInitialWebsiteFlow,
  buildPreviewDraftFromContent,
  type EventWebsitePreviewDraft,
} from "@/components/dashboard/event/event-website-preview-data";
import { EventWebsitePreviewPanel } from "@/components/dashboard/event/event-website-preview-panel";
import { EventWebsiteStatusCard } from "@/components/dashboard/event/event-website-status-card";
import { useEventWebsiteAutosave } from "@/components/dashboard/event/use-event-website-autosave";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  getEventTypeAvailability,
  isDashboardBuilderEventTypeEnabled,
} from "@/config/event-type-availability";
import {
  resolveEventWebsiteSections,
  type EventWebsiteSectionDefinition,
  type EventWebsiteSectionKey,
} from "@/config/event-website-sections";
import {
  getEventWebsiteSavedAt,
  getEventWebsiteWorkspaceStatus,
  summarizeEventWebsiteSections,
} from "@/lib/event-website/readiness";
import { emitDashboardSyncEvent } from "@/lib/dashboard/dashboard-sync";
import { dashboardKeys } from "@/lib/dashboard/dashboard-query-keys";
import { cn } from "@/lib/utils";
import type { DashboardEventWebsiteData } from "@/server/queries/dashboard-event";
import { ArrowUpRight, Eye, Layers3, LockKeyhole, X } from "lucide-react";

const DESKTOP_LAYOUT_QUERY = "(min-width: 1200px)";
const TABLET_LAYOUT_QUERY = "(min-width: 768px)";

type ResponsiveWorkspaceMode = "flow" | "preview";

type EventWebsiteWorkspaceProps = {
  eventWebsiteData: DashboardEventWebsiteData;
  initialSelectedSection?: string | null;
};

type ValidDashboardEventWebsiteData = Omit<
  DashboardEventWebsiteData,
  "contentIntegrity" | "eventWebsiteContent"
> & {
  contentIntegrity: { status: "valid" };
  eventWebsiteContent: NonNullable<DashboardEventWebsiteData["eventWebsiteContent"]>;
};

type EnabledEventWebsiteWorkspaceProps = {
  eventWebsiteData: ValidDashboardEventWebsiteData;
  initialSelectedSection?: string | null;
};

function subscribeToMediaQuery(query: string, callback: () => void) {
  if (typeof window === "undefined") {
    return () => {};
  }

  const mediaQueryList = window.matchMedia(query);
  mediaQueryList.addEventListener("change", callback);

  return () => mediaQueryList.removeEventListener("change", callback);
}

function getMediaQuerySnapshot(query: string) {
  return typeof window !== "undefined" ? window.matchMedia(query).matches : false;
}

function useMediaQuery(query: string, serverSnapshot: boolean) {
  return useSyncExternalStore(
    (callback) => subscribeToMediaQuery(query, callback),
    () => getMediaQuerySnapshot(query),
    () => serverSnapshot,
  );
}

export function EventWebsiteWorkspace({
  eventWebsiteData,
  initialSelectedSection = null,
}: EventWebsiteWorkspaceProps) {
  if (
    eventWebsiteData.contentIntegrity.status === "invalid" ||
    !eventWebsiteData.eventWebsiteContent
  ) {
    return (
      <ErrorState
        title="Event Website data could not be loaded"
        description={`Your saved website data has not been replaced. Retry later or contact platform support with diagnostic ${
          eventWebsiteData.contentIntegrity.status === "invalid"
            ? eventWebsiteData.contentIntegrity.diagnosticId
            : "event-content-unresolved"
        }.`}
      />
    );
  }

  const validEventWebsiteData: ValidDashboardEventWebsiteData = {
    ...eventWebsiteData,
    contentIntegrity: { status: "valid" },
    eventWebsiteContent: eventWebsiteData.eventWebsiteContent,
  };
  const eventTypeAvailability = getEventTypeAvailability(eventWebsiteData.eventType);

  if (!isDashboardBuilderEventTypeEnabled(eventWebsiteData.eventType)) {
    return (
      <div className="event-website-workspace">
        <LockedEventWebsiteWorkspace
          eventSlug={eventWebsiteData.eventSlug}
          eventTypeLabel={eventTypeAvailability?.label ?? "This"}
          lockedTitle={eventTypeAvailability?.lockedTitle ?? "This Event Website is in development"}
          lockedDescription={
            eventTypeAvailability?.lockedDescription ??
            "Wedding websites are available now. This event type is already supported in our system, but its dedicated website builder is still being prepared."
          }
        />
      </div>
    );
  }

  return (
    <EnabledEventWebsiteWorkspace
      eventWebsiteData={validEventWebsiteData}
      initialSelectedSection={initialSelectedSection}
    />
  );
}

function EnabledEventWebsiteWorkspace({
  eventWebsiteData,
  initialSelectedSection = null,
}: EnabledEventWebsiteWorkspaceProps) {
  const queryClient = useQueryClient();
  const [stableEventId] = useState(() => eventWebsiteData.eventId);
  const eventTransitionHandledRef = useRef(false);
  const isDesktopLayout = useMediaQuery(DESKTOP_LAYOUT_QUERY, true);
  const isTabletLayout = useMediaQuery(TABLET_LAYOUT_QUERY, false);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);
  const [responsiveMode, setResponsiveMode] = useState<ResponsiveWorkspaceMode>("flow");
  const [isResponsiveEditorOpen, setIsResponsiveEditorOpen] = useState(false);
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
    [
      eventWebsiteData.eventWebsiteContent.layout.enabledSections,
      initialSelectedSection,
      resolvedSections,
    ],
  );
  const [selectedSection, setSelectedSection] = useState<EventWebsiteSectionKey>(initialSectionKey);
  const [previewScrollRequest, setPreviewScrollRequest] = useState(0);
  const editableSections = useMemo(
    () => [...resolvedSections.requiredSections, ...resolvedSections.optionalSections],
    [resolvedSections.optionalSections, resolvedSections.requiredSections],
  );
  const defaultWebsiteFlowSections = useMemo(
    () => buildInitialWebsiteFlow(editableSections, savedContent.layout.sectionOrder),
    [editableSections, savedContent.layout.sectionOrder],
  );
  const [websiteFlowSections, setWebsiteFlowSections] = useState(defaultWebsiteFlowSections);
  const [enabledSections, setEnabledSections] = useState(() =>
    buildInitialEnabledSections(editableSections, savedContent.layout.enabledSections),
  );
  const [previewDraft, setPreviewDraft] = useState(() =>
    buildInitialPreviewDraft(eventWebsiteData),
  );
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
  const handleDraftSaved = useCallback(
    (result: { content: typeof savedContent; savedAt: string; savedRevision: number }) => {
      setSavedContent(result.content);
      if (stableEventId) {
        emitDashboardSyncEvent({
          eventId: stableEventId,
          name: "event-website:draft-updated",
        });
      }
      invalidateEventWebsiteQueries(queryClient);
    },
    [queryClient, stableEventId],
  );
  const replaceDraftFromServer = useCallback(
    (nextContent: typeof savedContent) => {
      setSavedContent(nextContent);
      setPreviewDraft(buildPreviewDraftFromContent(nextContent));
      setEnabledSections(
        buildInitialEnabledSections(editableSections, nextContent.layout.enabledSections),
      );
      setWebsiteFlowSections(
        buildInitialWebsiteFlow(editableSections, nextContent.layout.sectionOrder),
      );
    },
    [editableSections],
  );
  const autosave = useEventWebsiteAutosave({
    autoSaveEnabled,
    content: currentContent,
    eventId: stableEventId,
    initialSavedAt: eventWebsiteData.savedAt,
    initialSavedRevision: eventWebsiteData.savedRevision,
    onDraftReplaced: replaceDraftFromServer,
    onSaved: handleDraftSaved,
  });
  const isDirty = autosave.isDirty;
  useEffect(() => {
    if (eventWebsiteData.eventId === stableEventId || eventTransitionHandledRef.current) {
      return;
    }

    eventTransitionHandledRef.current = true;
    void autosave.flush().then((saved) => {
      if (saved) {
        window.location.reload();
      }
    });
  }, [autosave, eventWebsiteData.eventId, stableEventId]);
  const sectionSummary = useMemo(
    () => summarizeEventWebsiteSections(currentContent),
    [currentContent],
  );
  const savedAt = autosave.savedAt ?? getEventWebsiteSavedAt(savedContent);
  const workflowStatus = useMemo(
    () =>
      getEventWebsiteWorkspaceStatus({
        isDirty,
        isPublished: eventWebsiteData.publishState === "published",
        publishedAt: eventWebsiteData.snapshotPublishedAt ?? eventWebsiteData.publishedAt,
        publishedRevision: eventWebsiteData.publishedRevision,
        savedAt,
        savedRevision: autosave.savedRevision,
      }),
    [
      eventWebsiteData.publishState,
      eventWebsiteData.publishedAt,
      eventWebsiteData.snapshotPublishedAt,
      eventWebsiteData.publishedRevision,
      isDirty,
      savedAt,
      autosave.savedRevision,
    ],
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

  useEffect(() => {
    let cancelled = false;

    queueMicrotask(() => {
      if (!cancelled) {
        setSelectedSection((current) =>
          current === initialSectionKey ? current : initialSectionKey,
        );
      }
    });

    return () => {
      cancelled = true;
    };
  }, [initialSectionKey]);

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

  function updateWebsiteFlowSections(nextSections: typeof websiteFlowSections) {
    setWebsiteFlowSections(nextSections);
  }

  function handleSelectedSectionChange(section: EventWebsiteSectionKey) {
    setSelectedSection(section);
    setPreviewScrollRequest((current) => current + 1);
  }

  function handleResponsiveSectionSelect(section: EventWebsiteSectionKey) {
    handleSelectedSectionChange(section);
    setResponsiveMode("flow");
    setIsResponsiveEditorOpen(true);
  }

  function handleSaveChanges() {
    void autosave.saveNow();
  }

  const statusPill = useMemo<EventWebsiteStatusPill>(() => {
    if (autosave.persistenceState === "saving") {
      return {
        label: "Saving changes…",
        tone: "neutral",
      };
    }

    if (autosave.persistenceState === "failed" || autosave.persistenceState === "conflict") {
      return {
        label:
          autosave.persistenceState === "conflict"
            ? "Another saved version was found"
            : "Save failed — Retry",
        tone: "warning",
      };
    }

    if (isDirty) {
      return {
        label: "Unsaved changes",
        tone: "warning",
      };
    }

    return {
      label: "All changes saved",
      tone: "neutral",
    };
  }, [autosave.persistenceState, isDirty]);
  const publicationStatusPill = useMemo<EventWebsiteStatusPill>(() => {
    if (eventWebsiteData.publishState !== "published") {
      return {
        href: "/dashboard/website-access",
        label: "Not published",
        tone: "neutral",
      };
    }

    if (autosave.savedRevision > eventWebsiteData.publishedRevision) {
      return {
        href: "/dashboard/website-access",
        label: "Draft changes not published",
        tone: "warning",
      };
    }

    return {
      href: "/dashboard/website-access",
      label: "Published",
      tone: "success",
    };
  }, [autosave.savedRevision, eventWebsiteData.publishState, eventWebsiteData.publishedRevision]);

  const saveButtonLabel =
    autosave.persistenceState === "saving"
      ? "Saving..."
      : !eventWebsiteData.eventId
        ? "Save unavailable"
        : isDirty
          ? "Save changes"
          : "All changes saved";

  const saveButtonProps = {
    disabled: autosave.persistenceState === "saving" || !eventWebsiteData.eventId || !isDirty,
    hidden: autoSaveEnabled,
    label: saveButtonLabel,
    onClick: handleSaveChanges,
  };
  const responsiveEditorIsOpen = responsiveMode === "flow" && isResponsiveEditorOpen;

  if (isDesktopLayout) {
    return (
      <div className="event-website-workspace">
        <EventWebsiteLeftPane
          allowFullCardDrag={isDesktopLayout}
          autoSaveEnabled={autoSaveEnabled}
          enabledSections={enabledSections}
          defaultWebsiteFlowSections={defaultWebsiteFlowSections}
          publicPageUrl={eventWebsiteData.publicPageUrl}
          publicationStatusPill={publicationStatusPill}
          onRetry={autosave.persistenceState === "failed" ? () => void autosave.retry() : undefined}
          onSaveNow={
            isDirty && !["saving", "conflict"].includes(autosave.persistenceState)
              ? () => void autosave.saveNow()
              : undefined
          }
          futureDevelopmentSections={resolvedSections.futureDevelopmentSections}
          onToggleAutoSave={() => setAutoSaveEnabled((current) => !current)}
          selectedSection={selectedSection}
          sectionSummary={sectionSummary}
          statusPill={statusPill}
          websiteFlowSections={websiteFlowSections}
          workflowStatus={workflowStatus}
          onEnabledSectionChange={updateEnabledSection}
          onResetWebsiteFlowOrder={resetWebsiteFlowOrder}
          onSelectedSectionChange={handleSelectedSectionChange}
          onWebsiteFlowSectionsChange={updateWebsiteFlowSections}
        />
        <div className="event-website-middle-space grid content-start gap-4">
          <EventWebsiteEditorPanel
            eventData={eventWebsiteData}
            onPreviewDraftChange={updatePreviewDraft}
            previewDraft={previewDraft}
            resolvedSections={resolvedSections}
            saveButtonProps={saveButtonProps}
            selectedSectionId={selectedSection}
          />
        </div>
        <EventWebsitePreviewPanel
          customWebsitePreview={eventWebsiteData.customWebsitePreview}
          customWebsitePreviewRevision={autosave.savedRevision}
          enabledSections={enabledSections}
          guestbookMessages={eventWebsiteData.guestbookMessages}
          previewChromeUrl={eventWebsiteData.previewChromeUrl}
          previewScrollRequest={previewScrollRequest}
          previewDraft={previewDraft}
          selectedSection={selectedSectionDefinition}
          websiteFlowSections={websiteFlowSections}
        />
        <EventWebsiteConflictDialog
          conflictDetails={autosave.conflictDetails}
          open={autosave.persistenceState === "conflict"}
          onAdoptLatest={() => void autosave.adoptLatest()}
          onKeepLocal={() => void autosave.keepLocalChanges()}
          onReview={() => void autosave.reviewConflict()}
          onMergeNonOverlapping={() => void autosave.mergeNonOverlappingConflict()}
        />
      </div>
    );
  }

  return (
    <div className="event-website-responsive-shell">
      <EventWebsiteConflictDialog
        conflictDetails={autosave.conflictDetails}
        open={autosave.persistenceState === "conflict"}
        onAdoptLatest={() => void autosave.adoptLatest()}
        onKeepLocal={() => void autosave.keepLocalChanges()}
        onReview={() => void autosave.reviewConflict()}
        onMergeNonOverlapping={() => void autosave.mergeNonOverlappingConflict()}
      />
      <EventWebsiteStatusCard
        autoSaveEnabled={autoSaveEnabled}
        onToggleAutoSave={() => setAutoSaveEnabled((current) => !current)}
        publicPageUrl={eventWebsiteData.publicPageUrl}
        publicationStatusPill={publicationStatusPill}
        onRetry={autosave.persistenceState === "failed" ? () => void autosave.retry() : undefined}
        onSaveNow={
          isDirty && !["saving", "conflict"].includes(autosave.persistenceState)
            ? () => void autosave.saveNow()
            : undefined
        }
        sectionSummary={sectionSummary}
        statusPill={statusPill}
        sticky={false}
        websiteAccessHref="/dashboard/website-access"
        workflowStatus={workflowStatus}
      />

      <Tabs
        value={responsiveMode}
        onValueChange={(value) => {
          const nextMode = value as ResponsiveWorkspaceMode;
          setResponsiveMode(nextMode);

          if (nextMode === "preview") {
            setIsResponsiveEditorOpen(false);
          }
        }}
        className="event-website-responsive-tabs"
      >
        <TabsList className="event-website-mode-tabs" aria-label="Event Website mobile workspace">
          <TabsTrigger value="flow" className="event-website-mode-trigger">
            <Layers3 className="size-4" aria-hidden="true" />
            Flow
          </TabsTrigger>
          <TabsTrigger value="preview" className="event-website-mode-trigger">
            <Eye className="size-4" aria-hidden="true" />
            Preview
          </TabsTrigger>
        </TabsList>

        <TabsContent value="flow" className="event-website-mode-panel">
          <EventWebsiteLeftPane
            allowFullCardDrag={false}
            autoSaveEnabled={autoSaveEnabled}
            className="event-website-pane--responsive-flow"
            defaultWebsiteFlowSections={defaultWebsiteFlowSections}
            enabledSections={enabledSections}
            publicPageUrl={eventWebsiteData.publicPageUrl}
            publicationStatusPill={publicationStatusPill}
            onRetry={
              autosave.persistenceState === "failed" ? () => void autosave.retry() : undefined
            }
            onSaveNow={
              isDirty && !["saving", "conflict"].includes(autosave.persistenceState)
                ? () => void autosave.saveNow()
                : undefined
            }
            futureDevelopmentSections={resolvedSections.futureDevelopmentSections}
            onToggleAutoSave={() => setAutoSaveEnabled((current) => !current)}
            selectedSection={selectedSection}
            sectionSummary={sectionSummary}
            showStatusCard={false}
            statusPill={statusPill}
            statusCardSticky={false}
            websiteFlowSections={websiteFlowSections}
            workflowStatus={workflowStatus}
            onEnabledSectionChange={updateEnabledSection}
            onResetWebsiteFlowOrder={resetWebsiteFlowOrder}
            onSelectedSectionChange={handleResponsiveSectionSelect}
            onWebsiteFlowSectionsChange={updateWebsiteFlowSections}
          />
        </TabsContent>

        <TabsContent value="preview" className="event-website-mode-panel">
          <div className="event-website-responsive-preview-wrap">
            <EventWebsitePreviewPanel
              compactChrome
              customWebsitePreview={eventWebsiteData.customWebsitePreview}
              customWebsitePreviewRevision={autosave.savedRevision}
              defaultDevice={isTabletLayout ? "desktop" : "mobile"}
              enabledSections={enabledSections}
              guestbookMessages={eventWebsiteData.guestbookMessages}
              mode="responsive"
              previewChromeUrl={eventWebsiteData.previewChromeUrl}
              previewScrollRequest={previewScrollRequest}
              previewDraft={previewDraft}
              selectedSection={selectedSectionDefinition}
              showDeviceTabs={false}
              websiteFlowSections={websiteFlowSections}
            />
          </div>
        </TabsContent>
      </Tabs>

      <ResponsiveSectionEditorSurface
        eventData={eventWebsiteData}
        isOpen={responsiveEditorIsOpen}
        isTabletLayout={isTabletLayout}
        onOpenChange={setIsResponsiveEditorOpen}
        onPreviewDraftChange={updatePreviewDraft}
        previewDraft={previewDraft}
        persistenceStatusPill={statusPill}
        onRetry={autosave.persistenceState === "failed" ? () => void autosave.retry() : undefined}
        resolvedSections={resolvedSections}
        saveButtonProps={saveButtonProps}
        selectedSection={selectedSectionDefinition}
        selectedSectionId={selectedSection}
      />
    </div>
  );
}

function EventWebsiteConflictDialog({
  conflictDetails,
  onAdoptLatest,
  onKeepLocal,
  onMergeNonOverlapping,
  onReview,
  open,
}: {
  conflictDetails: { overlappingPaths: readonly unknown[] } | null;
  onAdoptLatest: () => void;
  onKeepLocal: () => void;
  onMergeNonOverlapping: () => void;
  onReview: () => void;
  open: boolean;
}) {
  const [confirmKeepLocal, setConfirmKeepLocal] = useState(false);
  const hasOverlap = Boolean(conflictDetails?.overlappingPaths.length);

  useEffect(() => {
    if (!open) setConfirmKeepLocal(false);
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={() => undefined}>
      <DialogContent showCloseButton={false} className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Another saved version was found</DialogTitle>
          <DialogDescription>
            Your draft is preserved. Review the saved version before choosing how to continue.
          </DialogDescription>
        </DialogHeader>
        {conflictDetails ? (
          <p className="text-muted-foreground text-sm" aria-live="polite">
            {hasOverlap
              ? "Both editors changed at least one of the same fields. Choose which version to keep."
              : "The changes are separate and can be merged without replacing the other editor’s work."}
          </p>
        ) : null}
        {confirmKeepLocal ? (
          <p className="text-sm font-medium">
            Keep your changes and preserve unrelated saved changes? This writes a new revision.
          </p>
        ) : null}
        <DialogFooter className="gap-2 sm:flex-wrap">
          {confirmKeepLocal ? (
            <>
              <Button type="button" variant="outline" onClick={() => setConfirmKeepLocal(false)}>
                Cancel
              </Button>
              <Button type="button" onClick={onKeepLocal}>
                Keep my changes
              </Button>
            </>
          ) : (
            <>
              <Button type="button" variant="outline" onClick={onReview}>
                Review changes
              </Button>
              {conflictDetails && !hasOverlap ? (
                <Button type="button" variant="outline" onClick={onMergeNonOverlapping}>
                  Merge saved changes
                </Button>
              ) : null}
              <Button type="button" variant="outline" onClick={onAdoptLatest}>
                Load latest saved version
              </Button>
              <Button type="button" onClick={() => setConfirmKeepLocal(true)}>
                Keep my changes
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function invalidateEventWebsiteQueries(queryClient: ReturnType<typeof useQueryClient>) {
  void queryClient.invalidateQueries({ queryKey: dashboardKeys.event() });
  void queryClient.invalidateQueries({ queryKey: dashboardKeys.websiteAccess() });
  void queryClient.invalidateQueries({ queryKey: dashboardKeys.home() });
}

function ResponsiveSectionEditorSurface({
  eventData,
  isOpen,
  isTabletLayout,
  onOpenChange,
  onPreviewDraftChange,
  onRetry,
  persistenceStatusPill,
  previewDraft,
  resolvedSections,
  saveButtonProps,
  selectedSection,
  selectedSectionId,
}: {
  eventData: ValidDashboardEventWebsiteData;
  isOpen: boolean;
  isTabletLayout: boolean;
  onOpenChange: (open: boolean) => void;
  onPreviewDraftChange: (draft: EventWebsitePreviewDraft) => void;
  onRetry?: () => void;
  persistenceStatusPill: EventWebsiteStatusPill;
  previewDraft: EventWebsitePreviewDraft;
  resolvedSections: ReturnType<typeof resolveEventWebsiteSections>;
  saveButtonProps: EventWebsiteSaveButtonProps;
  selectedSection: EventWebsiteSectionDefinition | undefined;
  selectedSectionId: EventWebsiteSectionKey;
}) {
  const showMobileStickySaveButton =
    saveButtonProps.hidden !== true &&
    (saveButtonProps.label === "Save changes" || saveButtonProps.label === "Saving...");
  const inlineEditorSaveButtonProps: EventWebsiteSaveButtonProps = {
    ...saveButtonProps,
    hidden: true,
  };
  const content = (
    <>
      <div className="event-website-mobile-editor-shell">
        {isTabletLayout ? (
          <SheetClose asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="event-website-mobile-editor-shell__close"
            >
              <X className="size-4" aria-hidden="true" />
              <span className="sr-only">Close editor</span>
            </Button>
          </SheetClose>
        ) : null}
        <div className="event-website-mobile-editor-shell__title-row">
          <h2 className="event-website-mobile-editor-shell__title">
            {selectedSection?.label ?? "Edit section"}
          </h2>
          <span className="event-status-badge is-neutral" aria-live="polite">
            {persistenceStatusPill.label}
          </span>
          {onRetry ? (
            <Button type="button" variant="link" size="sm" onClick={onRetry}>
              Retry
            </Button>
          ) : null}
        </div>
      </div>
      <div className="event-website-mobile-editor-scroll">
        <div
          className={cn(
            "event-website-mobile-editor-body",
            showMobileStickySaveButton && "event-website-mobile-editor-body--with-sticky-save",
          )}
        >
          <EventWebsiteEditorPanel
            eventData={eventData}
            onPreviewDraftChange={onPreviewDraftChange}
            previewDraft={previewDraft}
            resolvedSections={resolvedSections}
            saveButtonProps={inlineEditorSaveButtonProps}
            selectedSectionId={selectedSectionId}
          />
        </div>
      </div>
      {showMobileStickySaveButton ? (
        <div className="event-website-mobile-editor-footer">
          <EditorSaveButton
            {...saveButtonProps}
            buttonClassName="event-website-mobile-editor-footer__button"
            containerClassName="event-website-mobile-editor-footer__actions"
          />
        </div>
      ) : null}
    </>
  );

  if (isTabletLayout) {
    return (
      <Sheet open={isOpen} onOpenChange={onOpenChange}>
        <SheetContent
          data-dashboard
          side="right"
          showCloseButton={false}
          overlayClassName="bg-black/34 supports-backdrop-filter:backdrop-blur-sm"
          className="event-website-mobile-editor-sheet"
        >
          <SheetHeader className="sr-only">
            <SheetTitle>{selectedSection?.label ?? "Edit section"}</SheetTitle>
            <SheetDescription>Edit the selected Event Website section.</SheetDescription>
          </SheetHeader>
          {content}
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Drawer open={isOpen} onOpenChange={onOpenChange}>
      <DrawerContent data-dashboard className="event-website-mobile-editor-drawer">
        <DrawerHeader className="sr-only">
          <DrawerTitle>{selectedSection?.label ?? "Edit section"}</DrawerTitle>
          <DrawerDescription>Edit the selected Event Website section.</DrawerDescription>
        </DrawerHeader>
        {content}
      </DrawerContent>
    </Drawer>
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
            <h2 className="text-sm font-semibold text-[--dash-foreground]">
              {eventTypeLabel} Event Website
            </h2>
            <p className="text-xs leading-5 text-[--dash-muted]">
              Wedding websites are available now. Other event website builders stay locked on this
              page for now.
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
                    Your account and event record are safe. This builder will be unlocked in a
                    future update.
                  </p>
                </div>
              </div>
            </header>
          </div>
        </section>
      </div>

      <aside
        className="event-website-preview-space"
        aria-label="Event Website preview availability"
      >
        <div className="event-preview-panel">
          <div className="event-preview-frame-shell">
            <div className="event-preview-browser-bar">
              <span className="event-preview-browser-dot is-red" />
              <span className="event-preview-browser-dot is-green" />
              <span className="event-preview-browser-dot is-neutral" />
              <span className="event-preview-address">
                {eventTypeLabel.toLowerCase()}.event-website.preview
              </span>
            </div>
            <div className="event-preview-frame grid place-items-center bg-[linear-gradient(180deg,#fff8ef_0%,#ffffff_55%,#fff6ec_100%)]">
              <div className="mx-auto max-w-sm rounded-[2rem] border border-[rgba(184,122,56,0.16)] bg-white/90 p-6 text-center shadow-[0_18px_46px_rgba(70,46,20,0.08)] backdrop-blur">
                <Badge variant="outline" className="mb-3">
                  Preview locked
                </Badge>
                <h3 className="text-lg font-semibold text-slate-900">
                  {eventTypeLabel} preview is not available yet
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  The Wedding preview stays live in production. Other event website previews remain
                  unavailable on this page until their dedicated builder is ready.
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

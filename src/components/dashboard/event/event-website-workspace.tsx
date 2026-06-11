"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  useTransition,
} from "react";
import Link from "next/link";
import { toast } from "sonner";
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
  type EventWebsitePreviewDraft,
} from "@/components/dashboard/event/event-website-preview-data";
import { EventWebsitePreviewPanel } from "@/components/dashboard/event/event-website-preview-panel";
import { EventWebsiteStatusCard } from "@/components/dashboard/event/event-website-status-card";
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
import { markEventWebsiteDraftSavePending } from "@/lib/event-website/draft-save-coordination";
import { cn } from "@/lib/utils";
import { saveEventWebsiteAction } from "@/server/actions/event-website";
import type { DashboardEventWebsiteData } from "@/server/queries/dashboard-event";
import { ArrowUpRight, Eye, Layers3, LockKeyhole, X } from "lucide-react";

const DEFAULT_AUTOSAVE_DELAY_MS = 900;
const FAST_AUTOSAVE_DELAY_MS = 300;
const DESKTOP_LAYOUT_QUERY = "(min-width: 1200px)";
const TABLET_LAYOUT_QUERY = "(min-width: 768px)";

type DraftSaveState = "error" | "idle" | "saved" | "saving";
type ResponsiveWorkspaceMode = "flow" | "preview";

type EventWebsiteWorkspaceProps = {
  eventWebsiteData: DashboardEventWebsiteData;
  initialSelectedSection?: string | null;
};

function areContentsEqual(
  left: DashboardEventWebsiteData["eventWebsiteContent"],
  right: DashboardEventWebsiteData["eventWebsiteContent"],
) {
  return JSON.stringify(left) === JSON.stringify(right);
}

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
  const [draftRevision, setDraftRevision] = useState(0);
  const [draftSaveState, setDraftSaveState] = useState<DraftSaveState>("idle");
  const [draftSaveErrorMessage, setDraftSaveErrorMessage] = useState<string | null>(null);
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
    () => !areContentsEqual(currentContent, savedContent),
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
  const autosaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const queuedAutosaveRef = useRef(false);
  const saveInFlightRef = useRef(false);
  const activeSaveRevisionRef = useRef<number | null>(null);
  const lastSavedRevisionRef = useRef(0);
  const draftRevisionRef = useRef(0);
  const latestContentRef = useRef(currentContent);
  const nextAutosaveDelayRef = useRef(DEFAULT_AUTOSAVE_DELAY_MS);
  const savedContentRef = useRef(savedContent);

  useEffect(() => {
    latestContentRef.current = currentContent;
  }, [currentContent]);

  useEffect(() => {
    savedContentRef.current = savedContent;
  }, [savedContent]);

  const markDraftChanged = useCallback(() => {
    const nextRevision = draftRevisionRef.current + 1;
    draftRevisionRef.current = nextRevision;
    setDraftRevision(nextRevision);
    return nextRevision;
  }, []);

  function clearAutosaveTimer() {
    if (autosaveTimerRef.current) {
      clearTimeout(autosaveTimerRef.current);
      autosaveTimerRef.current = null;
    }
  }

  useEffect(() => clearAutosaveTimer, []);

  function resetWebsiteFlowOrder() {
    nextAutosaveDelayRef.current = FAST_AUTOSAVE_DELAY_MS;
    markDraftChanged();
    setWebsiteFlowSections(defaultWebsiteFlowSections);
  }

  function updateEnabledSection(key: EventWebsiteSectionKey, enabled: boolean) {
    const section = sectionsByKey.get(key);

    if (section?.required) {
      return;
    }

    nextAutosaveDelayRef.current = FAST_AUTOSAVE_DELAY_MS;
    markDraftChanged();
    setEnabledSections((current) => ({ ...current, [key]: enabled }));
  }

  function updatePreviewDraft(nextDraft: EventWebsitePreviewDraft) {
    nextAutosaveDelayRef.current = DEFAULT_AUTOSAVE_DELAY_MS;
    markDraftChanged();
    setPreviewDraft(nextDraft);
  }

  function updateWebsiteFlowSections(nextSections: typeof websiteFlowSections) {
    nextAutosaveDelayRef.current = FAST_AUTOSAVE_DELAY_MS;
    markDraftChanged();
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

  const persistDraft = useCallback(async (trigger: "auto" | "manual") => {
    clearAutosaveTimer();

    if (!eventWebsiteData.eventId) {
      const message = "The current event could not be resolved for saving.";
      setDraftSaveState("error");
      setDraftSaveErrorMessage(message);

      if (trigger === "manual") {
        toast.error(message);
      }
      return;
    }

    if (saveInFlightRef.current) {
      queuedAutosaveRef.current =
        draftRevisionRef.current > (activeSaveRevisionRef.current ?? draftRevisionRef.current);
      return;
    }

    saveInFlightRef.current = true;
    setDraftSaveState("saving");
    setDraftSaveErrorMessage(null);
    markEventWebsiteDraftSavePending(eventWebsiteData.eventId, true);

    let currentTrigger = trigger;

    try {
      while (true) {
        queuedAutosaveRef.current = false;
        const submittedRevision = draftRevisionRef.current;
        activeSaveRevisionRef.current = submittedRevision;

        const result = await saveEventWebsiteAction({
          content: latestContentRef.current,
          eventId: eventWebsiteData.eventId,
        });

        if (!result.ok) {
          const message =
            result.error === "The request could not be completed."
              ? "Event Website draft could not be saved."
              : result.error;
          setDraftSaveState("error");
          setDraftSaveErrorMessage(message);

          if (currentTrigger === "manual") {
            toast.error(message);
          }
          return;
        }

        if (submittedRevision > lastSavedRevisionRef.current) {
          lastSavedRevisionRef.current = submittedRevision;
          setSavedContent(result.data.content);
          emitDashboardSyncEvent({
            eventId: eventWebsiteData.eventId,
            name: "event-website:draft-updated",
          });
        }

        const hasNewerLocalEdits = draftRevisionRef.current > submittedRevision;
        if (hasNewerLocalEdits) {
          queuedAutosaveRef.current = true;
        }

        setDraftSaveState(hasNewerLocalEdits ? "saving" : "saved");
        setDraftSaveErrorMessage(null);

        if (currentTrigger === "manual") {
          toast.success("Event Website draft saved.");
        }

        if (!queuedAutosaveRef.current) {
          return;
        }

        currentTrigger = "auto";
        setDraftSaveState("saving");
      }
    } finally {
      saveInFlightRef.current = false;
      activeSaveRevisionRef.current = null;
      markEventWebsiteDraftSavePending(eventWebsiteData.eventId, false);
    }
  }, [eventWebsiteData.eventId]);

  function handleSaveChanges() {
    startTransition(async () => {
      await persistDraft("manual");
    });
  }

  useEffect(() => {
    if (!autoSaveEnabled || !eventWebsiteData.eventId) {
      clearAutosaveTimer();
      return;
    }

    if (areContentsEqual(latestContentRef.current, savedContentRef.current)) {
      clearAutosaveTimer();
      queuedAutosaveRef.current = false;

      if (!saveInFlightRef.current) {
        setDraftSaveState((current) => (current === "error" ? current : "saved"));
      }
      return;
    }

    if (saveInFlightRef.current) {
      queuedAutosaveRef.current =
        draftRevisionRef.current > (activeSaveRevisionRef.current ?? draftRevisionRef.current);
      return;
    }

    clearAutosaveTimer();
    const delay = nextAutosaveDelayRef.current;
    nextAutosaveDelayRef.current = DEFAULT_AUTOSAVE_DELAY_MS;
    autosaveTimerRef.current = setTimeout(() => {
      void persistDraft("auto");
    }, delay);

    return clearAutosaveTimer;
  }, [autoSaveEnabled, draftRevision, eventWebsiteData.eventId, persistDraft]);

  const statusPill = useMemo<EventWebsiteStatusPill>(() => {
    if (draftSaveState === "saving") {
      return {
        label: "Saving...",
        tone: "neutral",
      };
    }

    if (draftSaveState === "error") {
      return {
        label: draftSaveErrorMessage ? "Couldn't save. Retry" : "Couldn't save",
        tone: "warning",
      };
    }

    if (isDirty) {
      return {
        label: "Unsaved changes",
        tone: "warning",
      };
    }

    if (workflowStatus.state === "draft_newer_than_published") {
      return {
        href: "/dashboard/website-access",
        label: "Draft changes not published",
        tone: workflowStatus.tone,
      };
    }

    if (workflowStatus.state === "published_up_to_date") {
      return {
        label: workflowStatus.label,
        tone: workflowStatus.tone,
      };
    }

    return {
      label: "All changes saved",
      tone: "neutral",
    };
  }, [draftSaveErrorMessage, draftSaveState, isDirty, workflowStatus.label, workflowStatus.state, workflowStatus.tone]);

  const saveButtonLabel = isPending
    ? "Saving..."
    : !eventWebsiteData.eventId
      ? "Save unavailable"
      : isDirty
        ? "Save changes"
        : "All changes saved";

  const saveButtonProps = {
    disabled: isPending || !eventWebsiteData.eventId || !isDirty,
    hidden: autoSaveEnabled,
    label: saveButtonLabel,
    onClick: handleSaveChanges,
  };
  const responsiveEditorIsOpen = responsiveMode === "flow" && isResponsiveEditorOpen;

  if (isDesktopLayout) {
    return (
      <div className="event-website-workspace">
        <EventWebsiteLeftPane
          autoSaveEnabled={autoSaveEnabled}
          enabledSections={enabledSections}
          defaultWebsiteFlowSections={defaultWebsiteFlowSections}
          publicPageUrl={eventWebsiteData.publicPageUrl}
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
          enabledSections={enabledSections}
          guestbookMessages={eventWebsiteData.guestbookMessages}
          previewChromeUrl={eventWebsiteData.previewChromeUrl}
          previewScrollRequest={previewScrollRequest}
          previewDraft={previewDraft}
          selectedSection={selectedSectionDefinition}
          websiteFlowSections={websiteFlowSections}
        />
      </div>
    );
  }

  return (
    <div className="event-website-responsive-shell">
      <EventWebsiteStatusCard
        autoSaveEnabled={autoSaveEnabled}
        onToggleAutoSave={() => setAutoSaveEnabled((current) => !current)}
        publicPageUrl={eventWebsiteData.publicPageUrl}
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
            autoSaveEnabled={autoSaveEnabled}
            className="event-website-pane--responsive-flow"
            defaultWebsiteFlowSections={defaultWebsiteFlowSections}
            enabledSections={enabledSections}
            publicPageUrl={eventWebsiteData.publicPageUrl}
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
        resolvedSections={resolvedSections}
        saveButtonProps={saveButtonProps}
        selectedSection={selectedSectionDefinition}
        selectedSectionId={selectedSection}
      />
    </div>
  );
}

function ResponsiveSectionEditorSurface({
  eventData,
  isOpen,
  isTabletLayout,
  onOpenChange,
  onPreviewDraftChange,
  previewDraft,
  resolvedSections,
  saveButtonProps,
  selectedSection,
  selectedSectionId,
}: {
  eventData: DashboardEventWebsiteData;
  isOpen: boolean;
  isTabletLayout: boolean;
  onOpenChange: (open: boolean) => void;
  onPreviewDraftChange: (draft: EventWebsitePreviewDraft) => void;
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

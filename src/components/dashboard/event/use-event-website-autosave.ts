"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { EventWebsiteContent } from "@/lib/event-website/types";
import {
  markEventWebsiteDraftSavePending,
  registerEventWebsiteNavigationGuard,
} from "@/lib/event-website/draft-save-coordination";
import {
  DraftSaveController,
  type DraftSaveControllerState,
  type DraftSaveStatus,
} from "@/lib/event-website/draft-save-controller";
import {
  mergeEventWebsiteDraftThreeWay,
  type DraftPath,
} from "@/lib/event-website/draft-three-way-merge";
import {
  getLatestEventWebsiteDraftAction,
  saveEventWebsiteAction,
} from "@/server/actions/event-website";

const DEFAULT_AUTOSAVE_DELAY_MS = 900;

export type EventWebsitePersistenceState = DraftSaveStatus;

type SavedDraft = {
  content: EventWebsiteContent;
  savedAt: string;
  savedRevision: number;
};

type ConflictDetails = {
  localChanges: DraftPath[];
  overlappingPaths: DraftPath[];
  serverChanges: DraftPath[];
};

type UseEventWebsiteAutosaveInput = {
  autoSaveEnabled: boolean;
  content: EventWebsiteContent;
  eventId: string | null;
  initialSavedAt: string | null;
  initialSavedRevision: number;
  onDraftReplaced: (content: EventWebsiteContent) => void;
  onSaved: (result: SavedDraft) => void;
};

export function useEventWebsiteAutosave({
  autoSaveEnabled,
  content,
  eventId,
  initialSavedAt,
  initialSavedRevision,
  onDraftReplaced,
  onSaved,
}: UseEventWebsiteAutosaveInput) {
  const onSavedRef = useRef(onSaved);
  const onDraftReplacedRef = useRef(onDraftReplaced);
  const eventIdRef = useRef(eventId);
  const controllerRef = useRef<DraftSaveController<EventWebsiteContent> | null>(null);
  const [state, setState] = useState<DraftSaveControllerState<EventWebsiteContent> | null>(null);
  const [conflictDetails, setConflictDetails] = useState<ConflictDetails | null>(null);

  if (!controllerRef.current) {
    controllerRef.current = new DraftSaveController({
      autoSaveEnabled,
      debounceMs: DEFAULT_AUTOSAVE_DELAY_MS,
      initialContent: content,
      initialSavedAt,
      initialSavedRevision,
      onChange: () => {
        const controller = controllerRef.current;
        if (controller) setState(controller.getState());
      },
      onSaved: (savedContent, savedAt, savedRevision) => {
        onSavedRef.current({ content: savedContent, savedAt, savedRevision });
      },
      persist: async ({ content: snapshot, expectedRevision, saveAttemptId }) => {
        const currentEventId = eventIdRef.current;
        if (!currentEventId) {
          return {
            error: "The current event could not be resolved for saving.",
            retryable: false,
            status: "failed" as const,
          };
        }
        markEventWebsiteDraftSavePending(currentEventId, true);
        try {
          const response = await saveEventWebsiteAction({
            clientSequence: saveAttemptId,
            content: snapshot,
            eventId: currentEventId,
            expectedRevision,
          });
          if (!response.ok) {
            return {
              error: response.error,
              retryable: "retryable" in response && response.retryable,
              status: "failed" as const,
            };
          }
          return response.data.status === "conflict"
            ? { serverRevision: response.data.serverRevision, status: "conflict" as const }
            : {
                savedAt: response.data.savedAt,
                savedRevision: response.data.savedRevision,
                status: "saved" as const,
              };
        } finally {
          markEventWebsiteDraftSavePending(currentEventId, false);
        }
      },
    });
  }

  const controller = controllerRef.current;
  const snapshot = state ?? controller.getState();

  useEffect(() => {
    onSavedRef.current = onSaved;
    onDraftReplacedRef.current = onDraftReplaced;
    eventIdRef.current = eventId;
  }, [eventId, onDraftReplaced, onSaved]);

  useEffect(() => {
    controller.updateDraft(content);
  }, [content, controller]);

  useEffect(() => {
    controller.setAutoSaveEnabled(autoSaveEnabled);
  }, [autoSaveEnabled, controller]);

  useEffect(
    () => () => {
      controller.dispose();
    },
    [controller],
  );

  const fetchLatest = useCallback(async () => {
    const currentEventId = eventIdRef.current;
    if (!currentEventId) return null;
    const result = await getLatestEventWebsiteDraftAction({ eventId: currentEventId });
    return result.ok ? result.data : null;
  }, []);

  const reviewConflict = useCallback(async () => {
    const latest = await fetchLatest();
    if (!latest) return null;
    const current = controller.getState();
    const comparison = mergeEventWebsiteDraftThreeWay({
      base: current.baseline,
      local: current.current,
      server: latest.content,
    });
    setConflictDetails(comparison);
    return comparison;
  }, [controller, fetchLatest]);

  const adoptLatest = useCallback(async () => {
    const latest = await fetchLatest();
    if (!latest) return false;
    controller.adoptLatest(latest.content, latest.savedRevision, latest.savedAt);
    setConflictDetails(null);
    onDraftReplacedRef.current(latest.content);
    return true;
  }, [controller, fetchLatest]);

  const reconcile = useCallback(
    async (reason: "conflict-merge" | "explicit-keep-local", allowOverlap: boolean) => {
      const latest = await fetchLatest();
      if (!latest) return false;
      const current = controller.getState();
      const comparison = mergeEventWebsiteDraftThreeWay({
        base: current.baseline,
        local: current.current,
        server: latest.content,
      });
      setConflictDetails(comparison);
      if (!allowOverlap && comparison.overlappingPaths.length > 0) return false;

      controller.prepareReconciledDraft(
        latest.content,
        comparison.merged,
        latest.savedRevision,
        latest.savedAt,
      );
      onDraftReplacedRef.current(comparison.merged);
      return controller.saveReconciled(reason);
    },
    [controller, fetchLatest],
  );

  const mergeNonOverlappingConflict = useCallback(
    () => reconcile("conflict-merge", false),
    [reconcile],
  );
  const keepLocalChanges = useCallback(() => reconcile("explicit-keep-local", true), [reconcile]);
  const flush = useCallback(() => controller.flush(), [controller]);
  const retry = useCallback(() => controller.retry(), [controller]);
  const saveNow = useCallback(() => controller.saveNow(), [controller]);

  useEffect(
    () =>
      registerEventWebsiteNavigationGuard(async () => {
        let current = controller.getState();
        if (!current.isDirty && current.status !== "saving") return true;
        if (current.status === "saving") {
          await controller.waitForActive();
          current = controller.getState();
          if (!current.isDirty && current.status !== "saving") return true;
        }
        if (current.status === "conflict") return false;
        if (autoSaveEnabled && (await controller.flush())) return true;
        return window.confirm("Your Event Website draft is not saved. Leave without saving?");
      }),
    [autoSaveEnabled, controller],
  );

  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      const current = controller.getState();
      if (current.isDirty || current.status === "saving") {
        event.preventDefault();
        event.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [controller]);

  return {
    adoptLatest,
    conflictDetails,
    conflictRevision: snapshot.conflictRevision,
    errorMessage: snapshot.errorMessage,
    flush,
    isDirty: snapshot.isDirty,
    keepLocalChanges,
    mergeNonOverlappingConflict,
    persistenceState: snapshot.status,
    retry,
    reviewConflict,
    savedAt: snapshot.savedAt,
    savedRecently: false,
    savedRevision: snapshot.savedRevision,
    saveNow,
  };
}

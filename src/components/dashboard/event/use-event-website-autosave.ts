"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { EventWebsiteContent } from "@/lib/event-website/types";
import {
  markEventWebsiteDraftSavePending,
  registerEventWebsiteNavigationGuard,
} from "@/lib/event-website/draft-save-coordination";
import { saveEventWebsiteAction } from "@/server/actions/event-website";
import {
  getAutosaveRetryDelay,
  shouldAcknowledgeClientSequence,
} from "@/lib/event-website/autosave-policy";

const MAX_AUTOMATIC_RETRIES = 3;

export type EventWebsitePersistenceState =
  | "conflict"
  | "error"
  | "retrying"
  | "saved"
  | "saving"
  | "unsaved";

type SavedDraft = {
  clientSequence: number;
  content: EventWebsiteContent;
  savedAt: string;
  savedRevision: number;
};

type UseEventWebsiteAutosaveInput = {
  autoSaveEnabled: boolean;
  content: EventWebsiteContent;
  eventId: string | null;
  initialSavedAt: string | null;
  initialSavedRevision: number;
  isDirty: boolean;
  onSaved: (result: SavedDraft) => void;
};

export function useEventWebsiteAutosave({
  autoSaveEnabled,
  content,
  eventId,
  initialSavedAt,
  initialSavedRevision,
  isDirty,
  onSaved,
}: UseEventWebsiteAutosaveInput) {
  const [persistenceState, setPersistenceState] = useState<EventWebsitePersistenceState>(
    isDirty ? "unsaved" : "saved",
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<string | null>(initialSavedAt);
  const [savedRevision, setSavedRevision] = useState(initialSavedRevision);
  const [savedRecently, setSavedRecently] = useState(false);
  const [conflictRevision, setConflictRevision] = useState<number | null>(null);
  const contentRef = useRef(content);
  const dirtyRef = useRef(isDirty);
  const onSavedRef = useRef(onSaved);
  const autoSaveEnabledRef = useRef(autoSaveEnabled);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const savedRecentlyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const localSequenceRef = useRef(0);
  const acknowledgedSequenceRef = useRef(0);
  const serverRevisionRef = useRef(initialSavedRevision);
  const queuePromiseRef = useRef<Promise<boolean> | null>(null);

  useEffect(() => {
    contentRef.current = content;
    dirtyRef.current = isDirty;
    onSavedRef.current = onSaved;
    autoSaveEnabledRef.current = autoSaveEnabled;
  }, [autoSaveEnabled, content, isDirty, onSaved]);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const runQueue = useCallback(
    (allowAutomaticRetry: boolean) => {
      clearTimer();

      if (!eventId) {
        setErrorMessage("The current event could not be resolved for saving.");
        setPersistenceState("error");
        return Promise.resolve(false);
      }

      if (queuePromiseRef.current) {
        return queuePromiseRef.current;
      }

      const queuePromise = (async () => {
        markEventWebsiteDraftSavePending(eventId, true);

        try {
          while (dirtyRef.current || localSequenceRef.current > acknowledgedSequenceRef.current) {
            const submittedSequence = localSequenceRef.current;
            let retryAttempt = 0;

            while (true) {
              setPersistenceState(retryAttempt > 0 ? "retrying" : "saving");
              setErrorMessage(null);

              const result = await saveEventWebsiteAction({
                clientSequence: submittedSequence,
                content: contentRef.current,
                eventId,
                expectedRevision: serverRevisionRef.current,
              });

              if (!result.ok) {
                retryAttempt += 1;
                if (
                  allowAutomaticRetry &&
                  "retryable" in result &&
                  result.retryable &&
                  retryAttempt <= MAX_AUTOMATIC_RETRIES
                ) {
                  setPersistenceState("retrying");
                  await wait(getAutosaveRetryDelay(retryAttempt));
                  continue;
                }

                setErrorMessage(result.error);
                setPersistenceState("error");
                return false;
              }

              if (result.data.status === "conflict") {
                setConflictRevision(result.data.serverRevision);
                setErrorMessage(
                  "A newer server version exists. Reload it or keep these local changes.",
                );
                setPersistenceState("conflict");
                return false;
              }

              serverRevisionRef.current = result.data.savedRevision;
              setSavedRevision(result.data.savedRevision);
              setSavedAt(result.data.savedAt);
              setSavedRecently(true);
              if (savedRecentlyTimerRef.current) {
                clearTimeout(savedRecentlyTimerRef.current);
              }
              savedRecentlyTimerRef.current = setTimeout(() => {
                setSavedRecently(false);
              }, 10_000);

              if (
                shouldAcknowledgeClientSequence(
                  acknowledgedSequenceRef.current,
                  result.data.clientSequence,
                )
              ) {
                acknowledgedSequenceRef.current = result.data.clientSequence;
                onSavedRef.current(result.data);
              }

              break;
            }

            if (localSequenceRef.current <= submittedSequence) {
              dirtyRef.current = false;
              setPersistenceState("saved");
              setConflictRevision(null);
              setErrorMessage(null);
              return true;
            }
          }

          setPersistenceState("saved");
          return true;
        } finally {
          markEventWebsiteDraftSavePending(eventId, false);
          queuePromiseRef.current = null;
        }
      })();

      queuePromiseRef.current = queuePromise;
      return queuePromise;
    },
    [clearTimer, eventId],
  );

  const scheduleSave = useCallback(
    (delayMs: number) => {
      localSequenceRef.current += 1;
      dirtyRef.current = true;
      setPersistenceState("unsaved");
      setErrorMessage(null);
      setConflictRevision(null);
      clearTimer();

      if (!autoSaveEnabledRef.current) {
        return;
      }

      timerRef.current = setTimeout(() => {
        void runQueue(true);
      }, delayMs);
    },
    [clearTimer, runQueue],
  );

  const flush = useCallback(() => {
    if (!dirtyRef.current && !queuePromiseRef.current) {
      return Promise.resolve(true);
    }

    return runQueue(true);
  }, [runQueue]);

  const retry = useCallback(() => runQueue(true), [runQueue]);
  const saveNow = useCallback(() => runQueue(false), [runQueue]);

  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!dirtyRef.current && !queuePromiseRef.current) {
        return;
      }

      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, []);

  useEffect(
    () =>
      registerEventWebsiteNavigationGuard(async () => {
        if (!dirtyRef.current && !queuePromiseRef.current) {
          return true;
        }

        if (await flush()) {
          return true;
        }

        return window.confirm(
          "Your latest Event Website changes could not be saved. Leave and discard them?",
        );
      }),
    [flush],
  );

  useEffect(
    () => () => {
      clearTimer();
      if (savedRecentlyTimerRef.current) {
        clearTimeout(savedRecentlyTimerRef.current);
      }
    },
    [clearTimer],
  );

  return {
    conflictRevision,
    errorMessage,
    flush,
    persistenceState,
    retry,
    savedAt,
    savedRecently,
    savedRevision,
    saveNow,
    scheduleSave,
  };
}

function wait(delayMs: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, delayMs));
}

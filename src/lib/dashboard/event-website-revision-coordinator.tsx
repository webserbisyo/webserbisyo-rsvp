"use client";

import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { DashboardEventDto, DashboardWebsiteAccessDto } from "./dashboard-dtos";
import { dashboardKeys } from "./dashboard-query-keys";
import type { EventWebsiteContent } from "@/lib/event-website/types";

type ConfirmedDraft = {
  content: EventWebsiteContent;
  eventId: string;
  publishedRevision?: number;
  savedAt: string;
  savedRevision: number;
};

type RevisionCoordinator = {
  acknowledgeDraftSave: (draft: ConfirmedDraft) => Promise<void>;
  acknowledgePublish: (input: { eventId: string; publishedAt: string; publishedRevision: number; savedRevision: number }) => void;
  confirmedDraft: ConfirmedDraft | null;
  registerFlush: (eventId: string, flush: () => Promise<boolean>) => () => void;
  waitForSave: (eventId: string | null | undefined) => Promise<boolean>;
};

const Context = createContext<RevisionCoordinator | null>(null);

/**
 * Keeps the acknowledged draft revision alive while dashboard views change. Query
 * invalidation remains a verification mechanism; this direct handoff is the source
 * used by navigation and Website Access immediately after a successful save.
 */
export function EventWebsiteRevisionCoordinatorProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const flushes = useRef(new Map<string, () => Promise<boolean>>());
  const [confirmedDraft, setConfirmedDraft] = useState<ConfirmedDraft | null>(null);

  const acknowledgeDraftSave = useCallback(async (draft: ConfirmedDraft) => {
    setConfirmedDraft((current) =>
      !current || current.eventId !== draft.eventId || draft.savedRevision >= current.savedRevision
        ? draft
        : current,
    );

    queryClient.setQueryData<DashboardEventDto>(dashboardKeys.event(), (current) => {
      if (!current || current.eventId !== draft.eventId || current.savedRevision > draft.savedRevision) return current;
      return {
        ...current,
        eventWebsiteContent: draft.content,
        savedAt: draft.savedAt,
        savedRevision: draft.savedRevision,
      };
    });
    queryClient.setQueryData<DashboardWebsiteAccessDto>(dashboardKeys.websiteAccess(), (current) => {
      if (!current || current.eventId !== draft.eventId || current.savedRevision > draft.savedRevision) return current;
      return {
        ...current,
        contentDraftSavedAt: draft.savedAt,
        hasContentPendingChanges: (current.publishedRevision ?? 0) < draft.savedRevision,
        hasPendingChanges:
          current.hasAccessPendingChanges || current.hasSlugPendingChanges || current.hasSubdomainPendingChanges ||
          (current.publishedRevision ?? 0) < draft.savedRevision,
        savedRevision: draft.savedRevision,
      };
    });
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: dashboardKeys.event(), refetchType: "inactive" }),
      queryClient.invalidateQueries({ queryKey: dashboardKeys.websiteAccess(), refetchType: "inactive" }),
    ]);
  }, [queryClient]);
  const acknowledgePublish = useCallback((input: { eventId: string; publishedAt: string; publishedRevision: number; savedRevision: number }) => {
    queryClient.setQueryData<DashboardEventDto>(dashboardKeys.event(), (current) => {
      if (!current || current.eventId !== input.eventId) return current;
      return { ...current, publishedAt: input.publishedAt, publishedRevision: input.publishedRevision, publishState: "published", savedRevision: Math.max(current.savedRevision, input.savedRevision) };
    });
    queryClient.setQueryData<DashboardWebsiteAccessDto>(dashboardKeys.websiteAccess(), (current) => {
      if (!current || current.eventId !== input.eventId) return current;
      return { ...current, hasContentPendingChanges: input.savedRevision > input.publishedRevision, publishedAt: input.publishedAt, publishedRevision: input.publishedRevision, publishState: "published", savedRevision: Math.max(current.savedRevision, input.savedRevision) };
    });
  }, [queryClient]);

  const registerFlush = useCallback((eventId: string, flush: () => Promise<boolean>) => {
    flushes.current.set(eventId, flush);
    return () => {
      if (flushes.current.get(eventId) === flush) flushes.current.delete(eventId);
    };
  }, []);
  const waitForSave = useCallback(async (eventId: string | null | undefined) => {
    if (!eventId) return true;
    return (await flushes.current.get(eventId)?.()) ?? true;
  }, []);

  const value = useMemo(() => ({ acknowledgeDraftSave, acknowledgePublish, confirmedDraft, registerFlush, waitForSave }), [acknowledgeDraftSave, acknowledgePublish, confirmedDraft, registerFlush, waitForSave]);
  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function useEventWebsiteRevisionCoordinator() {
  const value = useContext(Context);
  if (!value) throw new Error("EventWebsiteRevisionCoordinatorProvider is required.");
  return value;
}

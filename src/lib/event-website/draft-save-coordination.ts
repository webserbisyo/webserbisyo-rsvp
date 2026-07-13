"use client";

import { useSyncExternalStore } from "react";

const EVENT_WEBSITE_DRAFT_SAVE_EVENT = "ws:event-website-draft-save-change";
const EVENT_WEBSITE_DRAFT_SAVE_KEY_PREFIX = "ws:event-website-draft-save:";
type DashboardNavigationGuard = (href: string) => boolean | Promise<boolean>;
let dashboardNavigationGuard: DashboardNavigationGuard | null = null;

function getDraftSaveKey(eventId: string) {
  return `${EVENT_WEBSITE_DRAFT_SAVE_KEY_PREFIX}${eventId}`;
}

export function markEventWebsiteDraftSavePending(eventId: string, pending: boolean) {
  if (typeof window === "undefined") {
    return;
  }

  const key = getDraftSaveKey(eventId);

  if (pending) {
    window.localStorage.setItem(
      key,
      JSON.stringify({
        pending: true,
        updatedAt: Date.now(),
      }),
    );
  } else {
    window.localStorage.removeItem(key);
  }

  window.dispatchEvent(
    new CustomEvent(EVENT_WEBSITE_DRAFT_SAVE_EVENT, {
      detail: { eventId },
    }),
  );
}

export function isEventWebsiteDraftSavePending(eventId: string | null | undefined) {
  if (typeof window === "undefined" || !eventId) {
    return false;
  }

  const value = window.localStorage.getItem(getDraftSaveKey(eventId));

  if (!value) {
    return false;
  }

  try {
    const parsed = JSON.parse(value) as { pending?: boolean } | null;
    return Boolean(parsed?.pending);
  } catch {
    return false;
  }
}

function subscribeToDraftSave(eventId: string | null | undefined, callback: () => void) {
  if (typeof window === "undefined" || !eventId) {
    return () => {};
  }

  const key = getDraftSaveKey(eventId);
  const handleStorage = (event: StorageEvent) => {
    if (event.key === key) {
      callback();
    }
  };
  const handleCustomEvent = (event: Event) => {
    const detail =
      event instanceof CustomEvent ? (event.detail as { eventId?: string } | undefined) : undefined;

    if (!detail?.eventId || detail.eventId === eventId) {
      callback();
    }
  };

  window.addEventListener("storage", handleStorage);
  window.addEventListener(EVENT_WEBSITE_DRAFT_SAVE_EVENT, handleCustomEvent);

  return () => {
    window.removeEventListener("storage", handleStorage);
    window.removeEventListener(EVENT_WEBSITE_DRAFT_SAVE_EVENT, handleCustomEvent);
  };
}

export function useEventWebsiteDraftSavePending(eventId: string | null | undefined) {
  return useSyncExternalStore(
    (callback) => subscribeToDraftSave(eventId, callback),
    () => isEventWebsiteDraftSavePending(eventId),
    () => false,
  );
}

export function registerEventWebsiteNavigationGuard(guard: DashboardNavigationGuard) {
  dashboardNavigationGuard = guard;

  return () => {
    if (dashboardNavigationGuard === guard) {
      dashboardNavigationGuard = null;
    }
  };
}

export async function canNavigateAwayFromEventWebsite(href: string) {
  return dashboardNavigationGuard ? dashboardNavigationGuard(href) : true;
}

"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

const DASHBOARD_SYNC_CHANNEL = "ws:dashboard-sync";
const DASHBOARD_SYNC_STORAGE_KEY = "ws:dashboard-sync:last-event";
const DASHBOARD_SYNC_LOCAL_EVENT = "ws:dashboard-sync:event";
const DEFAULT_REFRESH_DELAY_MS = 500;
const DEFAULT_MIN_REFRESH_INTERVAL_MS = 2000;

export type DashboardSyncEventName =
  | "dashboard:refresh"
  | "event-website:draft-updated"
  | "event-website:published"
  | "event-website:unpublished"
  | "website-access:private-link-regenerated"
  | "rsvp-responses:inserted"
  | "rsvp-responses:guestbook-updated";

export type DashboardSyncEvent = {
  eventId?: string | null;
  name: DashboardSyncEventName;
  originId?: string | null;
  timestamp: number;
};

type UseDashboardRefreshOptions = {
  events?: DashboardSyncEventName[];
  eventId?: string | null;
  ignoreSelfEvents?: boolean;
  refreshOnFocus?: boolean;
  refreshOnVisibility?: boolean;
  refreshDelayMs?: number;
  minRefreshIntervalMs?: number;
};

let dashboardSyncOriginId: string | null = null;

function getDashboardSyncOriginId() {
  if (typeof window === "undefined") {
    return null;
  }

  if (dashboardSyncOriginId) {
    return dashboardSyncOriginId;
  }

  dashboardSyncOriginId =
    typeof globalThis.crypto?.randomUUID === "function"
      ? globalThis.crypto.randomUUID()
      : `ws-dashboard-sync-${Date.now()}-${Math.random().toString(36).slice(2)}`;

  return dashboardSyncOriginId;
}

export function emitDashboardSyncEvent(input: {
  eventId?: string | null;
  name: DashboardSyncEventName;
}) {
  if (typeof window === "undefined") {
    return;
  }

  const event: DashboardSyncEvent = {
    eventId: input.eventId ?? null,
    name: input.name,
    originId: getDashboardSyncOriginId(),
    timestamp: Date.now(),
  };

  window.dispatchEvent(
    new CustomEvent(DASHBOARD_SYNC_LOCAL_EVENT, {
      detail: event,
    }),
  );

  if ("BroadcastChannel" in window) {
    const channel = new BroadcastChannel(DASHBOARD_SYNC_CHANNEL);
    channel.postMessage(event);
    channel.close();
    return;
  }

  try {
    globalThis.localStorage.setItem(DASHBOARD_SYNC_STORAGE_KEY, JSON.stringify(event));
  } catch {
    // Storage can be unavailable in private or restricted browser contexts.
  }
}

export function useDashboardRefresh(options: UseDashboardRefreshOptions = {}) {
  const router = useRouter();
  const routerRef = useRef(router);
  const timerRef = useRef<number | null>(null);
  const lastRefreshAtRef = useRef(0);
  const eventsRef = useRef(options.events);
  const eventIdRef = useRef(options.eventId);
  const refreshDelayMs = options.refreshDelayMs ?? DEFAULT_REFRESH_DELAY_MS;
  const minRefreshIntervalMs =
    options.minRefreshIntervalMs ?? DEFAULT_MIN_REFRESH_INTERVAL_MS;
  const ignoreSelfEvents = options.ignoreSelfEvents ?? false;
  const refreshOnFocus = options.refreshOnFocus ?? false;
  const refreshOnVisibility = options.refreshOnVisibility ?? false;

  useEffect(() => {
    routerRef.current = router;
  }, [router]);

  useEffect(() => {
    eventsRef.current = options.events;
    eventIdRef.current = options.eventId;
  }, [options.eventId, options.events]);

  useEffect(() => {
    function scheduleRefresh() {
      const now = Date.now();
      const elapsed = now - lastRefreshAtRef.current;

      if (elapsed < minRefreshIntervalMs) {
        return;
      }

      if (timerRef.current) {
        return;
      }

      timerRef.current = window.setTimeout(() => {
        timerRef.current = null;
        lastRefreshAtRef.current = Date.now();
        routerRef.current.refresh();
      }, refreshDelayMs);
    }

    function acceptsEvent(event: DashboardSyncEvent) {
      const eventNames = eventsRef.current;
      const scopedEventId = eventIdRef.current;

      if (eventNames && !eventNames.includes(event.name)) {
        return false;
      }

      if (scopedEventId && event.eventId && scopedEventId !== event.eventId) {
        return false;
      }

      if (ignoreSelfEvents && event.originId && event.originId === getDashboardSyncOriginId()) {
        return false;
      }

      return true;
    }

    function handleSyncEvent(event: DashboardSyncEvent) {
      if (acceptsEvent(event)) {
        scheduleRefresh();
      }
    }

    const handleLocalEvent = (event: Event) => {
      const detail =
        event instanceof CustomEvent
          ? (event.detail as DashboardSyncEvent | undefined)
          : undefined;

      if (detail) {
        handleSyncEvent(detail);
      }
    };

    const handleStorage = (event: StorageEvent) => {
      if (event.key !== DASHBOARD_SYNC_STORAGE_KEY || !event.newValue) {
        return;
      }

      try {
        handleSyncEvent(JSON.parse(event.newValue) as DashboardSyncEvent);
      } catch {
        // Ignore malformed sync payloads from storage.
      }
    };

    const handleFocus = () => {
      if (refreshOnFocus) {
        scheduleRefresh();
      }
    };

    const handleVisibilityChange = () => {
      if (refreshOnVisibility && document.visibilityState === "visible") {
        scheduleRefresh();
      }
    };

    let channel: BroadcastChannel | null = null;

    if ("BroadcastChannel" in window) {
      channel = new BroadcastChannel(DASHBOARD_SYNC_CHANNEL);
      channel.addEventListener("message", (event) => {
        handleSyncEvent(event.data as DashboardSyncEvent);
      });
    }

    window.addEventListener(DASHBOARD_SYNC_LOCAL_EVENT, handleLocalEvent);
    window.addEventListener("storage", handleStorage);
    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      if (timerRef.current) {
        window.clearTimeout(timerRef.current);
        timerRef.current = null;
      }

      channel?.close();
      window.removeEventListener(DASHBOARD_SYNC_LOCAL_EVENT, handleLocalEvent);
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [ignoreSelfEvents, minRefreshIntervalMs, refreshDelayMs, refreshOnFocus, refreshOnVisibility]);
}

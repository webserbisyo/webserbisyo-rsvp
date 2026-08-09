"use client";

export type MetaPixelEventParams = Record<string, string | number | boolean | null | undefined>;
export type MetaPixelEventOptions = Record<string, string | number | boolean | null | undefined>;

export type MetaPixelBrowserEventName =
  | "CompleteRegistration"
  | "Contact"
  | "InitiateCheckout"
  | "Lead"
  | "MessengerClick"
  | "PageView"
  | "RSVPSubmitted"
  | "SelectPlan"
  | "StartApplicationClick"
  | "ViewContent";

type MetaPixelFbq = (
  method: "track" | "trackCustom",
  eventName: string,
  params?: Record<string, string | number | boolean | null>,
  options?: Record<string, string | number | boolean | null>,
) => void;

declare global {
  interface Window {
    fbq?: MetaPixelFbq;
  }
}

const META_STANDARD_EVENTS = new Set<MetaPixelBrowserEventName>([
  "CompleteRegistration",
  "Contact",
  "InitiateCheckout",
  "Lead",
  "PageView",
  "ViewContent",
]);

export function trackMetaPixelEvent(
  eventName: MetaPixelBrowserEventName,
  params?: MetaPixelEventParams,
  options?: MetaPixelEventOptions,
) {
  if (typeof window === "undefined" || typeof window.fbq !== "function") {
    return;
  }

  try {
    const method = META_STANDARD_EVENTS.has(eventName) ? "track" : "trackCustom";
    const sanitizedParams = sanitizeMetaPixelParams(params);
    const sanitizedOptions = sanitizeMetaPixelParams(options);

    if (sanitizedOptions) {
      window.fbq(method, eventName, sanitizedParams ?? {}, sanitizedOptions);
      return;
    }

    if (sanitizedParams) {
      window.fbq(method, eventName, sanitizedParams);
      return;
    }

    window.fbq(method, eventName);
  } catch {
    // Client-side analytics must never interrupt navigation or form flows.
  }
}

function sanitizeMetaPixelParams(params?: MetaPixelEventParams) {
  if (!params) {
    return null;
  }

  const entries = Object.entries(params).filter((entry): entry is [
    string,
    string | number | boolean | null,
  ] => {
    const value = entry[1];

    return (
      value === null ||
      typeof value === "string" ||
      typeof value === "boolean" ||
      (typeof value === "number" && Number.isFinite(value))
    );
  });

  return entries.length > 0 ? Object.fromEntries(entries) : null;
}

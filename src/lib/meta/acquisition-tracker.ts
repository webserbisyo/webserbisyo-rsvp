"use client";

import { trackMetaPixelEvent } from "./browser-events";

export type InitiateCheckoutOccurrence = {
  plan: "pro" | "max";
  sourcePath: "/apply/start";
};

export function trackInitiateCheckoutOccurrence(input: InitiateCheckoutOccurrence) {
  const eventId = crypto.randomUUID();
  const value = input.plan === "max" ? 3599 : 1599;

  trackMetaPixelEvent(
    "InitiateCheckout",
    {
      content_category: "RSVP Website Setup",
      content_name: input.plan === "max" ? "MAX Plan" : "PRO Plan",
      currency: "PHP",
      plan: input.plan,
      source_route: input.sourcePath,
      value,
    },
    { eventID: eventId },
  );

  sendMetaAcquisitionOccurrence({
    eventId,
    eventName: "InitiateCheckout",
    fbc: getFbc(),
    fbp: getCookie("_fbp"),
    plan: input.plan,
    sourcePath: input.sourcePath,
  });

  return eventId;
}

export function trackMetaAcquisitionClick(
  eventName: "Contact" | "SelectPlan" | "StartApplicationClick",
  params: Record<string, string | number | boolean | null | undefined>,
) {
  const eventId = crypto.randomUUID();
  const sourcePath = window.location.pathname === "/apply" ? "/apply" : "/";
  const source = typeof params.source === "string" ? params.source : "unknown";
  const referenceCode =
    typeof params.reference_code === "string" ? params.reference_code : undefined;
  const shared = { eventId, fbc: getFbc(), fbp: getCookie("_fbp") };

  const browserParams = Object.fromEntries(
    Object.entries(params).filter(([key]) => key !== "reference_code"),
  );
  trackMetaPixelEvent(eventName, browserParams, { eventID: eventId });

  if (eventName === "SelectPlan" && (params.plan === "pro" || params.plan === "max")) {
    sendMetaAcquisitionOccurrence({
      ...shared,
      eventName,
      plan: params.plan,
      source,
      sourcePath,
    });
  } else if (eventName === "StartApplicationClick") {
    sendMetaAcquisitionOccurrence({
      ...shared,
      destination: "/apply",
      eventName,
      source,
      sourcePath: "/",
    });
  } else if (eventName === "Contact") {
    const contactPath = window.location.pathname === "/apply/success" ? "/apply/success" : "/";
    sendMetaAcquisitionOccurrence({
      ...shared,
      eventName,
      referenceCode,
      source,
      sourcePath: contactPath,
    });
  }

  return eventId;
}

export function trackCompleteRegistrationOccurrence(referenceCode: string) {
  const eventId = `CompleteRegistration:${referenceCode}`;
  const storageKey = `webserbisyo:meta:complete-registration:${referenceCode}`;
  if (window.sessionStorage.getItem(storageKey)) return null;
  window.sessionStorage.setItem(storageKey, "1");
  trackMetaPixelEvent(
    "CompleteRegistration",
    { source_route: "/apply/success" },
    { eventID: eventId },
  );
  sendMetaAcquisitionOccurrence({
    eventId,
    eventName: "CompleteRegistration",
    fbc: getFbc(),
    fbp: getCookie("_fbp"),
    referenceCode,
    sourcePath: "/apply/success",
  });
  return eventId;
}

export function trackAcquisitionPageOccurrence(
  sourcePath: "/" | "/apply" | "/apply/start" | "/apply/success",
  viewContent: boolean,
) {
  const pageViewId = crypto.randomUUID();
  trackMetaPixelEvent("PageView", {}, { eventID: pageViewId });
  sendMetaAcquisitionOccurrence({
    eventId: pageViewId,
    eventName: "PageView",
    fbc: getFbc(),
    fbp: getCookie("_fbp"),
    sourcePath,
  });
  if (viewContent) {
    const viewId = crypto.randomUUID();
    trackMetaPixelEvent(
      "ViewContent",
      {
        content_category: "webserbisyo_marketing",
        content_name: sourcePath === "/" ? "landing" : "pricing",
        source_route: sourcePath,
      },
      { eventID: viewId },
    );
    sendMetaAcquisitionOccurrence({
      eventId: viewId,
      eventName: "ViewContent",
      fbc: getFbc(),
      fbp: getCookie("_fbp"),
      sourcePath,
    });
  }
}

function sendMetaAcquisitionOccurrence(payload: Record<string, string | undefined>) {
  try {
    void fetch("/api/meta/events", {
      body: JSON.stringify(payload),
      credentials: "same-origin",
      headers: { "content-type": "application/json" },
      keepalive: true,
      method: "POST",
    });
  } catch {
    // Browser analytics must never interrupt a visitor action.
  }
}

function getCookie(name: string) {
  const prefix = `${name}=`;
  const value = document.cookie
    .split(";")
    .map((item) => item.trim())
    .find((item) => item.startsWith(prefix));

  return value ? decodeURIComponent(value.slice(prefix.length)) : undefined;
}

function getFbc() {
  const stored = getCookie("_fbc");
  if (stored) {
    return stored;
  }

  const fbclid = new URLSearchParams(window.location.search).get("fbclid");
  return fbclid ? `fb.1.${Date.now()}.${fbclid}` : undefined;
}

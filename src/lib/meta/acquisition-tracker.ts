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

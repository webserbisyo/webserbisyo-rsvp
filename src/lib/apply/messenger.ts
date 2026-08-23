import { format } from "date-fns";
import type { ManualPaymentOption } from "./public-payment-option-dto";
import { getPaymentOptionLabel } from "./public-payment-option-dto";

type MessengerFollowupInput = {
  email?: string | null;
  estimatedGuestCount?: number | null;
  eventDate?: string | null;
  eventLocation?: string | null;
  eventType?: string | null;
  fullName?: string | null;
  message?: string | null;
  phone?: string | null;
  preferredManualPaymentOption?: string | null;
  preferredPlan?: string | null;
  referenceCode: string;
};

export function formatPlanLabel(plan: string | null | undefined) {
  if (!plan) {
    return null;
  }

  return plan === "max" ? "Max" : "Pro";
}

function formatEventDate(eventDate: string | null | undefined) {
  if (!eventDate) {
    return null;
  }

  const parsedDate = new Date(`${eventDate}T00:00:00`);

  if (Number.isNaN(parsedDate.getTime())) {
    return eventDate;
  }

  return format(parsedDate, "MMMM d, yyyy");
}

function formatEventTypeLabel(eventType: string | null | undefined) {
  if (!eventType) {
    return null;
  }

  return eventType
    .split("-")
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
}

export function buildMessengerFollowupMessage(input: MessengerFollowupInput) {
  const paymentLabel = getPaymentOptionLabel(
    (input.preferredManualPaymentOption as ManualPaymentOption | null | undefined) ?? null,
  );
  const planLabel = formatPlanLabel(input.preferredPlan);
  const eventDate = formatEventDate(input.eventDate);
  const eventType = formatEventTypeLabel(input.eventType);
  const lines = [
    "Hi WebSerbisyo, I just submitted an RSVP application.",
    "",
    `Reference: ${input.referenceCode}`,
  ];

  if (input.fullName) {
    lines.push(`Name: ${input.fullName}`);
  }

  if (input.email) {
    lines.push(`Email: ${input.email}`);
  }

  if (input.phone) {
    lines.push(`Phone Number: ${input.phone}`);
  }

  if (planLabel) {
    lines.push(`Plan: ${planLabel}`);
  }

  if (eventType) {
    lines.push(`Event Type: ${eventType}`);
  }

  if (eventDate) {
    lines.push(`Event Date: ${eventDate}`);
  }

  if (input.eventLocation) {
    lines.push(`Event Location: ${input.eventLocation}`);
  }

  if (input.estimatedGuestCount) {
    lines.push(`Estimated Guest Count: ${input.estimatedGuestCount}`);
  }

  if (paymentLabel) {
    lines.push(`Selected Payment Option: ${paymentLabel}`);
  }

  if (input.message) {
    lines.push(`Message: ${input.message}`);
  }

  lines.push("");
  lines.push("I would like to continue the manual payment discussion and next steps.");

  return lines.join("\n");
}

export function buildReferenceOnlyFollowupMessage(referenceCode: string) {
  return [
    "Hi WebSerbisyo, I just submitted an RSVP application.",
    "",
    `Reference: ${referenceCode}`,
    "",
    "I would like to follow up.",
  ].join("\n");
}

export function buildMessengerContinueUrl(baseUrl: string | null | undefined) {
  return baseUrl?.trim() || null;
}

export const DEFAULT_WEBSERBISYO_MESSENGER_URL = "https://m.me/webserbisyo";

export function resolveMessengerUrl(url?: string | null): string {
  const trimmed = url?.trim();
  if (!trimmed) {
    return DEFAULT_WEBSERBISYO_MESSENGER_URL;
  }
  return trimmed;
}


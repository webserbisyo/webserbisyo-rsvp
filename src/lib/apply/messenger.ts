import { format } from "date-fns";
import type { ManualPaymentOption } from "./public-payment-option-dto";
import { getPaymentOptionLabel } from "./public-payment-option-dto";

type MessengerFollowupInput = {
  eventDate?: string | null;
  eventType?: string | null;
  fullName?: string | null;
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

export function buildMessengerFollowupMessage(input: MessengerFollowupInput) {
  const paymentLabel = getPaymentOptionLabel(
    (input.preferredManualPaymentOption as ManualPaymentOption | null | undefined) ?? null,
  );
  const planLabel = formatPlanLabel(input.preferredPlan);
  const eventDate = formatEventDate(input.eventDate);
  const lines = [
    "Hi WebSerbisyo, I just submitted an RSVP application.",
    "",
    `Reference: ${input.referenceCode}`,
  ];

  if (input.fullName) {
    lines.push(`Name: ${input.fullName}`);
  }

  if (planLabel) {
    lines.push(`Plan: ${planLabel}`);
  }

  if (input.eventType) {
    lines.push(`Event Type: ${input.eventType}`);
  }

  if (eventDate) {
    lines.push(`Event Date: ${eventDate}`);
  }

  if (paymentLabel) {
    lines.push(`Selected Payment Option: ${paymentLabel}`);
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

import "server-only";

export const CLIENT_PAYMENT_STATUS_VALUES = ["pending", "paid", "cancelled", "refunded"] as const;

export type ClientPaymentDisplayStatus = (typeof CLIENT_PAYMENT_STATUS_VALUES)[number];

export type DeleteEligibilityInput = {
  clientStatus: string | null;
  cancelledAt: string | null;
  archivedAt: string | null;
  eventDate: string | null;
  eventPublishedAt: string | null;
  eventStatus: string | null;
  eventVisibility: string | null;
  hasPaidPayment: boolean;
  hasRefundedPayment: boolean;
  hasUnpublishedSetupWork: boolean;
  hostingEndsAt: string | null;
  lastActivityAt: string | null;
  now: Date;
};

export type DeleteEligibilityResult = {
  deleteEligible: boolean;
  deleteEligibleAt: string | null;
  reason: string;
};

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

export function deriveClientPaymentStatus(input: {
  clientCancelledAt: string | null;
  clientStatus: string | null;
  paymentStatus: string | null;
}): ClientPaymentDisplayStatus {
  if (
    input.clientStatus === "cancelled" ||
    input.clientCancelledAt ||
    input.paymentStatus === "cancelled"
  ) {
    return "cancelled";
  }

  if (input.paymentStatus === "refunded") {
    return "refunded";
  }

  if (input.paymentStatus === "paid" || input.paymentStatus === "confirmed") {
    return "paid";
  }

  return "pending";
}

export function deriveDeleteEligibility(input: DeleteEligibilityInput): DeleteEligibilityResult {
  const reasons: string[] = [];
  const eventPassed = Boolean(input.eventDate && input.eventDate < getTodayDateInManila(input.now));
  const hostingActive = Boolean(
    input.hostingEndsAt && new Date(input.hostingEndsAt).getTime() >= input.now.getTime(),
  );
  const lastActivityTime = input.lastActivityAt ? new Date(input.lastActivityAt).getTime() : null;
  const inactiveForThirtyDays = Boolean(
    lastActivityTime !== null && input.now.getTime() - lastActivityTime >= THIRTY_DAYS_MS,
  );
  const isClosed = input.clientStatus === "archived" || input.clientStatus === "cancelled";
  const isPublished = Boolean(
    input.eventStatus === "published" ||
    (input.eventPublishedAt &&
      input.eventVisibility &&
      ["public", "unlisted"].includes(input.eventVisibility)),
  );

  if (!isClosed) {
    reasons.push("Client must be archived or cancelled first.");
  }

  if (!eventPassed) {
    reasons.push("Event must be passed.");
  }

  if (!inactiveForThirtyDays) {
    reasons.push("Client must be inactive for at least 30 days.");
  }

  if (hostingActive) {
    reasons.push("Hosting/access period is still active.");
  }

  if (isPublished) {
    reasons.push("Published or public RSVP websites cannot be deleted.");
  }

  if (input.hasPaidPayment) {
    reasons.push("Paid clients must be retained or refunded before deletion.");
  }

  if (input.hasRefundedPayment) {
    reasons.push("Refunded clients must be retained for payment history.");
  }

  if (input.hasUnpublishedSetupWork) {
    reasons.push("Client still has active onboarding or setup work.");
  }

  return {
    deleteEligible: reasons.length === 0,
    deleteEligibleAt:
      lastActivityTime !== null ? new Date(lastActivityTime + THIRTY_DAYS_MS).toISOString() : null,
    reason: reasons[0] ?? "Eligible for deletion.",
  };
}

function getTodayDateInManila(now: Date) {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    day: "2-digit",
    month: "2-digit",
    timeZone: "Asia/Manila",
    year: "numeric",
  });

  return formatter.format(now);
}

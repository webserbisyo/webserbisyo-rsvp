import "server-only";

export const CLIENT_PAYMENT_STATUS_VALUES = ["pending", "paid", "cancelled", "refunded"] as const;

export type ClientPaymentDisplayStatus = (typeof CLIENT_PAYMENT_STATUS_VALUES)[number];
export const DELETE_ELIGIBILITY_REASON_CODES = [
  "eligible",
  "status_inconsistent",
  "status_not_closed",
  "live_rsvp",
  "active_hosting",
  "active_setup",
  "paid_non_refunded",
] as const;

export type DeleteEligibilityReasonCode = (typeof DELETE_ELIGIBILITY_REASON_CODES)[number];

export type DeleteEligibilityInput = {
  cancelledAt: string | null;
  clientCustomFrontendStatus: string | null;
  clientCustomFrontendUrl: string | null;
  clientStatus: string | null;
  archivedAt: string | null;
  eventDate: string | null;
  eventCustomFrontendEnabled: boolean;
  eventCustomFrontendUrl: string | null;
  eventPublishedAt: string | null;
  eventStatus: string | null;
  eventVisibility: string | null;
  hasPaidNonRefundedPayment: boolean;
  hasRefundedPaymentHistory: boolean;
  hasUnpublishedSetupWork: boolean;
  hostingEndsAt: string | null;
  lastActivityAt: string | null;
  latestPaymentStatus: string | null;
  now: Date;
};

export type DeleteEligibilityResult = {
  deleteEligible: boolean;
  deleteEligibleAt: string | null;
  reasonCode: DeleteEligibilityReasonCode;
  reason: string;
};

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
  const eventPassed = Boolean(input.eventDate && input.eventDate < getTodayDateInManila(input.now));
  const hostingActive = Boolean(
    input.hostingEndsAt && new Date(input.hostingEndsAt).getTime() >= input.now.getTime(),
  );
  const isClosed = input.clientStatus === "archived" || input.clientStatus === "cancelled";
  const hasStatusInconsistency = Boolean(
    !isClosed &&
    input.archivedAt &&
    ["active", "paused", "expired"].includes(input.clientStatus ?? ""),
  );
  const hasPublishedOrLiveRsvp = Boolean(
    input.eventStatus === "published" ||
    (input.eventPublishedAt &&
      input.eventVisibility &&
      ["public", "unlisted"].includes(input.eventVisibility)) ||
    input.eventCustomFrontendEnabled ||
    Boolean(input.eventCustomFrontendUrl),
  );
  const hasActiveHostingOrAccess = Boolean(
    hostingActive ||
    input.clientCustomFrontendStatus === "connected" ||
    input.clientCustomFrontendStatus === "maintenance" ||
    (input.clientCustomFrontendUrl && input.clientCustomFrontendStatus !== "disabled"),
  );
  const hasActiveSetupWork = Boolean(
    input.hasUnpublishedSetupWork || input.clientCustomFrontendStatus === "in_progress",
  );

  if (hasStatusInconsistency) {
    return {
      deleteEligible: false,
      deleteEligibleAt: null,
      reasonCode: "status_inconsistent",
      reason:
        "Client has archive metadata but status is still Active. Re-archive or cancel the client before deleting.",
    };
  }

  if (!isClosed) {
    return {
      deleteEligible: false,
      deleteEligibleAt: null,
      reasonCode: "status_not_closed",
      reason: "Archive or cancel the client before deletion.",
    };
  }

  if (hasPublishedOrLiveRsvp) {
    return {
      deleteEligible: false,
      deleteEligibleAt: null,
      reasonCode: "live_rsvp",
      reason: "Unpublish or disable the live RSVP website before deletion.",
    };
  }

  if (input.hasPaidNonRefundedPayment) {
    return {
      deleteEligible: false,
      deleteEligibleAt: null,
      reasonCode: "paid_non_refunded",
      reason: "Paid clients must be refunded or retained before deletion.",
    };
  }

  if (hasActiveHostingOrAccess) {
    return {
      deleteEligible: false,
      deleteEligibleAt: null,
      reasonCode: "active_hosting",
      reason: "Active hosting/access must end before deletion.",
    };
  }

  if (hasActiveSetupWork) {
    return {
      deleteEligible: false,
      deleteEligibleAt: null,
      reasonCode: "active_setup",
      reason: "Client still has active onboarding or setup work to retain.",
    };
  }

  return {
    deleteEligible: true,
    deleteEligibleAt: eventPassed || input.hasRefundedPaymentHistory ? input.lastActivityAt : null,
    reasonCode: "eligible",
    reason:
      input.hasRefundedPaymentHistory || input.latestPaymentStatus === "refunded"
        ? "Eligible for deletion after refund proof is preserved in tombstone records."
        : "Eligible for deletion.",
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

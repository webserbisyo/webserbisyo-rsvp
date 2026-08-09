export type RsvpResponseStatus = "attending" | "not_attending";
export type RsvpResponseReviewStatus = "approved" | "rejected";
export type RsvpResponseHostConfirmationStatus = "pending" | "confirmed";
export type RsvpResponseGuestbookStatus = "approved" | "hidden" | "pending_review" | "private";

export type RsvpResponseSource = string | null;

export type RsvpResponseRecord = {
  archivedAt: string | null;
  id: string;
  clientId: string;
  eventId: string;
  guestName: string;
  email: string | null;
  phone: string | null;
  status: RsvpResponseStatus;
  partySize: number;
  companions: string[];
  dietaryNotes: string | null;
  message: string | null;
  messageApprovedAt: string | null;
  messageApprovedBy: string | null;
  messagePublicConsent: boolean;
  messagePublicStatus: RsvpResponseGuestbookStatus;
  hostConfirmationStatus: RsvpResponseHostConfirmationStatus;
  hostConfirmedAt: string | null;
  hostConfirmedBy: string | null;
  reviewStatus: RsvpResponseReviewStatus;
  submittedAt: string;
  updatedAt: string;
  // Internal-only source label for detail views and future auditing.
  // It is intentionally excluded from the main table and export defaults.
  source: RsvpResponseSource;
};

export type RsvpResponsesTab =
  | "all"
  | "attending"
  | "not_attending"
  | "confirmed"
  | "messages"
  | "guestbook"
  | "needs_review"
  | "rejected";

export type RsvpResponsesExportFormat = "csv" | "pdf_summary";
export type RsvpResponsesExportRows = "current_view" | "all_responses" | "confirmed_guest_list";
export type RsvpResponsesExportInclude =
  | "contact_details"
  | "companions"
  | "dietary_notes"
  | "messages";

export const RSVP_RESPONSE_SOURCE_LABELS = {
  public_rsvp_page: "Public RSVP page",
  qr_code: "QR code",
  shared_link: "Shared link",
  internal: "Internal",
};

export function getResponseStatusLabel(
  status: RsvpResponseStatus,
  reviewStatus?: RsvpResponseReviewStatus,
) {
  if (reviewStatus === "rejected") {
    return "Rejected";
  }
  return status === "attending" ? "Attending" : "Not attending";
}

export function getResponseSourceLabel(source: RsvpResponseSource) {
  if (!source) {
    return "Not specified";
  }

  const knownLabel =
    RSVP_RESPONSE_SOURCE_LABELS[source as keyof typeof RSVP_RESPONSE_SOURCE_LABELS];

  if (knownLabel) {
    return knownLabel;
  }

  return source
    .split(/[_-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function matchesResponseTab(record: RsvpResponseRecord, tab: RsvpResponsesTab) {
  switch (tab) {
    case "attending":
      return isActiveResponse(record) && record.status === "attending";
    case "not_attending":
      return isActiveResponse(record) && record.status === "not_attending";
    case "confirmed":
      return isConfirmedGuest(record);
    case "messages":
      return hasResponseMessage(record) && isActiveResponse(record);
    case "guestbook":
      return isGuestbookPublished(record);
    case "needs_review":
      return needsGuestbookReview(record);
    case "rejected":
      return record.reviewStatus === "rejected";
    default:
      return true;
  }
}

export function hasResponseMessage(record: RsvpResponseRecord) {
  return Boolean(record.message?.trim());
}

export function isActiveResponse(record: RsvpResponseRecord) {
  return record.archivedAt === null && record.reviewStatus === "approved";
}

export function isRejectedResponse(record: RsvpResponseRecord) {
  return record.reviewStatus === "rejected";
}

export function isAttendingResponse(record: RsvpResponseRecord) {
  return record.status === "attending";
}

export function isConfirmedGuest(record: RsvpResponseRecord) {
  return (
    isActiveResponse(record) &&
    isAttendingResponse(record) &&
    record.hostConfirmationStatus === "confirmed"
  );
}

export function isGuestbookPublished(record: RsvpResponseRecord) {
  return (
    hasResponseMessage(record) &&
    isActiveResponse(record) &&
    record.messagePublicStatus === "approved"
  );
}

export function needsGuestbookReview(record: RsvpResponseRecord) {
  return (
    hasResponseMessage(record) &&
    isActiveResponse(record) &&
    record.messagePublicStatus !== "approved"
  );
}

export function matchesResponseSearch(record: RsvpResponseRecord, query: string) {
  const normalizedQuery = query.trim().toLowerCase();

  if (!normalizedQuery) {
    return true;
  }

  const searchableValues = [record.guestName, record.email ?? "", record.phone ?? ""];

  return searchableValues.some((value) => value.toLowerCase().includes(normalizedQuery));
}

export function getResponseInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean).slice(0, 2);

  return parts.map((part) => part[0]?.toUpperCase() ?? "").join("") || "RS";
}

export function formatResponseSubmittedAt(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-PH", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Manila",
  }).format(date);
}

export function formatResponseSubmittedTable(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "Asia/Manila",
  }).format(date);
}

export function getResponseSubmittedDisplay(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return {
      compactLabel: value,
      fullLabel: value,
      mobileDateLabel: value,
      mobileTimeLabel: "",
      wideLabel: value,
    };
  }

  const currentYear = new Date().getFullYear();
  const includeYear = date.getFullYear() !== currentYear;

  return {
    compactLabel: new Intl.DateTimeFormat("en-PH", {
      month: "short",
      day: "numeric",
      ...(includeYear ? { year: "numeric" as const } : {}),
      hour: "numeric",
      minute: "2-digit",
      timeZone: "Asia/Manila",
    }).format(date),
    fullLabel: formatResponseSubmittedTable(value),
    mobileDateLabel: new Intl.DateTimeFormat("en-PH", {
      month: "short",
      day: "numeric",
      ...(includeYear ? { year: "numeric" as const } : {}),
      timeZone: "Asia/Manila",
    }).format(date),
    mobileTimeLabel: new Intl.DateTimeFormat("en-PH", {
      hour: "numeric",
      minute: "2-digit",
      timeZone: "Asia/Manila",
    }).format(date),
    wideLabel: formatResponseSubmittedTable(value),
  };
}

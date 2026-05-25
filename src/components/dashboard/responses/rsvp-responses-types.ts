export type RsvpResponseStatus = "attending" | "not_attending";
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
  | "messages"
  | "guestbook"
  | "needs_review";

export type RsvpResponsesExportFormat = "csv" | "pdf_summary";
export type RsvpResponsesExportRows = "current_view" | "all_responses";
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

export function getResponseStatusLabel(status: RsvpResponseStatus) {
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
      return record.status === "attending";
    case "not_attending":
      return record.status === "not_attending";
    case "messages":
      return hasResponseMessage(record);
    case "guestbook":
      return hasResponseMessage(record) && record.messagePublicStatus === "approved";
    case "needs_review":
      return hasResponseMessage(record) && record.messagePublicStatus !== "approved";
    default:
      return true;
  }
}

export function hasResponseMessage(record: RsvpResponseRecord) {
  return Boolean(record.message?.trim());
}

export function getResponseGuestbookStatusLabel(status: RsvpResponseGuestbookStatus) {
  if (status === "approved") {
    return "Shown";
  }

  if (status === "hidden") {
    return "Private";
  }

  return "Needs review";
}

export function matchesResponseSearch(record: RsvpResponseRecord, query: string) {
  const normalizedQuery = query.trim().toLowerCase();

  if (!normalizedQuery) {
    return true;
  }

  const searchableValues = [
    record.guestName,
    record.email ?? "",
    record.phone ?? "",
  ];

  return searchableValues.some((value) => value.toLowerCase().includes(normalizedQuery));
}

export function getResponseInitials(name: string) {
  const parts = name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);

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

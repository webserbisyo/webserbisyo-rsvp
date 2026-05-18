export type RsvpResponseStatus = "attending" | "not_attending";

export type RsvpResponseSource = "public_rsvp_page" | "qr_code" | "shared_link";

export type RsvpResponseRecord = {
  id: string;
  guestName: string;
  email: string;
  phone: string;
  status: RsvpResponseStatus;
  partySize: number;
  companions: string[];
  dietaryNotes: string | null;
  message: string | null;
  submittedAt: string;
  source: RsvpResponseSource;
};

export type RsvpResponsesTab = "all" | "attending" | "not_attending" | "messages";

export type RsvpResponsesStatusFilter = "all" | RsvpResponseStatus;

export type RsvpResponsesExportFormat = "csv" | "pdf_summary";
export type RsvpResponsesExportRows = "current_view" | "all_responses";
export type RsvpResponsesExportInclude =
  | "contact_details"
  | "companions"
  | "dietary_notes"
  | "messages";

export const RSVP_RESPONSE_SOURCE_LABELS: Record<RsvpResponseSource, string> = {
  public_rsvp_page: "Public RSVP page",
  qr_code: "QR code",
  shared_link: "Shared link",
};

export function getResponseStatusLabel(status: RsvpResponseStatus) {
  return status === "attending" ? "Attending" : "Not attending";
}

export function matchesResponseTab(record: RsvpResponseRecord, tab: RsvpResponsesTab) {
  switch (tab) {
    case "attending":
      return record.status === "attending";
    case "not_attending":
      return record.status === "not_attending";
    case "messages":
      return Boolean(record.message?.trim());
    default:
      return true;
  }
}

export function matchesResponseStatusFilter(
  record: RsvpResponseRecord,
  statusFilter: RsvpResponsesStatusFilter,
) {
  if (statusFilter === "all") {
    return true;
  }

  return record.status === statusFilter;
}

export function matchesResponseSearch(record: RsvpResponseRecord, query: string) {
  const normalizedQuery = query.trim().toLowerCase();

  if (!normalizedQuery) {
    return true;
  }

  const searchableValues = [
    record.guestName,
    record.email,
    record.phone,
    ...record.companions,
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

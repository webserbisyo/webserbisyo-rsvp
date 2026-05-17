import type {
  EventWebsiteCanonicalEventPatch,
  EventWebsiteContent,
} from "@/lib/event-website/types";

const MANILA_OFFSET = "+08:00";
const MANILA_TIME_ZONE = "Asia/Manila";
const DATE_INPUT_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const LOCAL_DATE_TIME_INPUT_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;
const TIME_INPUT_PATTERN = /^([01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/;

const manilaDateTimeFormatter = new Intl.DateTimeFormat("en-CA", {
  day: "2-digit",
  hour: "2-digit",
  hourCycle: "h23",
  minute: "2-digit",
  month: "2-digit",
  timeZone: MANILA_TIME_ZONE,
  year: "numeric",
});

export function buildEventWebsiteCanonicalEventPatchInput(
  content: EventWebsiteContent,
): EventWebsiteCanonicalEventPatch {
  return {
    event_date: normalizeCanonicalDateInput(content.sections.main_event.eventDate),
    event_time: normalizeCanonicalTimeInput(content.sections.main_event.eventTime),
    rsvp_close_at: formatManilaLocalDateTimeInputToIso(
      content.sections.main_event.rsvpDeadline,
    ),
    venue_address: normalizeCanonicalText(content.sections.venue.address),
    venue_name: normalizeCanonicalText(content.sections.venue.venueName),
  };
}

export function buildManilaOffsetDateTime(
  eventDate: string | null | undefined,
  eventTime: string | null | undefined,
) {
  const normalizedDate = normalizeCanonicalDateInput(eventDate);
  const normalizedTime = normalizeCanonicalTimeInput(eventTime);

  if (!normalizedDate || !normalizedTime) {
    return null;
  }

  return `${normalizedDate}T${normalizedTime}:00${MANILA_OFFSET}`;
}

export function formatCanonicalRsvpCloseAtToEditorInput(value?: string | null) {
  const normalized = normalizeString(value);

  if (!normalized) {
    return null;
  }

  if (LOCAL_DATE_TIME_INPUT_PATTERN.test(normalized)) {
    return normalized;
  }

  const date = new Date(normalized);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  const parts = Object.fromEntries(
    manilaDateTimeFormatter
      .formatToParts(date)
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value]),
  );

  const year = parts.year;
  const month = parts.month;
  const day = parts.day;
  const hour = parts.hour;
  const minute = parts.minute;

  if (!year || !month || !day || !hour || !minute) {
    return null;
  }

  return `${year}-${month}-${day}T${hour}:${minute}`;
}

export function formatManilaLocalDateTimeInputToIso(value?: string | null) {
  const normalized = normalizeString(value);

  if (!normalized) {
    return null;
  }

  if (!LOCAL_DATE_TIME_INPUT_PATTERN.test(normalized)) {
    return null;
  }

  const [eventDate, eventTime] = normalized.split("T");
  return buildManilaOffsetDateTime(eventDate, eventTime);
}

export function normalizeCanonicalDateInput(value?: string | null) {
  const normalized = normalizeString(value);

  if (!normalized) {
    return null;
  }

  return DATE_INPUT_PATTERN.test(normalized) ? normalized : null;
}

export function normalizeCanonicalText(value?: string | null) {
  const normalized = normalizeString(value);
  return normalized || null;
}

export function normalizeCanonicalTimeInput(value?: string | null) {
  const normalized = normalizeString(value);

  if (!normalized || !TIME_INPUT_PATTERN.test(normalized)) {
    return null;
  }

  return normalized.slice(0, 5);
}

function normalizeString(value?: string | null) {
  return typeof value === "string" ? value.trim() : "";
}

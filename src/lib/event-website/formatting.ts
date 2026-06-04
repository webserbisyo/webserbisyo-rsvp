const EVENT_WEBSITE_TIME_ZONE = "Asia/Manila";
const EVENT_WEBSITE_LOCALE = "en-PH";

function buildManilaDate(value: string) {
  return new Date(`${value}T00:00:00+08:00`);
}

function buildManilaTime(value: string) {
  const normalizedTime = value.length === 5 ? `${value}:00` : value;
  return new Date(`2026-01-01T${normalizedTime}+08:00`);
}

function buildManilaDateTime(value: string) {
  const hasOffset = /(?:Z|[+-]\d{2}:\d{2})$/.test(value);
  return new Date(hasOffset ? value : `${value}+08:00`);
}

export function formatEventWebsiteDate(value: string, fallback: string) {
  if (!value) {
    return fallback;
  }

  const date = buildManilaDate(value);

  if (Number.isNaN(date.getTime())) {
    return fallback;
  }

  return new Intl.DateTimeFormat(EVENT_WEBSITE_LOCALE, {
    dateStyle: "full",
    timeZone: EVENT_WEBSITE_TIME_ZONE,
  }).format(date);
}

export function formatEventWebsiteTime(value: string, fallback: string) {
  if (!value) {
    return fallback;
  }

  const date = buildManilaTime(value);

  if (Number.isNaN(date.getTime())) {
    return fallback;
  }

  return new Intl.DateTimeFormat(EVENT_WEBSITE_LOCALE, {
    hour: "numeric",
    minute: "2-digit",
    timeZone: EVENT_WEBSITE_TIME_ZONE,
  }).format(date);
}

export function formatEventWebsiteDateTime(value: string, fallback: string) {
  if (!value) {
    return fallback;
  }

  const date = buildManilaDateTime(value);

  if (Number.isNaN(date.getTime())) {
    return fallback;
  }

  return new Intl.DateTimeFormat(EVENT_WEBSITE_LOCALE, {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: EVENT_WEBSITE_TIME_ZONE,
  }).format(date);
}

export function formatEventWebsiteDateTimeLocalInput(value: string | null) {
  if (!value) {
    return "";
  }

  const date = buildManilaDateTime(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const formatter = new Intl.DateTimeFormat("en-CA", {
    day: "2-digit",
    hour: "2-digit",
    hour12: false,
    minute: "2-digit",
    month: "2-digit",
    timeZone: EVENT_WEBSITE_TIME_ZONE,
    year: "numeric",
  });
  const parts = Object.fromEntries(
    formatter
      .formatToParts(date)
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value]),
  );

  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`;
}

export function formatPublicDate(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  const label = formatEventWebsiteDate(value, "");
  return label || null;
}

export function formatPublicTime(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  const label = formatEventWebsiteTime(value, "");
  return label || null;
}

export function formatPublicDateTime(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  const label = formatEventWebsiteDateTime(value, "");
  return label || null;
}

export function formatPublicRsvpDeadline(value: string | null | undefined) {
  return formatPublicDateTime(value);
}

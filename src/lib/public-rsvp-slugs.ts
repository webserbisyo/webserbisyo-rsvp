export const PUBLIC_RSVP_SLUG_MIN_LENGTH = 3;
export const PUBLIC_RSVP_SLUG_MAX_LENGTH = 60;
export const PUBLIC_RSVP_SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const PUBLIC_RSVP_RESERVED_SLUGS = new Set([
  "admin",
  "api",
  "app",
  "apply",
  "assets",
  "auth",
  "blog",
  "cdn",
  "dashboard",
  "docs",
  "help",
  "login",
  "logout",
  "mail",
  "offline",
  "r",
  "rsvp",
  "send",
  "signup",
  "smtp",
  "static",
  "status",
  "supabase",
  "support",
  "vercel",
  "www",
]);

export function sanitizePublicRsvpSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, PUBLIC_RSVP_SLUG_MAX_LENGTH);
}

export function isReservedPublicRsvpSlug(value: string) {
  return PUBLIC_RSVP_RESERVED_SLUGS.has(value);
}

export function isValidPublicRsvpSlug(value: string) {
  return (
    value.length >= PUBLIC_RSVP_SLUG_MIN_LENGTH &&
    value.length <= PUBLIC_RSVP_SLUG_MAX_LENGTH &&
    PUBLIC_RSVP_SLUG_PATTERN.test(value) &&
    !isReservedPublicRsvpSlug(value)
  );
}

export function validatePublicRsvpSlug(value: string) {
  if (!value) {
    return "Enter a URL name.";
  }

  if (value.length < PUBLIC_RSVP_SLUG_MIN_LENGTH) {
    return `Use at least ${PUBLIC_RSVP_SLUG_MIN_LENGTH} characters.`;
  }

  if (value.length > PUBLIC_RSVP_SLUG_MAX_LENGTH) {
    return `Use ${PUBLIC_RSVP_SLUG_MAX_LENGTH} characters or fewer.`;
  }

  if (!PUBLIC_RSVP_SLUG_PATTERN.test(value)) {
    return "Use lowercase letters, numbers, and hyphens only.";
  }

  if (isReservedPublicRsvpSlug(value)) {
    return "That URL name is reserved.";
  }

  return null;
}

export function validateOptionalPublicRsvpSlug(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  return validatePublicRsvpSlug(value);
}

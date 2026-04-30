export const APPLICATION_REFERENCE_PATTERN = /^RSVP-\d{8}-[A-Z0-9]{4}$/;

export function isApplicationReferenceCode(value: string | null | undefined): value is string {
  return Boolean(value && APPLICATION_REFERENCE_PATTERN.test(value));
}

export function generateApplicationReferenceCode(now: Date = new Date()): string {
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, "0");
  const day = String(now.getUTCDate()).padStart(2, "0");
  const suffix = crypto.randomUUID().replace(/-/g, "").slice(0, 4).toUpperCase();

  return `RSVP-${year}${month}${day}-${suffix}`;
}

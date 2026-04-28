export const APPLICATION_REFERENCE_PATTERN = /^RSVP-\d{8}-[A-Z0-9]{4}$/;

export function isApplicationReferenceCode(value: string | null | undefined): value is string {
  return Boolean(value && APPLICATION_REFERENCE_PATTERN.test(value));
}

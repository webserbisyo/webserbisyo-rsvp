import { isReservedPublicRsvpSlug, isValidPublicRsvpSlug } from "./public-rsvp-slugs";
import { getRsvpBaseDomain } from "./public-rsvp-url";

function normalizeHostname(value: string) {
  return value.trim().toLowerCase().replace(/\.+$/, "").split(":")[0] ?? "";
}

export function extractPublicRsvpSubdomainSlug(hostname: string, baseDomain?: string | null) {
  const normalizedHost = normalizeHostname(hostname);
  const configuredBaseDomain = getRsvpBaseDomain(baseDomain);

  if (!normalizedHost || !configuredBaseDomain) {
    return null;
  }

  if (normalizedHost === configuredBaseDomain) {
    return null;
  }

  const suffix = `.${configuredBaseDomain}`;

  if (!normalizedHost.endsWith(suffix)) {
    return null;
  }

  const subdomain = normalizedHost.slice(0, -suffix.length);

  if (!subdomain || subdomain.includes(".")) {
    return null;
  }

  if (!isValidPublicRsvpSlug(subdomain) || isReservedPublicRsvpSlug(subdomain)) {
    return null;
  }

  return subdomain;
}

export function isPublicRsvpHostname(hostname: string, baseDomain?: string | null) {
  return extractPublicRsvpSubdomainSlug(hostname, baseDomain) !== null;
}

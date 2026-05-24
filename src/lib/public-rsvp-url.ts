function trimTrailingSlash(value: string) {
  return value.replace(/\/+$/, "");
}

function appendHashToUrl(url: string | null, hash: string) {
  if (!url) {
    return null;
  }

  return `${url.replace(/#.*$/, "")}${hash.startsWith("#") ? hash : `#${hash}`}`;
}

export const DEFAULT_RSVP_WILDCARD_PREVIEW_DOMAIN = "rsvp.webserbisyo.com";

function normalizeUrlLikeValue(value?: string | null) {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();

  if (!trimmed) {
    return null;
  }

  if (/^https?:\/\//i.test(trimmed)) {
    return normalizePublicAppUrl(trimmed);
  }

  return normalizePublicAppUrl(`https://${trimmed}`);
}

function normalizeHostname(value?: string | null) {
  if (!value) {
    return null;
  }

  const trimmed = value.trim().toLowerCase().replace(/\.+$/, "");

  if (!trimmed) {
    return null;
  }

  try {
    return new URL(trimmed).hostname;
  } catch {
    return trimmed.split(":")[0] ?? null;
  }
}

export function normalizePublicAppUrl(value?: string | null) {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();

  if (!trimmed) {
    return null;
  }

  try {
    return trimTrailingSlash(new URL(trimmed).toString());
  } catch {
    return null;
  }
}

export function resolveConfiguredPublicAppUrl(...values: Array<string | null | undefined>) {
  for (const value of values) {
    const normalized = normalizeUrlLikeValue(value);

    if (normalized) {
      return normalized;
    }
  }

  return null;
}

export function getPublicAppUrl(options?: {
  baseUrl?: string | null;
  preferredOrigin?: string | null;
}) {
  return resolveConfiguredPublicAppUrl(
    options?.baseUrl,
    process.env.NEXT_PUBLIC_APP_URL,
    process.env.NEXT_PUBLIC_SITE_URL,
    process.env.SITE_URL,
    process.env.APP_BASE_URL,
    process.env.VERCEL_PROJECT_PRODUCTION_URL,
    process.env.VERCEL_URL,
    options?.preferredOrigin,
    process.env.NODE_ENV === "development" ? "http://localhost:3000" : null,
  );
}

export function buildPublicRsvpPath(slug: string) {
  return `/r/${slug}`;
}

export function buildPublicRsvpFormPath(slug: string) {
  return `${buildPublicRsvpPath(slug)}#rsvp-form`;
}

export function buildPublicRsvpUrl(input: {
  baseUrl?: string | null;
  slug: string;
}) {
  const baseUrl = getPublicAppUrl({ baseUrl: input.baseUrl });

  if (!baseUrl) {
    return null;
  }

  return `${trimTrailingSlash(baseUrl)}${buildPublicRsvpPath(input.slug)}`;
}

export function buildPublicRsvpFormUrl(input: {
  baseUrl?: string | null;
  slug: string;
}) {
  const baseUrl = getPublicAppUrl({ baseUrl: input.baseUrl });

  if (!baseUrl) {
    return null;
  }

  return `${trimTrailingSlash(baseUrl)}${buildPublicRsvpFormPath(input.slug)}`;
}

export function getRsvpBaseDomain(baseDomain?: string | null) {
  return normalizeHostname(
    baseDomain ?? process.env.NEXT_PUBLIC_RSVP_WILDCARD_DOMAIN ?? process.env.RSVP_WILDCARD_DOMAIN,
  );
}

export function getRsvpPreviewBaseDomain(baseDomain?: string | null) {
  return (
    getRsvpBaseDomain(baseDomain) ??
    normalizeHostname(baseDomain ?? DEFAULT_RSVP_WILDCARD_PREVIEW_DOMAIN)
  );
}

export function buildWildcardRsvpUrl(input: {
  baseDomain?: string | null;
  subdomain: string;
}) {
  const hostname = getRsvpBaseDomain(input.baseDomain);

  if (!hostname) {
    return null;
  }

  return `https://${input.subdomain}.${hostname}`;
}

export function buildWildcardRsvpPreviewUrl(input: {
  baseDomain?: string | null;
  subdomain: string;
}) {
  const hostname = getRsvpPreviewBaseDomain(input.baseDomain);

  if (!hostname) {
    return null;
  }

  return `https://${input.subdomain}.${hostname}`;
}

export function getBestPublicRsvpUrl(input: {
  baseUrl?: string | null;
  customDomain?: string | null;
  slug: string;
  subdomain?: string | null;
  wildcardBaseDomain?: string | null;
}) {
  const customDomainUrl = normalizeUrlLikeValue(input.customDomain);

  if (customDomainUrl) {
    return customDomainUrl;
  }

  if (input.subdomain) {
    const wildcardUrl = buildWildcardRsvpUrl({
      baseDomain: input.wildcardBaseDomain,
      subdomain: input.subdomain,
    });

    if (wildcardUrl) {
      return wildcardUrl;
    }
  }

  return buildPublicRsvpUrl({
    baseUrl: input.baseUrl,
    slug: input.slug,
  });
}

export function getBestPublicRsvpFormUrl(input: {
  baseUrl?: string | null;
  customDomain?: string | null;
  slug: string;
  subdomain?: string | null;
  wildcardBaseDomain?: string | null;
}) {
  return appendHashToUrl(
    getBestPublicRsvpUrl(input),
    "#rsvp-form",
  );
}

export function isPublishedPublicRsvpReady(input: {
  fallbackPageEnabled: boolean | null | undefined;
  hasPublishedSnapshot: boolean;
  publishedAt: string | null | undefined;
  slug: string | null | undefined;
  status: string | null | undefined;
}) {
  return (
    input.status === "published" &&
    Boolean(input.publishedAt) &&
    Boolean(input.fallbackPageEnabled) &&
    Boolean(input.slug) &&
    input.hasPublishedSnapshot
  );
}

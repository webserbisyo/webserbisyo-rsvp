function trimTrailingSlash(value: string) {
  return value.replace(/\/+$/, "");
}

export const DEFAULT_RSVP_WILDCARD_PREVIEW_DOMAIN = "rsvp.webserbisyo.com";
export const DEFAULT_PUBLIC_APP_URL = "https://rsvp.webserbisyo.com";

export type PublicRsvpEnvironment = "development" | "preview" | "production";

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

  if (/^[a-z][a-z\d+\-.]*:\/\//i.test(trimmed) || trimmed.startsWith("/")) {
    return null;
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
    const url = new URL(trimmed);

    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return null;
    }

    if (!url.hostname || url.username || url.password) {
      return null;
    }

    return trimTrailingSlash(url.toString());
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

function resolveConfiguredOfficialPublicAppUrl(...values: Array<string | null | undefined>) {
  for (const value of values) {
    const normalized = normalizeUrlLikeValue(value);

    if (normalized && !isVercelDeploymentUrl(normalized)) {
      return normalized;
    }
  }

  return null;
}

function getConfiguredProductionAppUrl() {
  return resolveConfiguredOfficialPublicAppUrl(
    process.env.NEXT_PUBLIC_APP_URL,
    process.env.NEXT_PUBLIC_SITE_URL,
    process.env.SITE_URL,
    process.env.APP_BASE_URL,
  );
}

export function getOfficialPublicAppUrl() {
  return getConfiguredProductionAppUrl() ?? DEFAULT_PUBLIC_APP_URL;
}

function isVercelDeploymentUrl(value: string) {
  try {
    const hostname = new URL(value).hostname.toLowerCase();
    return hostname === "vercel.app" || hostname.endsWith(".vercel.app");
  } catch {
    return false;
  }
}

function getPreviewDeploymentAppUrl(options?: {
  baseUrl?: string | null;
  preferredOrigin?: string | null;
}) {
  return resolveConfiguredPublicAppUrl(
    options?.preferredOrigin,
    process.env.VERCEL_URL,
    options?.baseUrl,
  );
}

export function getPublicRsvpEnvironment(): PublicRsvpEnvironment {
  if (process.env.NODE_ENV === "development") {
    return "development";
  }

  const vercelEnvironment = (process.env.VERCEL_ENV ?? "").trim().toLowerCase();

  if (vercelEnvironment === "preview") {
    return "preview";
  }

  return "production";
}

export function getPublicAppUrl(options?: {
  baseUrl?: string | null;
  preferredOrigin?: string | null;
}) {
  const environment = getPublicRsvpEnvironment();

  if (environment === "development") {
    return (
      getLocalDevelopmentAppUrl() ??
      resolveConfiguredPublicAppUrl(
        options?.preferredOrigin,
        options?.baseUrl,
        getConfiguredProductionAppUrl(),
        getPreviewDeploymentAppUrl(options),
      )
    );
  }

  if (environment === "preview") {
    return (
      getPreviewDeploymentAppUrl(options) ??
      resolveConfiguredPublicAppUrl(
        options?.baseUrl,
        getConfiguredProductionAppUrl(),
      )
    );
  }

  return getOfficialPublicAppUrl();
}

export function getLocalDevelopmentAppUrl() {
  return process.env.NODE_ENV === "development" ? "http://localhost:3000" : null;
}

export function buildPublicRsvpPath(slug: string) {
  return `/r/${slug}`;
}

export function buildPublicRsvpStandalonePath(slug: string) {
  return `${buildPublicRsvpPath(slug)}/rsvp`;
}

export function buildPublicRsvpFormAnchorPath(slug: string) {
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

export function buildOfficialPublicRsvpUrl(slug: string) {
  return `${getOfficialPublicAppUrl()}${buildPublicRsvpPath(slug)}`;
}

export function buildPublicRsvpStandaloneUrl(input: {
  baseUrl?: string | null;
  slug: string;
}) {
  const baseUrl = getPublicAppUrl({ baseUrl: input.baseUrl });

  if (!baseUrl) {
    return null;
  }

  return `${trimTrailingSlash(baseUrl)}${buildPublicRsvpStandalonePath(input.slug)}`;
}

export function buildOfficialPublicRsvpStandaloneUrl(slug: string) {
  return `${getOfficialPublicAppUrl()}${buildPublicRsvpStandalonePath(slug)}`;
}

export function buildPublicRsvpFormAnchorUrl(input: {
  baseUrl?: string | null;
  slug: string;
}) {
  const baseUrl = getPublicAppUrl({ baseUrl: input.baseUrl });

  if (!baseUrl) {
    return null;
  }

  return `${trimTrailingSlash(baseUrl)}${buildPublicRsvpFormAnchorPath(input.slug)}`;
}

export function withRsvpAnchor(url?: string | null) {
  if (!url) {
    return null;
  }

  return `${url.replace(/#.*$/, "")}#rsvp`;
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

export function buildWildcardRsvpStandaloneUrl(input: {
  baseDomain?: string | null;
  subdomain: string;
}) {
  const wildcardUrl = buildWildcardRsvpUrl(input);

  if (!wildcardUrl) {
    return null;
  }

  return `${wildcardUrl}/rsvp`;
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
  return buildPublicRsvpFormAnchorUrl({
    baseUrl: input.baseUrl,
    slug: input.slug,
  });
}

function isLocalWildcardSimulationEnabled() {
  return ["1", "true", "yes", "on"].includes(
    (
      process.env.NEXT_PUBLIC_ENABLE_LOCAL_WILDCARD_SIMULATION ??
      process.env.ENABLE_LOCAL_WILDCARD_SIMULATION ??
      ""
    )
      .trim()
      .toLowerCase(),
  );
}

export type PublicRsvpLinkSet = {
  copyUrl: string | null;
  displayUrl: string | null;
  fallbackPathUrl: string | null;
  fallbackRsvpPathUrl: string | null;
  localPreviewUrl: string | null;
  openUrl: string | null;
  previewChromeUrl: string | null;
  preferredProductionUrl: string | null;
  preferredProductionRsvpUrl: string | null;
  qrUrl: string | null;
  wildcardProductionUrl: string | null;
  wildcardProductionRsvpUrl: string | null;
};

export function resolvePublicRsvpLinkSet(input: {
  baseUrl?: string | null;
  customDomain?: string | null;
  preferWildcardRsvpPath?: boolean;
  preferredOrigin?: string | null;
  slug?: string | null;
  subdomain?: string | null;
  wildcardBaseDomain?: string | null;
}): PublicRsvpLinkSet {
  const slug = input.slug?.trim() || null;
  const environment = getPublicRsvpEnvironment();
  const runtimeBaseUrl = getPublicAppUrl({
    baseUrl: input.baseUrl,
    preferredOrigin: input.preferredOrigin,
  });
  const productionBaseUrl = getOfficialPublicAppUrl();
  const wildcardProductionUrl = input.subdomain
    ? buildWildcardRsvpUrl({
        baseDomain: input.wildcardBaseDomain,
        subdomain: input.subdomain,
      })
    : null;
  const wildcardProductionRsvpUrl = input.subdomain
    ? buildWildcardRsvpStandaloneUrl({
        baseDomain: input.wildcardBaseDomain,
        subdomain: input.subdomain,
      })
    : null;
  const fallbackPathUrl = slug
    ? buildPublicRsvpUrl({
        baseUrl: runtimeBaseUrl,
        slug,
      })
    : null;
  const fallbackRsvpPathUrl = slug
    ? buildPublicRsvpStandaloneUrl({
        baseUrl: runtimeBaseUrl,
        slug,
      })
    : null;
  const preferredProductionUrl = slug
    ? getBestPublicRsvpUrl({
        baseUrl: productionBaseUrl,
        customDomain: input.customDomain,
        slug,
        subdomain: input.subdomain,
        wildcardBaseDomain: input.wildcardBaseDomain,
      })
    : null;
  const preferredProductionRsvpUrl = slug
    ? input.preferWildcardRsvpPath
      ? (wildcardProductionRsvpUrl ?? buildOfficialPublicRsvpStandaloneUrl(slug))
      : buildOfficialPublicRsvpStandaloneUrl(slug)
    : null;
  const localDevelopmentAppUrl = getLocalDevelopmentAppUrl();
  const localDevelopmentUrl =
    slug && localDevelopmentAppUrl
    ? buildPublicRsvpUrl({
        baseUrl: localDevelopmentAppUrl,
        slug,
      })
    : null;
  const useLocalSafeUrls =
    environment === "development" && !isLocalWildcardSimulationEnabled();
  const displayUrl = useLocalSafeUrls
    ? (localDevelopmentUrl ?? fallbackPathUrl ?? preferredProductionUrl)
    : environment === "preview"
      ? (fallbackPathUrl ?? preferredProductionUrl)
      : (preferredProductionUrl ?? fallbackPathUrl);
  const openUrl = displayUrl;
  const copyUrl = displayUrl;
  const qrUrl = displayUrl;
  const previewChromeUrl = displayUrl;

  return {
    copyUrl,
    displayUrl,
    fallbackPathUrl,
    fallbackRsvpPathUrl,
    localPreviewUrl: localDevelopmentUrl,
    openUrl,
    previewChromeUrl,
    preferredProductionUrl,
    preferredProductionRsvpUrl,
    qrUrl,
    wildcardProductionUrl,
    wildcardProductionRsvpUrl,
  };
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

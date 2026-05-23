function trimTrailingSlash(value: string) {
  return value.replace(/\/+$/, "");
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
    const normalized = normalizePublicAppUrl(value);

    if (normalized) {
      return normalized;
    }
  }

  return null;
}

export function buildPublicRsvpUrl(baseUrl: string, slug: string) {
  return `${trimTrailingSlash(baseUrl)}/r/${slug}`;
}

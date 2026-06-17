export const PRIVATE_ACCESS_QUERY_PARAM = "access";

const PRIVATE_ACCESS_TOKEN_PATTERN = /^[A-Za-z0-9_-]{20,256}$/;

function hasAbsoluteProtocol(value: string) {
  return /^[a-z][a-z\d+\-.]*:\/\//i.test(value);
}

export function normalizePrivateAccessToken(value?: string | null) {
  const trimmed = value?.trim() ?? "";

  if (!trimmed) {
    return null;
  }

  return PRIVATE_ACCESS_TOKEN_PATTERN.test(trimmed) ? trimmed : null;
}

export function appendPrivateAccessToken(url?: string | null, token?: string | null) {
  const normalizedUrl = url?.trim() ?? "";
  const normalizedToken = normalizePrivateAccessToken(token);

  if (!normalizedUrl) {
    return null;
  }

  if (!normalizedToken) {
    return normalizedUrl;
  }

  const isAbsoluteUrl = hasAbsoluteProtocol(normalizedUrl);
  const parsed = new URL(normalizedUrl, "https://webserbisyo.local");

  parsed.searchParams.set(PRIVATE_ACCESS_QUERY_PARAM, normalizedToken);

  if (isAbsoluteUrl) {
    return parsed.toString();
  }

  return `${parsed.pathname}${parsed.search}${parsed.hash}`;
}

export function getPrivateAccessTokenFromSearchParams(searchParams: {
  get(name: string): string | null;
}) {
  return normalizePrivateAccessToken(searchParams.get(PRIVATE_ACCESS_QUERY_PARAM));
}

export function hasPublishedPrivateAccess(input: {
  providedToken?: string | null;
  storedToken?: string | null;
  visibility?: string | null;
}) {
  if (input.visibility !== "private") {
    return true;
  }

  const expectedToken = normalizePrivateAccessToken(input.storedToken);
  const providedToken = normalizePrivateAccessToken(input.providedToken);

  return Boolean(expectedToken && providedToken && expectedToken === providedToken);
}

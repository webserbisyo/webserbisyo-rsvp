import "server-only";

const OFFICIAL_DEFAULT_ORIGIN = "https://rsvp.webserbisyo.com";

export function isAllowedMetaAcquisitionOrigin(request: Request) {
  const origin = request.headers.get("origin");

  if (!origin) {
    return false;
  }

  return getAllowedOrigins(request).has(normalizeOrigin(origin));
}

export function getCanonicalMetaAcquisitionUrl(request: Request, sourcePath: string) {
  const origin = getPreferredOrigin(request);
  return new URL(sourcePath, origin).toString();
}

export function getServerCanonicalMetaAcquisitionUrl(sourcePath: string) {
  return new URL(sourcePath, getServerPreferredOrigin()).toString();
}

function getServerPreferredOrigin() {
  for (const value of [process.env.NEXT_PUBLIC_APP_URL, process.env.SITE_URL, process.env.APP_BASE_URL]) {
    const origin = normalizeOrigin(value);
    if (origin && origin !== OFFICIAL_DEFAULT_ORIGIN.replace(/\/+$/, "")) {
      return origin;
    }
  }

  return OFFICIAL_DEFAULT_ORIGIN;
}

function getAllowedOrigins(request: Request) {
  const origins = new Set([OFFICIAL_DEFAULT_ORIGIN]);

  for (const value of [process.env.NEXT_PUBLIC_APP_URL, process.env.SITE_URL, process.env.APP_BASE_URL]) {
    const origin = normalizeOrigin(value);
    if (origin) {
      origins.add(origin);
    }
  }

  if (process.env.NODE_ENV !== "production") {
    origins.add(new URL(request.url).origin);
  }

  return origins;
}

function getPreferredOrigin(request: Request) {
  for (const value of [process.env.NEXT_PUBLIC_APP_URL, process.env.SITE_URL, process.env.APP_BASE_URL]) {
    const origin = normalizeOrigin(value);
    if (origin && origin !== OFFICIAL_DEFAULT_ORIGIN.replace(/\/+$/, "")) {
      return origin;
    }
  }

  return process.env.NODE_ENV === "production" ? OFFICIAL_DEFAULT_ORIGIN : new URL(request.url).origin;
}

function normalizeOrigin(value: string | null | undefined) {
  if (!value) {
    return "";
  }

  try {
    return new URL(value).origin;
  } catch {
    return "";
  }
}

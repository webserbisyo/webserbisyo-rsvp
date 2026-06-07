import "server-only";

import { buildPublicRsvpPath, buildPublicRsvpStandalonePath, getOfficialPublicAppUrl, getRsvpBaseDomain } from "@/lib/public-rsvp-url";
import { assertSafeCustomFrontendOriginForFetch } from "@/server/services/custom-websites/custom-website-origin";
import { resolvePublicCustomFrontendBySubdomain } from "@/server/services/custom-websites/resolve-public-custom-frontend";

export const runtime = "nodejs";

const ORIGINAL_HOST_HEADER = "x-webserbisyo-original-host";
const ORIGINAL_PATH_HEADER = "x-webserbisyo-original-path";
const ORIGINAL_SEARCH_HEADER = "x-webserbisyo-original-search";
const SKIP_CUSTOM_PROXY_HEADER = "x-webserbisyo-skip-custom-proxy";
const PLATFORM_OWNED_PUBLIC_PATH_PREFIXES = ["/admin", "/dashboard", "/login", "/api", "/r"] as const;
const REQUEST_HEADER_ALLOWLIST = ["accept", "accept-language", "cache-control", "if-none-match", "if-modified-since", "user-agent"] as const;
const RESPONSE_HEADER_BLOCKLIST = ["connection", "content-length", "keep-alive", "transfer-encoding"] as const;

type ProxyRouteContext = {
  params: Promise<{ path?: string[] }>;
};

export async function GET(request: Request, context: ProxyRouteContext) {
  return handleCustomProxyRequest(request, context);
}

export async function HEAD(request: Request, context: ProxyRouteContext) {
  return handleCustomProxyRequest(request, context);
}

export async function OPTIONS() {
  return new Response(null, {
    headers: {
      Allow: "GET, HEAD, OPTIONS",
    },
    status: 204,
  });
}

async function handleCustomProxyRequest(request: Request, context: ProxyRouteContext) {
  const originalHost = readOriginalHost(request);
  const originalPathname = await readOriginalPathname(context, request);
  const originalSearch = request.headers.get(ORIGINAL_SEARCH_HEADER) ?? "";

  if (!originalHost || !originalPathname || isPlatformOwnedPublicPath(originalPathname)) {
    return new Response("Not Found", { status: 404 });
  }

  const subdomainSlug = extractSubdomainSlugFromHost(originalHost);

  if (!subdomainSlug) {
    return new Response("Not Found", { status: 404 });
  }

  const resolution = await resolvePublicCustomFrontendBySubdomain(subdomainSlug);

  if (!resolution) {
    return new Response("Not Found", { status: 404 });
  }

  if (
    !resolution.customFrontendEnabled ||
    !resolution.customFrontendOriginUrl ||
    resolution.healthStatus === "unhealthy"
  ) {
    return fetchPlatformFallbackResponse({
      eventSlug: resolution.eventSlug,
      originalHost,
      originalPathname,
      originalSearch,
      request,
    });
  }

  let safeOrigin: string;

  try {
    safeOrigin = await assertSafeCustomFrontendOriginForFetch(resolution.customFrontendOriginUrl);
    assertOriginDoesNotLoop({
      origin: safeOrigin,
      requestHost: originalHost,
    });
  } catch {
    if (isHtmlPageRequest(originalPathname)) {
      return fetchPlatformFallbackResponse({
        eventSlug: resolution.eventSlug,
        originalHost,
        originalPathname,
        originalSearch,
        request,
      });
    }

    return new Response("Bad Gateway", { status: 502 });
  }

  const upstreamUrl = new URL(`${originalPathname}${originalSearch}`, safeOrigin);
  const proxyRequest = new Request(upstreamUrl, {
    headers: buildUpstreamRequestHeaders(request.headers, originalHost),
    method: request.method,
    redirect: "manual",
  });

  try {
    const upstreamResponse = await fetch(proxyRequest);

    if (!upstreamResponse.ok && isHtmlPageRequest(originalPathname)) {
      return fetchPlatformFallbackResponse({
        eventSlug: resolution.eventSlug,
        originalHost,
        originalPathname,
        originalSearch,
        request,
      });
    }

    return buildProxyResponse(upstreamResponse, originalPathname);
  } catch {
    if (isHtmlPageRequest(originalPathname)) {
      return fetchPlatformFallbackResponse({
        eventSlug: resolution.eventSlug,
        originalHost,
        originalPathname,
        originalSearch,
        request,
      });
    }

    return new Response("Bad Gateway", { status: 502 });
  }
}

async function readOriginalPathname(context: ProxyRouteContext, request: Request) {
  const requestPathname = request.headers.get(ORIGINAL_PATH_HEADER);

  if (requestPathname) {
    return requestPathname;
  }

  const { path } = await context.params;

  return path && path.length > 0 ? `/${path.join("/")}` : "/";
}

function readOriginalHost(request: Request) {
  const host = request.headers.get(ORIGINAL_HOST_HEADER) ?? request.headers.get("x-forwarded-host");

  return host ? host.split(",")[0]?.trim() ?? null : null;
}

function extractSubdomainSlugFromHost(host: string) {
  const normalizedHost = host.trim().toLowerCase().replace(/\.+$/, "").split(":")[0] ?? "";
  const wildcardBaseDomain = getRsvpBaseDomain();

  if (!normalizedHost || !wildcardBaseDomain || normalizedHost === wildcardBaseDomain) {
    return null;
  }

  const suffix = `.${wildcardBaseDomain}`;

  if (!normalizedHost.endsWith(suffix)) {
    return null;
  }

  const subdomain = normalizedHost.slice(0, -suffix.length);

  return subdomain && !subdomain.includes(".") ? subdomain : null;
}

function assertOriginDoesNotLoop(input: { origin: string; requestHost: string }) {
  const originUrl = new URL(input.origin);
  const originHost = originUrl.hostname.toLowerCase();
  const requestHost = input.requestHost.trim().toLowerCase().split(":")[0] ?? "";
  const wildcardBaseDomain = getRsvpBaseDomain();
  const platformPublicHost = new URL(getOfficialPublicAppUrl()).hostname.toLowerCase();

  if (
    originHost === requestHost ||
    originHost === platformPublicHost ||
    (wildcardBaseDomain &&
      (originHost === wildcardBaseDomain || originHost.endsWith(`.${wildcardBaseDomain}`)))
  ) {
    throw new Error("Custom frontend origin cannot point back to the platform domain.");
  }
}

function buildUpstreamRequestHeaders(headers: Headers, originalHost: string) {
  const nextHeaders = new Headers();

  for (const headerName of REQUEST_HEADER_ALLOWLIST) {
    const value = headers.get(headerName);

    if (value) {
      nextHeaders.set(headerName, value);
    }
  }

  nextHeaders.set("x-forwarded-host", originalHost);
  nextHeaders.set("x-forwarded-proto", "https");

  return nextHeaders;
}

function buildProxyResponse(upstreamResponse: Response, originalPathname: string) {
  const headers = new Headers(upstreamResponse.headers);

  for (const headerName of RESPONSE_HEADER_BLOCKLIST) {
    headers.delete(headerName);
  }

  if (isHtmlPageRequest(originalPathname)) {
    headers.set("cache-control", "private, no-cache, no-store, max-age=0, must-revalidate");
  }

  return new Response(upstreamResponse.body, {
    headers,
    status: upstreamResponse.status,
    statusText: upstreamResponse.statusText,
  });
}

async function fetchPlatformFallbackResponse(input: {
  eventSlug: string;
  originalHost: string;
  originalPathname: string;
  originalSearch: string;
  request: Request;
}) {
  const fallbackPath = mapWildcardPathToPlatformFallbackPath(input.eventSlug, input.originalPathname);
  const fallbackUrl = new URL(`${fallbackPath}${input.originalSearch}`, input.request.url);
  const fallbackHeaders = new Headers();
  const accept = input.request.headers.get("accept");
  const acceptLanguage = input.request.headers.get("accept-language");
  const userAgent = input.request.headers.get("user-agent");

  fallbackHeaders.set(SKIP_CUSTOM_PROXY_HEADER, "1");
  fallbackHeaders.set("x-forwarded-host", input.originalHost);

  if (accept) {
    fallbackHeaders.set("accept", accept);
  }

  if (acceptLanguage) {
    fallbackHeaders.set("accept-language", acceptLanguage);
  }

  if (userAgent) {
    fallbackHeaders.set("user-agent", userAgent);
  }

  const fallbackResponse = await fetch(
    new Request(fallbackUrl, {
      headers: fallbackHeaders,
      method: input.request.method,
      redirect: "manual",
    }),
  );

  return buildProxyResponse(fallbackResponse, input.originalPathname);
}

function mapWildcardPathToPlatformFallbackPath(eventSlug: string, originalPathname: string) {
  if (originalPathname === "/") {
    return buildPublicRsvpPath(eventSlug);
  }

  if (originalPathname === "/rsvp") {
    return buildPublicRsvpStandalonePath(eventSlug);
  }

  return originalPathname;
}

function isPlatformOwnedPublicPath(pathname: string) {
  return PLATFORM_OWNED_PUBLIC_PATH_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

function isHtmlPageRequest(pathname: string) {
  return !pathname.startsWith("/_next/") && !/\.[a-z0-9]+$/i.test(pathname);
}

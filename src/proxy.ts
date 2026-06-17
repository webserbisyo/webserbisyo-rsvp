import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { extractPublicRsvpSubdomainSlug } from "@/lib/public-rsvp-host";
import { getSupabasePublicEnv } from "./lib/supabase/env";

const AUTH_GUARD_PATH_PREFIXES = ["/admin", "/dashboard"] as const;
const PLATFORM_OWNED_PUBLIC_PATH_PREFIXES = [
  "/admin",
  "/dashboard",
  "/login",
  "/api",
  "/r",
] as const;
const INTERNAL_CUSTOM_PROXY_PREFIX = "/custom-proxy-internal";
const SKIP_CUSTOM_PROXY_HEADER = "x-webserbisyo-skip-custom-proxy";
const ORIGINAL_HOST_HEADER = "x-webserbisyo-original-host";
const ORIGINAL_PATH_HEADER = "x-webserbisyo-original-path";
const ORIGINAL_SEARCH_HEADER = "x-webserbisyo-original-search";

export async function proxy(request: NextRequest) {
  const customProxyResponse = maybeRewriteWildcardCustomFrontendRequest(request);

  if (customProxyResponse) {
    return customProxyResponse;
  }

  if (!isAuthGuardPath(request.nextUrl.pathname)) {
    return NextResponse.next({ request });
  }

  const requestHeaders = createAuthGuardRequestHeaders(request);

  if (process.env.RSVP_AUTH_GUARD_ENABLED !== "true") {
    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  }

  let env: ReturnType<typeof getSupabasePublicEnv>;

  try {
    env = getSupabasePublicEnv();
  } catch {
    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  }

  let supabaseResponse = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  const supabase = createServerClient(env.url, env.anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) =>
          request.cookies.set({ name, value, ...options }),
        );
        supabaseResponse = NextResponse.next({
          request: {
            headers: requestHeaders,
          },
        });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set({ name, value, ...options }),
        );
      },
    },
  });

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    const loginUrl = new URL("/login", request.url);
    const nextPath = `${request.nextUrl.pathname}${request.nextUrl.search}`;
    loginUrl.searchParams.set("next", nextPath);
    return NextResponse.redirect(loginUrl);
  }

  return supabaseResponse;
}

function maybeRewriteWildcardCustomFrontendRequest(request: NextRequest) {
  if (request.headers.get(SKIP_CUSTOM_PROXY_HEADER) === "1") {
    return null;
  }

  const pathname = request.nextUrl.pathname;

  if (
    pathname === INTERNAL_CUSTOM_PROXY_PREFIX ||
    pathname.startsWith(`${INTERNAL_CUSTOM_PROXY_PREFIX}/`) ||
    isPlatformOwnedPublicPath(pathname)
  ) {
    return null;
  }

  const requestHost = getRequestHost(request);

  if (!requestHost) {
    return null;
  }

  const host = requestHost;
  const wildcardSubdomain = extractPublicRsvpSubdomainSlug(host);

  if (!wildcardSubdomain) {
    return null;
  }

  const rewriteUrl = request.nextUrl.clone();
  rewriteUrl.pathname = buildInternalCustomProxyPath(pathname);
  const requestHeaders = new Headers(request.headers);

  requestHeaders.set(ORIGINAL_HOST_HEADER, host);
  requestHeaders.set(ORIGINAL_PATH_HEADER, pathname);
  requestHeaders.set(ORIGINAL_SEARCH_HEADER, request.nextUrl.search);

  return NextResponse.rewrite(rewriteUrl, {
    request: {
      headers: requestHeaders,
    },
  });
}

function buildInternalCustomProxyPath(pathname: string) {
  if (pathname === "/") {
    return INTERNAL_CUSTOM_PROXY_PREFIX;
  }

  return `${INTERNAL_CUSTOM_PROXY_PREFIX}${pathname}`;
}

function isAuthGuardPath(pathname: string) {
  return AUTH_GUARD_PATH_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

function isPlatformOwnedPublicPath(pathname: string) {
  return PLATFORM_OWNED_PUBLIC_PATH_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

function getRequestHost(request: NextRequest) {
  const forwardedHost = request.headers.get("x-forwarded-host");

  if (forwardedHost) {
    return forwardedHost.split(",")[0]?.trim() ?? null;
  }

  return request.headers.get("host");
}

function createAuthGuardRequestHeaders(request: NextRequest) {
  const requestHeaders = new Headers(request.headers);

  requestHeaders.set(ORIGINAL_PATH_HEADER, request.nextUrl.pathname);
  requestHeaders.set(ORIGINAL_SEARCH_HEADER, request.nextUrl.search);

  return requestHeaders;
}

export const config = {
  matcher: ["/:path*"],
};

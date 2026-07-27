import "server-only";

import { createServerClient } from "@supabase/ssr";
import type { NextRequest, NextResponse } from "next/server";
import { getSupabasePublicEnv } from "./env";
import { applySupabaseResponseHeaders } from "./response-headers";
import type { Database } from "./types";

export function createRouteHandlerClient(request: NextRequest, response: NextResponse) {
  const env = getSupabasePublicEnv();

  return createServerClient<Database>(env.url, env.anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, responseHeaders) {
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
        applySupabaseResponseHeaders(response.headers, responseHeaders);
      },
    },
  });
}

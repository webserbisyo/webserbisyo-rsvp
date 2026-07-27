import "server-only";

import { createServerClient } from "@supabase/ssr";
import { unstable_noStore as noStore } from "next/cache";
import { cookies } from "next/headers";
import { getSupabasePublicEnv } from "./env";
import type { Database } from "./types";

export async function createServerSupabaseClient() {
  // Server Components and Server Actions do not expose their outgoing Headers
  // object. Mark every cookie-backed auth read as dynamic; route handlers and
  // the request proxy apply @supabase/ssr's exact response headers directly.
  noStore();
  const env = getSupabasePublicEnv();
  const cookieStore = await cookies();

  return createServerClient<Database>(env.url, env.anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet, _responseHeaders) {
        void _responseHeaders;
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Server Component context cannot set cookies.
        }
      },
    },
  });
}

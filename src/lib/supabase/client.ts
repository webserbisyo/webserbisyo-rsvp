import { createBrowserClient } from "@supabase/ssr";
import { getSupabasePublicEnv } from "./env";
import type { Database } from "./types";

export function createClient() {
  const env = getSupabasePublicEnv();

  return createBrowserClient<Database>(env.url, env.anonKey);
}

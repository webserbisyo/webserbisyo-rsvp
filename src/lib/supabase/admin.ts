import "server-only";

import { createClient } from "@supabase/supabase-js";
import { getSupabaseSecretEnv } from "./secret-env";
import type { Database } from "./types";

export function createAdminClient() {
  const env = getSupabaseSecretEnv();

  return createClient<Database>(env.url, env.serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

import "server-only";

import { getSupabasePublicEnv, readRequiredEnv } from "./env";

type SupabaseSecretEnv = ReturnType<typeof getSupabasePublicEnv> & {
  serviceRoleKey: string;
};

export function getSupabaseSecretEnv(): SupabaseSecretEnv {
  return {
    ...getSupabasePublicEnv(),
    serviceRoleKey: readRequiredEnv(
      "SUPABASE_SERVICE_ROLE_KEY or SUPABASE_SECRET_KEY",
      process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SECRET_KEY,
    ),
  };
}

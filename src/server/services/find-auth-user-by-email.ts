import "server-only";

import type { User } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";
import { ServiceError } from "./service-error";

const USERS_PER_PAGE = 1_000;
const MAX_PAGES = 100;

export function normalizeAuthEmail(email: string) {
  return email.trim().toLowerCase();
}

export function escapePostgrestLikePattern(value: string) {
  return value.replaceAll("\\", "\\\\").replaceAll("%", "\\%").replaceAll("_", "\\_");
}

export async function findUniqueAuthUserByEmail(email: string): Promise<User | null> {
  const normalizedEmail = normalizeAuthEmail(email);
  const adminSupabase = createAdminClient();
  const matches: User[] = [];

  for (let page = 1; page <= MAX_PAGES; page += 1) {
    const { data, error } = await adminSupabase.auth.admin.listUsers({
      page,
      perPage: USERS_PER_PAGE,
    });

    if (error) {
      throw new ServiceError("The linked authentication account could not be checked.");
    }

    for (const user of data.users) {
      if (user.email && normalizeAuthEmail(user.email) === normalizedEmail) {
        matches.push(user);
      }
    }

    if (matches.length > 1) {
      throw new ServiceError(
        "Multiple authentication accounts use this normalized email. Manual repair is required.",
      );
    }

    if (data.users.length < USERS_PER_PAGE) {
      return matches[0] ?? null;
    }
  }

  throw new ServiceError(
    "Authentication account lookup exceeded its safe page limit. Manual review is required.",
  );
}

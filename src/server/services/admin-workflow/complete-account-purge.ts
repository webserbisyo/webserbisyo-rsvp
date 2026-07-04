import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import type { Tables } from "@/lib/supabase/types";
import type { CompleteTestAccountPurgeInput } from "@/lib/validations/admin-workflow.schema";
import { ServiceError, assertServiceSuccess } from "@/server/services/service-error";
import { writeAuditLog } from "@/server/services/write-audit-log";
import { bulkPurgeTestData } from "./client-purge";

type AuthUserLite = {
  email: string | null;
  id: string;
};

type ProfileRecord = Tables<"profiles">;

export type CompleteAccountPurgeResultItem = {
  appRecordsPurged: boolean;
  authDeleted: boolean;
  authUserId: string | null;
  clientIds: string[];
  email: string;
  message: string;
  reasonCode: string;
  status: "auth_deleted" | "blocked" | "failed";
  tablesCleaned: string[];
};

export type CompleteAccountPurgeResult = {
  appRecordsPurgedCount: number;
  authDeletedCount: number;
  blockedCount: number;
  failedCount: number;
  results: CompleteAccountPurgeResultItem[];
  selectedCount: number;
  total: number;
};

export async function completeTestAccountPurge(
  input: CompleteTestAccountPurgeInput,
  actorUserId: string,
): Promise<CompleteAccountPurgeResult> {
  const supabase = createAdminClient();
  const emails = uniqueNormalizedEmails(input.emails);
  const users = await listAuthUsersByEmail(supabase, emails);
  const actorProfile = await loadProfileRole(actorUserId);

  if (actorProfile?.role !== "platform_admin" || actorProfile.is_active !== true) {
    throw new ServiceError("Platform admin access is required for complete account purge.");
  }

  const result: CompleteAccountPurgeResult = {
    appRecordsPurgedCount: 0,
    authDeletedCount: 0,
    blockedCount: 0,
    failedCount: 0,
    results: [],
    selectedCount: emails.length,
    total: emails.length,
  };

  for (const email of emails) {
    const authUser = users.get(email) ?? null;

    if (!authUser) {
      result.failedCount += 1;
      result.results.push({
        appRecordsPurged: false,
        authDeleted: false,
        authUserId: null,
        clientIds: [],
        email,
        message: "No Supabase Auth user exists for this email.",
        reasonCode: "auth_user_not_found",
        status: "failed",
        tablesCleaned: [],
      });
      continue;
    }

    if (authUser.id === actorUserId) {
      result.blockedCount += 1;
      result.results.push({
        appRecordsPurged: false,
        authDeleted: false,
        authUserId: authUser.id,
        clientIds: [],
        email,
        message: "You cannot delete the currently signed-in platform admin account.",
        reasonCode: "self_delete_blocked",
        status: "blocked",
        tablesCleaned: [],
      });
      continue;
    }

    const profile = await loadProfileRole(authUser.id);
    const originalProfile = profile ? cloneProfile(profile) : null;

    if (profile?.role === "platform_admin") {
      result.blockedCount += 1;
      result.results.push({
        appRecordsPurged: false,
        authDeleted: false,
        authUserId: authUser.id,
        clientIds: [],
        email,
        message: "Platform admin accounts cannot be deleted through complete account purge.",
        reasonCode: "platform_admin_target",
        status: "blocked",
        tablesCleaned: [],
      });
      continue;
    }

    const linkedClientIds = await resolveLinkedClientIds(email, profile?.client_id ?? null);
    let appRecordsPurged = false;
    const tablesCleaned = new Set<string>();

    if (linkedClientIds.length > 0) {
      const purgeResult = await bulkPurgeTestData(
        {
          clientIds: linkedClientIds,
          confirmation: "DELETE TEST DATA",
          note: `Complete account purge: ${input.note}`,
        },
        actorUserId,
      );

      result.appRecordsPurgedCount += purgeResult.purgedCount;

      if (purgeResult.blockedCount > 0) {
        result.blockedCount += 1;
        result.results.push({
          appRecordsPurged: false,
          authDeleted: false,
          authUserId: authUser.id,
          clientIds: linkedClientIds,
          email,
          message: purgeResult.results.find((item) => item.status === "blocked")?.message ??
            "Linked client data remains blocked from purge.",
          reasonCode:
            purgeResult.results.find((item) => item.status === "blocked")?.reasonCode ??
            "linked_client_blocked",
          status: "blocked",
          tablesCleaned: [],
        });
        continue;
      }

      if (purgeResult.failedCount > 0 || purgeResult.purgedCount !== linkedClientIds.length) {
        result.failedCount += 1;
        result.results.push({
          appRecordsPurged: false,
          authDeleted: false,
          authUserId: authUser.id,
          clientIds: linkedClientIds,
          email,
          message:
            purgeResult.results.find((item) => item.status === "failed")?.message ??
            "Linked client purge did not complete successfully.",
          reasonCode:
            purgeResult.results.find((item) => item.status === "failed")?.reasonCode ??
            "linked_client_purge_failed",
          status: "failed",
          tablesCleaned: [],
        });
        continue;
      }

      appRecordsPurged = purgeResult.purgedCount > 0;
      if (appRecordsPurged) {
        tablesCleaned.add("clients");
        tablesCleaned.add("rsvp_events");
        tablesCleaned.add("payments");
        tablesCleaned.add("meta_pixels");
        tablesCleaned.add("client_deletion_tombstones");
      }
    }

    await safeWriteAuditLog({
      action: "auth_user_test_account_purge_requested",
      actorUserId,
      clientId: null,
      entityId: authUser.id,
      entityType: "auth.users",
      eventId: null,
      metadata: {
        email,
        linked_client_ids: linkedClientIds,
        note: input.note,
        purge_mode: "complete_account_purge",
      },
    });

    if (profile) {
      const { error: profileDeleteError } = await supabase
        .from("profiles")
        .delete()
        .eq("id", profile.id);

      assertServiceSuccess(profileDeleteError, "Failed to delete the linked profile.");
      tablesCleaned.add("profiles");
      tablesCleaned.add("notification_preferences");
      tablesCleaned.add("push_subscriptions");
    }

    const { error: authDeleteError } = await supabase.auth.admin.deleteUser(authUser.id);

    if (authDeleteError) {
      if (originalProfile) {
        await restoreProfile(originalProfile);
      }

      result.failedCount += 1;
      result.results.push({
        appRecordsPurged,
        authDeleted: false,
        authUserId: authUser.id,
        clientIds: linkedClientIds,
        email,
        message: getAuthDeleteFailureMessage(authDeleteError.message),
        reasonCode: "auth_delete_failed",
        status: "failed",
        tablesCleaned: Array.from(tablesCleaned),
      });
      continue;
    }

    await safeWriteAuditLog({
      action: "auth_user_test_account_purged",
      actorUserId,
      clientId: null,
      entityId: authUser.id,
      entityType: "auth.users",
      eventId: null,
      metadata: {
        app_records_purged: appRecordsPurged,
        email,
        linked_client_ids: linkedClientIds,
        note: input.note,
        purge_mode: "complete_account_purge",
        tables_cleaned: Array.from(tablesCleaned),
      },
    });

    result.authDeletedCount += 1;
    result.results.push({
      appRecordsPurged,
      authDeleted: true,
      authUserId: authUser.id,
      clientIds: linkedClientIds,
      email,
      message:
        "Auth user deleted after linked test client data and blocking profile references were cleaned.",
      reasonCode: "auth_deleted",
      status: "auth_deleted",
      tablesCleaned: Array.from(tablesCleaned),
    });
  }

  return result;
}

async function listAuthUsersByEmail(
  supabase: ReturnType<typeof createAdminClient>,
  emails: string[],
) {
  const targets = new Set(emails);
  const results = new Map<string, AuthUserLite>();
  let page = 1;
  const perPage = 200;

  while (results.size < targets.size) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage });

    if (error) {
      throw new ServiceError("Failed to load Supabase Auth users for complete account purge.");
    }

    const users = data.users ?? [];
    for (const user of users) {
      const normalizedEmail = user.email?.trim().toLowerCase();
      if (normalizedEmail && targets.has(normalizedEmail) && !results.has(normalizedEmail)) {
        results.set(normalizedEmail, {
          email: user.email ?? null,
          id: user.id,
        });
      }
    }

    if (users.length < perPage) {
      break;
    }

    page += 1;
  }

  return results;
}

async function loadProfileRole(profileId: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", profileId)
    .maybeSingle();

  if (error) {
    throw new ServiceError("Failed to load the linked profile.");
  }

  return data;
}

async function resolveLinkedClientIds(email: string, profileClientId: string | null) {
  const supabase = createAdminClient();
  const clientIds = new Set<string>();

  if (profileClientId) {
    clientIds.add(profileClientId);
  }

  const { data, error } = await supabase
    .from("clients")
    .select("id")
    .ilike("contact_email", email)
    .limit(5);

  if (error) {
    throw new ServiceError("Failed to resolve linked clients for complete account purge.");
  }

  for (const row of data ?? []) {
    clientIds.add(row.id);
  }

  return Array.from(clientIds);
}

function uniqueNormalizedEmails(emails: string[]) {
  return Array.from(new Set(emails.map((email) => email.trim().toLowerCase()).filter(Boolean)));
}

function cloneProfile(profile: ProfileRecord): ProfileRecord {
  return {
    client_id: profile.client_id,
    created_at: profile.created_at,
    email: profile.email,
    full_name: profile.full_name,
    id: profile.id,
    is_active: profile.is_active,
    role: profile.role,
    updated_at: profile.updated_at,
  };
}

function getAuthDeleteFailureMessage(message?: string | null) {
  const normalized = message?.toLowerCase() ?? "";

  if (normalized.includes("database error deleting user")) {
    return "Supabase Auth deletion still reports a database-side blocker after cleanup.";
  }

  if (normalized.includes("storage")) {
    return "Supabase Auth deletion is blocked because the user still owns storage objects.";
  }

  return "Supabase Auth user deletion failed.";
}

async function safeWriteAuditLog(input: Parameters<typeof writeAuditLog>[0]) {
  try {
    await writeAuditLog(input);
  } catch {
    return null;
  }

  return null;
}

async function restoreProfile(profile: ProfileRecord) {
  const supabase = createAdminClient();
  const { error } = await supabase.from("profiles").upsert(profile, {
    onConflict: "id",
  });

  if (error) {
    throw new ServiceError("Failed to restore the linked profile after auth deletion failed.");
  }
}

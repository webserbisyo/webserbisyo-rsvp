import "server-only";

import { EVENT_WEBSITE_GIFT_MEDIA_BUCKET } from "@/lib/event-website/gift-media";
import { createAdminClient } from "@/lib/supabase/admin";
import type { PermanentDeleteClientsInput } from "@/lib/validations/admin-workflow.schema";

export type PermanentDeleteStage =
  | "lookup"
  | "storage_delete"
  | "auth_delete"
  | "database_purge"
  | "verification"
  | "not_found";

export type PermanentDeleteResult = {
  failed: Array<{
    clientId: string;
    message: string;
    stage: PermanentDeleteStage;
  }>;
  succeeded: Array<{ clientId: string }>;
  total: number;
};

type RpcResult = {
  client_id: string;
  deleted: boolean;
  status: "deleted" | "not_found";
};

const STORAGE_ROOT = "event-website-gifts";

export async function deleteClientsPermanently(
  input: PermanentDeleteClientsInput,
): Promise<PermanentDeleteResult> {
  const result: PermanentDeleteResult = {
    failed: [],
    succeeded: [],
    total: input.clientIds.length,
  };

  for (const clientId of input.clientIds) {
    const failure = await deleteClientPermanently(clientId);

    if (failure) {
      result.failed.push({ clientId, ...failure });
    } else {
      result.succeeded.push({ clientId });
    }
  }

  return result;
}

async function deleteClientPermanently(clientId: string) {
  const supabase = createAdminClient();
  const { data: client, error: clientError } = await supabase
    .from("clients")
    .select("id")
    .eq("id", clientId)
    .maybeSingle();

  if (clientError) {
    return fail("lookup", "Client records could not be loaded.", clientError);
  }

  if (!client) {
    return fail("not_found", "Client no longer exists.");
  }

  const { data: profiles, error: profileError } = await supabase
    .from("profiles")
    .select("id")
    .eq("client_id", clientId);

  if (profileError) {
    return fail("lookup", "Linked login accounts could not be loaded.", profileError);
  }

  const profileIds = (profiles ?? []).map((profile) => profile.id);
  const storageError = await deleteClientStorage(clientId);

  if (storageError) {
    return fail("storage_delete", "Linked storage objects could not be deleted.", storageError);
  }

  for (const profileId of profileIds) {
    const { error } = await supabase.auth.admin.deleteUser(profileId);

    if (error && !isMissingAuthUser(error)) {
      return fail("auth_delete", "A linked login account could not be deleted.", error);
    }
  }

  const { data: purgeData, error: purgeError } = await supabase.rpc(
    "admin_purge_client_permanently",
    {
      p_client_id: clientId,
      p_profile_ids: profileIds,
    },
  );

  if (purgeError) {
    return fail("database_purge", "Client database records could not be deleted.", purgeError);
  }

  const purgeResult = purgeData as RpcResult | null;
  if (!purgeResult?.deleted) {
    const stage = purgeResult?.status === "not_found" ? "not_found" : "database_purge";
    return fail(
      stage,
      stage === "not_found"
        ? "Client no longer exists."
        : "Client database cleanup did not complete.",
    );
  }

  const verificationError = await verifyPermanentDeletion(clientId, profileIds);
  if (verificationError) {
    return fail("verification", verificationError);
  }

  logDeletion("complete");
  return null;
}

async function deleteClientStorage(clientId: string) {
  const supabase = createAdminClient();
  const bucket = supabase.storage.from(EVENT_WEBSITE_GIFT_MEDIA_BUCKET);
  const root = `${STORAGE_ROOT}/${clientId}`;
  const paths: string[] = [];
  const pending = [root];

  while (pending.length > 0) {
    const prefix = pending.pop();
    if (!prefix) continue;

    const { data, error } = await bucket.list(prefix, { limit: 1000 });
    if (error) {
      if (isMissingStorageResource(error)) return null;
      return error;
    }

    for (const item of data ?? []) {
      const itemPath = `${prefix}/${item.name}`;
      if (item.id) paths.push(itemPath);
      else pending.push(itemPath);
    }
  }

  for (let index = 0; index < paths.length; index += 100) {
    const { error } = await bucket.remove(paths.slice(index, index + 100));
    if (error && !isMissingStorageResource(error)) return error;
  }

  return null;
}

async function verifyPermanentDeletion(clientId: string, profileIds: string[]) {
  const supabase = createAdminClient();
  const checks = await Promise.all([
    supabase.from("clients").select("id", { count: "exact", head: true }).eq("id", clientId),
    supabase
      .from("rsvp_events")
      .select("id", { count: "exact", head: true })
      .eq("client_id", clientId),
    supabase
      .from("payments")
      .select("id", { count: "exact", head: true })
      .eq("client_id", clientId),
    supabase
      .from("rsvp_responses")
      .select("id", { count: "exact", head: true })
      .eq("client_id", clientId),
    supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("client_id", clientId),
  ]);

  if (checks.some((check) => check.error || (check.count ?? 0) > 0)) {
    return "Deleted records are still present after database cleanup.";
  }

  for (const profileId of profileIds) {
    const { data, error } = await supabase.auth.admin.getUserById(profileId);
    if (!error && data.user) return "A linked login account is still present after deletion.";
    if (error && !isMissingAuthUser(error)) return "A linked login account could not be verified.";
  }

  return null;
}

function isMissingAuthUser(error: { code?: string; message?: string; status?: number }) {
  const message = error.message?.toLowerCase() ?? "";
  return (
    error.status === 404 || error.code === "user_not_found" || message.includes("user not found")
  );
}

function isMissingStorageResource(error: { message?: string; statusCode?: string }) {
  const message = error.message?.toLowerCase() ?? "";
  return (
    error.statusCode === "404" ||
    message.includes("not found") ||
    message.includes("does not exist")
  );
}

function fail(stage: PermanentDeleteStage, message: string, error?: unknown) {
  logDeletion(stage, error);
  return { message, stage };
}

function logDeletion(stage: string, error?: unknown) {
  const details = getSafeErrorDetails(error);
  const entry = {
    operation: "permanent_client_delete",
    clientCount: 1,
    stage,
    ...details,
  };

  if (error) console.error(entry);
  else console.info(entry);
}

function getSafeErrorDetails(error: unknown) {
  if (!error || typeof error !== "object") return {};
  const value = error as { code?: unknown; constraint?: unknown; details?: unknown };
  return {
    code: typeof value.code === "string" ? value.code : undefined,
    constraint: typeof value.constraint === "string" ? value.constraint : undefined,
  };
}

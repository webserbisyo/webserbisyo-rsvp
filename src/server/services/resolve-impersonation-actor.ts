import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { writeAuditLog } from "./write-audit-log";

export type ResolvedRpcActor = {
  /** The profile ID to pass as p_actor_user_id to the Postgres RPC. */
  rpcActorUserId: string;
  /** Whether the current session is an admin masquerade. */
  isImpersonating: boolean;
  /** The real admin profile ID (only set when impersonating). */
  realAdminUserId: string | null;
};

/**
 * Resolves the correct p_actor_user_id for Postgres RPCs that enforce
 * tenant membership checks (save_event_website_draft_revision,
 * publish_event_website_revision).
 *
 * When a Super Admin is masquerading (Approach 2 — zero DB migrations),
 * the Postgres RPC rejects `platform_admin` actor IDs because their
 * profile has `client_id = NULL`. This helper resolves the client's
 * primary `client_owner` profile ID to use as the RPC actor, while
 * preserving the admin's real identity for audit logging.
 */
export async function resolveRpcActorForClient(
  actorUserId: string,
  clientId: string,
  isImpersonating?: boolean,
  realAdminUserId?: string,
): Promise<ResolvedRpcActor> {
  if (!isImpersonating) {
    return {
      isImpersonating: false,
      realAdminUserId: null,
      rpcActorUserId: actorUserId,
    };
  }

  const supabase = createAdminClient();
  const { data: ownerProfile, error } = await supabase
    .from("profiles")
    .select("id")
    .eq("client_id", clientId)
    .eq("role", "client_owner")
    .eq("is_active", true)
    .limit(1)
    .maybeSingle();

  if (error || !ownerProfile) {
    // Fallback: try client_staff if no client_owner exists
    const { data: staffProfile, error: staffError } = await supabase
      .from("profiles")
      .select("id")
      .eq("client_id", clientId)
      .eq("role", "client_staff")
      .eq("is_active", true)
      .limit(1)
      .maybeSingle();

    if (staffError || !staffProfile) {
      throw new Error(
        `No active tenant profile found for client ${clientId}. Cannot delegate RPC actor for impersonation.`,
      );
    }

    return {
      isImpersonating: true,
      realAdminUserId: realAdminUserId ?? actorUserId,
      rpcActorUserId: staffProfile.id,
    };
  }

  return {
    isImpersonating: true,
    realAdminUserId: realAdminUserId ?? actorUserId,
    rpcActorUserId: ownerProfile.id,
  };
}

/**
 * Records an impersonation audit log entry when an admin performs
 * a write operation while masquerading as a client.
 */
export async function logImpersonatedAction(
  action: string,
  resolved: ResolvedRpcActor,
  context: {
    clientId: string;
    entityId?: string;
    entityType: string;
    eventId?: string;
    extraMetadata?: Record<string, unknown>;
  },
) {
  if (!resolved.isImpersonating || !resolved.realAdminUserId) {
    return;
  }

  await writeAuditLog({
    action,
    actorUserId: resolved.realAdminUserId,
    clientId: context.clientId,
    entityId: context.entityId,
    entityType: context.entityType,
    eventId: context.eventId,
    metadata: {
      delegated_actor_user_id: resolved.rpcActorUserId,
      impersonated: true,
      ...context.extraMetadata,
    },
  });
}

import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import type { Json, TablesInsert } from "@/lib/supabase/types";
import { assertServiceData, assertServiceSuccess } from "./service-error";

export type WriteAuditLogInput = {
  action: string;
  actorUserId?: string | null;
  clientId?: string | null;
  entityId?: string | null;
  entityType: string;
  eventId?: string | null;
  metadata?: Json;
};

export async function writeAuditLog(input: WriteAuditLogInput) {
  const supabase = createAdminClient();
  const row: TablesInsert<"audit_logs"> = {
    action: input.action,
    actor_user_id: input.actorUserId ?? null,
    client_id: input.clientId ?? null,
    entity_id: input.entityId ?? null,
    entity_type: input.entityType,
    event_id: input.eventId ?? null,
    metadata: input.metadata ?? {},
  };

  const { data, error } = await supabase.from("audit_logs").insert(row).select("*").single();

  assertServiceSuccess(error, "Failed to write audit log.");
  assertServiceData(data, "Audit log insert returned no row.");

  return data;
}

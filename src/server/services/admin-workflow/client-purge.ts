import "server-only";

import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Json } from "@/lib/supabase/types";
import type { BulkPurgeTestClientsInput } from "@/lib/validations/admin-workflow.schema";
import { ServiceError, assertServiceSuccess } from "@/server/services/service-error";
import { writeAuditLog } from "@/server/services/write-audit-log";

const PurgeTestClientCountsSchema = z.object({
  event_content_deleted: z.number().int().nonnegative(),
  events: z.number().int().nonnegative(),
  hosting_rows_disabled_or_unlinked: z.number().int().nonnegative(),
  meta_pixels_deleted: z.number().int().nonnegative(),
  payments_unlinked: z.number().int().nonnegative(),
  responses_blocked: z.number().int().nonnegative(),
});

const PurgeTestClientResultSchema = z.object({
  client_id: z.uuid(),
  client_name: z.string().nullable(),
  counts: PurgeTestClientCountsSchema,
  message: z.string(),
  reason_code: z.string(),
  status: z.enum(["purged", "blocked", "failed"]),
});

const PurgeTestClientsRpcResultSchema = z.object({
  blocked_count: z.number().int().nonnegative(),
  failed_count: z.number().int().nonnegative(),
  per_client_results: z.array(PurgeTestClientResultSchema),
  purged_count: z.number().int().nonnegative(),
  selected_count: z.number().int().nonnegative(),
});

export type PurgeTestDataClientResult = {
  clientId: string;
  clientName: string | null;
  counts: {
    eventContentDeleted: number;
    events: number;
    hostingRowsDisabledOrUnlinked: number;
    metaPixelsDeleted: number;
    paymentsUnlinked: number;
    responsesBlocked: number;
  };
  message: string;
  reasonCode: string;
  status: "blocked" | "failed" | "purged";
};

export type BulkPurgeTestDataActionResult = {
  blockedCount: number;
  failedCount: number;
  purgedCount: number;
  results: PurgeTestDataClientResult[];
  selectedCount: number;
  total: number;
};

export async function bulkPurgeTestData(
  input: BulkPurgeTestClientsInput,
  actorUserId: string,
): Promise<BulkPurgeTestDataActionResult> {
  const supabase = createAdminClient();
  const clientIds = Array.from(new Set(input.clientIds));
  const { data, error } = await supabase.rpc("admin_purge_test_clients", {
    p_actor_user_id: actorUserId,
    p_client_ids: clientIds,
    p_confirmation: input.confirmation,
    p_note: input.note,
  });

  assertServiceSuccess(error, "Failed to purge linked test client data.");

  const parsed = PurgeTestClientsRpcResultSchema.safeParse(data);
  if (!parsed.success) {
    throw new ServiceError("Purge test data returned an unexpected result.");
  }

  const result: BulkPurgeTestDataActionResult = {
    blockedCount: parsed.data.blocked_count,
    failedCount: parsed.data.failed_count,
    purgedCount: parsed.data.purged_count,
    results: parsed.data.per_client_results.map((item) => ({
      clientId: item.client_id,
      clientName: item.client_name,
      counts: {
        eventContentDeleted: item.counts.event_content_deleted,
        events: item.counts.events,
        hostingRowsDisabledOrUnlinked: item.counts.hosting_rows_disabled_or_unlinked,
        metaPixelsDeleted: item.counts.meta_pixels_deleted,
        paymentsUnlinked: item.counts.payments_unlinked,
        responsesBlocked: item.counts.responses_blocked,
      },
      message: item.message,
      reasonCode: item.reason_code,
      status: item.status,
    })),
    selectedCount: parsed.data.selected_count,
    total: parsed.data.selected_count,
  };

  await Promise.all(
    result.results
      .filter((item) => item.status === "purged")
      .map((item) =>
        safeWriteAuditLog({
          action: "client_test_data_purged",
          actorUserId,
          clientId: null,
          entityId: item.clientId,
          entityType: "clients",
          eventId: null,
          metadata: {
            counts: item.counts as Json,
            message: item.message,
            note: input.note,
            purge_mode: "purge_test_data",
            reason_code: item.reasonCode,
          },
        }),
      ),
  );

  return result;
}

async function safeWriteAuditLog(input: Parameters<typeof writeAuditLog>[0]) {
  try {
    await writeAuditLog(input);
  } catch {
    return null;
  }

  return null;
}

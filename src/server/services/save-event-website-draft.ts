import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import type { EventWebsiteContent } from "@/lib/event-website/types";
import type { Json, TablesInsert } from "@/lib/supabase/types";
import { assertServiceData, assertServiceSuccess } from "./service-error";
import { writeAuditLog } from "./write-audit-log";

export type SaveEventWebsiteDraftInput = {
  actorUserId: string;
  clientId: string;
  content: EventWebsiteContent;
  eventId: string;
};

export async function saveEventWebsiteDraft(input: SaveEventWebsiteDraftInput) {
  const supabase = createAdminClient();
  const row: TablesInsert<"event_content"> = {
    content_json: input.content as unknown as Json,
    event_id: input.eventId,
  };

  const { data: content, error } = await supabase
    .from("event_content")
    .upsert(row, { onConflict: "event_id" })
    .select("id, event_id")
    .single();

  assertServiceSuccess(error, "Failed to save Event Website draft.");
  assertServiceData(content, "Event Website draft save returned no row.");

  await writeAuditLog({
    action: "event_website_draft_saved",
    actorUserId: input.actorUserId,
    clientId: input.clientId,
    entityId: content.id,
    entityType: "event_content",
    eventId: input.eventId,
    metadata: {
      enabledSectionCount: Object.values(input.content.layout.enabledSections).filter(Boolean).length,
      eventType: input.content.eventType,
      version: input.content.version,
    },
  });

  return content;
}

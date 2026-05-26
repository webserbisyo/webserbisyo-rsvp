import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import type { Tables } from "@/lib/supabase/types";
import type { EventWebsiteGuestbookMessage } from "@/lib/event-website/types";
import { ServiceError } from "./service-error";

type ApprovedGuestbookRow = Pick<
  Tables<"rsvp_responses">,
  "guest_name" | "id" | "message" | "message_approved_at" | "submitted_at"
>;

export async function listApprovedGuestbookMessages(input: {
  clientId?: string | null;
  eventId: string;
}): Promise<EventWebsiteGuestbookMessage[]> {
  const supabase = createAdminClient();
  let query = supabase
    .from("rsvp_responses")
    .select("id, guest_name, message, message_approved_at, submitted_at")
    .eq("event_id", input.eventId)
    .eq("message_public_status", "approved")
    .is("archived_at", null)
    .not("message", "is", null)
    .order("message_approved_at", { ascending: true, nullsFirst: false })
    .order("submitted_at", { ascending: true, nullsFirst: false })
    .order("id", { ascending: true });

  if (input.clientId) {
    query = query.eq("client_id", input.clientId);
  }

  const { data, error } = await query;

  if (error) {
    throw new ServiceError("Failed to load approved Guestbook messages.", error);
  }

  return ((data ?? []) as ApprovedGuestbookRow[])
    .map((row) => ({
      approvedAt: row.message_approved_at,
      guestName: row.guest_name.trim(),
      id: row.id,
      message: row.message?.trim() ?? "",
      submittedAt: row.submitted_at,
    }))
    .filter((row) => row.guestName.length > 0 && row.message.length > 0);
}

import "server-only";

import { requireAdmin } from "@/lib/permissions";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function getAdminClients() {
  await requireAdmin();
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("clients")
    .select(
      `
        id,
        name,
        contact_email,
        contact_name,
        status,
        plan_type,
        hosting_starts_at,
        hosting_ends_at,
        renewal_required_at,
        created_at,
        rsvp_events (
          id,
          event_slug,
          title,
          status,
          visibility
        )
      `,
    )
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return data;
}

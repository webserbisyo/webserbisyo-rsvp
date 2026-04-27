import "server-only";

import { requireTenantMember } from "@/lib/permissions";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function getDashboardSummary() {
  const profile = await requireTenantMember();
  const supabase = await createServerSupabaseClient();
  const clientId = profile.client_id;

  if (!clientId) {
    throw new Error("Client tenant profile is missing client_id.");
  }

  const [{ data: client, error: clientError }, { data: events, error: eventError }] =
    await Promise.all([
      supabase
        .from("clients")
        .select("id, name, status, plan_type, hosting_starts_at, hosting_ends_at")
        .eq("id", clientId)
        .single(),
      supabase
        .from("rsvp_events")
        .select("id, event_slug, title, status, visibility")
        .eq("client_id", clientId)
        .order("created_at", { ascending: false }),
    ]);

  if (clientError) {
    throw clientError;
  }

  if (eventError) {
    throw eventError;
  }

  return {
    client,
    events,
    profile: {
      email: profile.email,
      fullName: profile.full_name,
      role: profile.role,
    },
  };
}

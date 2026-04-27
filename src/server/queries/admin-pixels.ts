import "server-only";

import { requireAdmin } from "@/lib/permissions";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function getAdminPixels() {
  await requireAdmin();
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("meta_pixels")
    .select(
      `
        id,
        client_id,
        event_id,
        pixel_id,
        is_active,
        tracking_scope,
        created_at,
        updated_at
      `,
    )
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return data;
}

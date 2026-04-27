import "server-only";

import { requireAdmin } from "@/lib/permissions";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function getAdminSales() {
  await requireAdmin();
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("payments")
    .select(
      `
        id,
        amount_due,
        amount_paid,
        currency,
        payment_status,
        payment_method,
        reference_number,
        paid_at,
        hosting_starts_at,
        hosting_ends_at,
        created_at,
        clients (
          id,
          name,
          contact_email,
          plan_type
        ),
        rsvp_applications (
          id,
          full_name,
          email,
          preferred_plan
        )
      `,
    )
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return data;
}

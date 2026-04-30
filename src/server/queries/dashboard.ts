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

  const [
    { data: client, error: clientError },
    { data: events, error: eventError },
    { data: payments, error: paymentError },
    { data: onboardingEmails, error: onboardingError },
  ] = await Promise.all([
    supabase
      .from("clients")
      .select(
        "id, name, status, plan_type, hosting_starts_at, hosting_ends_at, custom_frontend_status, custom_frontend_url",
      )
      .eq("id", clientId)
      .single(),
    supabase
      .from("rsvp_events")
      .select("id, event_slug, title, event_type, event_date, status, visibility")
      .eq("client_id", clientId)
      .order("created_at", { ascending: false }),
    supabase
      .from("payments")
      .select("id, amount_paid, currency, paid_at, payment_status, updated_at")
      .eq("client_id", clientId)
      .order("updated_at", { ascending: false })
      .limit(1),
    supabase
      .from("email_logs")
      .select("id, sent_at, status, updated_at")
      .eq("client_id", clientId)
      .eq("email_type", "client_onboarding")
      .order("updated_at", { ascending: false })
      .limit(1),
  ]);

  if (clientError) {
    throw clientError;
  }

  if (eventError) {
    throw eventError;
  }

  if (paymentError) {
    throw paymentError;
  }

  if (onboardingError) {
    throw onboardingError;
  }

  return {
    client,
    event: events?.[0] ?? null,
    onboardingEmail: onboardingEmails?.[0] ?? null,
    payment: payments?.[0] ?? null,
    profile: {
      email: profile.email,
      fullName: profile.full_name,
      role: profile.role,
    },
  };
}

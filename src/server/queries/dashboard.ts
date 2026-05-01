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
    { data: applications, error: applicationError },
  ] = await Promise.all([
    supabase
      .from("clients")
      .select(
        "id, name, contact_email, contact_name, status, plan_type, hosting_starts_at, hosting_ends_at, custom_frontend_status, custom_frontend_url",
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
      .select(
        "id, amount_due, amount_paid, currency, paid_at, payment_method, payment_status, updated_at",
      )
      .eq("client_id", clientId)
      .order("updated_at", { ascending: false })
      .limit(1),
    supabase
      .from("email_logs")
      .select("id, recipient_email, sent_at, status, subject, updated_at")
      .eq("client_id", clientId)
      .eq("email_type", "client_onboarding")
      .order("updated_at", { ascending: false })
      .limit(1),
    supabase
      .from("rsvp_applications")
      .select("id, event_location, full_name")
      .eq("approved_client_id", clientId)
      .order("approved_at", { ascending: false })
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

  if (applicationError) {
    throw applicationError;
  }

  return {
    application: applications?.[0] ?? null,
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

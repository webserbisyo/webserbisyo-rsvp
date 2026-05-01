import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { sendPasswordResetEmail } from "./send-password-reset-email";

export async function requestClientPasswordReset(email: string) {
  const normalizedEmail = email.trim().toLowerCase();

  if (!normalizedEmail) {
    return;
  }

  const supabase = createAdminClient();
  const { data: profiles, error: profileError } = await supabase
    .from("profiles")
    .select("client_id, email, full_name, id, is_active, role")
    .eq("email", normalizedEmail)
    .eq("is_active", true)
    .in("role", ["client_owner", "client_staff"])
    .limit(5);

  if (profileError || !profiles?.length) {
    return;
  }

  const profile = profiles.find((item) => item.client_id) ?? null;

  if (!profile?.client_id) {
    return;
  }

  const { data: users, error: usersError } = await supabase.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  });

  if (usersError) {
    return;
  }

  const authUser =
    users.users.find((user) => user.id === profile.id) ??
    users.users.find((user) => user.email?.toLowerCase() === normalizedEmail) ??
    null;

  if (!authUser?.email) {
    return;
  }

  const { data: events, error: eventError } = await supabase
    .from("rsvp_events")
    .select("id")
    .eq("client_id", profile.client_id)
    .order("created_at", { ascending: false })
    .limit(1);

  if (eventError) {
    return;
  }

  const resetRedirectTo = buildResetPasswordUrl();
  const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
    type: "recovery",
    email: authUser.email,
    options: {
      redirectTo: resetRedirectTo,
    },
  });

  if (linkError || !linkData.properties.action_link) {
    return;
  }

  await sendPasswordResetEmail({
    clientId: profile.client_id,
    eventId: events?.[0]?.id ?? null,
    recipientEmail: authUser.email,
    recipientName: profile.full_name,
    resetUrl: linkData.properties.action_link,
  });
}

function buildResetPasswordUrl() {
  const baseUrl = process.env.APP_BASE_URL ?? process.env.NEXT_PUBLIC_APP_URL;

  if (!baseUrl) {
    return "/reset-password";
  }

  return `${baseUrl.replace(/\/+$/, "")}/reset-password`;
}

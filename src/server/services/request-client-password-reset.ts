import "server-only";

import { clientStatusAllowsDashboardAccess } from "@/lib/auth/client-access";
import { createAdminClient } from "@/lib/supabase/admin";
import { CLIENT_PASSWORD_RECOVERY_SUBJECT } from "@/server/email/templates/password-reset";
import {
  canRequestPasswordReset,
  withPasswordResetRequestLock,
} from "@/server/security/password-reset-rate-limit";
import { generateClientPasswordLink } from "./client-password-links";
import {
  escapePostgrestLikePattern,
  findUniqueAuthUserByEmail,
  normalizeAuthEmail,
} from "./find-auth-user-by-email";
import { sendPasswordResetEmail } from "./send-password-reset-email";
import { finalizePasswordEmailLog, queuePasswordEmailLog } from "./write-email-log";

export async function requestClientPasswordReset(
  email: string,
  options?: { clientAddress?: string | null },
) {
  const normalizedEmail = normalizeAuthEmail(email);

  if (
    !normalizedEmail ||
    !canRequestPasswordReset({
      clientAddress: options?.clientAddress,
      email: normalizedEmail,
    })
  ) {
    return;
  }

  await withPasswordResetRequestLock(normalizedEmail, async () => {
    const supabase = createAdminClient();
    const { data: profiles, error: profileError } = await supabase
      .from("profiles")
      .select("client_id, email, full_name, id, is_active, role")
      .ilike("email", escapePostgrestLikePattern(normalizedEmail))
      .eq("is_active", true)
      .in("role", ["client_owner", "client_staff"])
      .limit(2);

    if (profileError || profiles?.length !== 1) {
      return;
    }

    const profile = profiles[0];

    if (!profile?.client_id) {
      return;
    }

    const { data: client, error: clientError } = await supabase
      .from("clients")
      .select("status")
      .eq("id", profile.client_id)
      .maybeSingle();

    if (clientError || !clientStatusAllowsDashboardAccess(client?.status)) {
      return;
    }

    const authUser = await findUniqueAuthUserByEmail(normalizedEmail);

    if (
      !authUser?.email ||
      authUser.id !== profile.id ||
      normalizeAuthEmail(authUser.email) !== normalizedEmail
    ) {
      return;
    }

    const recentlySentAfter = new Date(Date.now() - 2 * 60_000).toISOString();
    const { count: recentCount, error: recentError } = await supabase
      .from("email_logs")
      .select("id", { count: "exact", head: true })
      .eq("client_id", profile.client_id)
      .eq("email_type", "client_password_recovery")
      .in("status", ["queued", "sent"])
      .gte("created_at", recentlySentAfter);

    if (recentError || (recentCount ?? 0) > 0) {
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

    const eventId = events?.[0]?.id ?? null;
    const queuedLog = await queuePasswordEmailLog({
      clientId: profile.client_id,
      emailType: "client_password_recovery",
      eventId,
      recipientEmail: authUser.email,
      recipientName: profile.full_name,
      subject: CLIENT_PASSWORD_RECOVERY_SUBJECT,
    });
    let resetUrl: string;

    try {
      resetUrl = await generateClientPasswordLink({
        authUserId: authUser.id,
        clientId: profile.client_id,
        email: authUser.email,
        eventId,
        intent: "password_recovery",
      });
    } catch (error) {
      await finalizePasswordEmailLog(queuedLog.id, {
        errorMessage: "The secure password recovery link could not be issued.",
        status: "failed",
      });
      throw error;
    }

    await sendPasswordResetEmail({
      clientId: profile.client_id,
      emailLogId: queuedLog.id,
      eventId,
      recipientEmail: authUser.email,
      recipientName: profile.full_name,
      resetUrl,
    });
  });
}

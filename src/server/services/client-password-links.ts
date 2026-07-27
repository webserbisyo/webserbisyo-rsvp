import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { normalizeAuthEmail } from "./find-auth-user-by-email";
import { ServiceError } from "./service-error";
import { writeAuditLog } from "./write-audit-log";

export type ClientPasswordLinkIntent = "password_recovery" | "password_setup";

export async function generateClientPasswordLink(input: {
  actorUserId?: string | null;
  applicationId?: string | null;
  authUserId: string;
  clientId: string;
  email: string;
  eventId?: string | null;
  intent: ClientPasswordLinkIntent;
}) {
  const supabase = createAdminClient();
  const normalizedEmail = normalizeAuthEmail(input.email);
  const { data: userData, error: userError } = await supabase.auth.admin.getUserById(
    input.authUserId,
  );

  if (
    userError ||
    !userData.user?.email ||
    normalizeAuthEmail(userData.user.email) !== normalizedEmail
  ) {
    throw new ServiceError("The linked authentication email could not be verified.");
  }

  const baseUrl = buildResetPasswordUrl();
  const { data, error } = await supabase.auth.admin.generateLink({
    type: "recovery",
    email: userData.user.email,
    options: {
      redirectTo: baseUrl,
    },
  });

  const hashedToken = data?.properties?.hashed_token;
  const actionLink = data?.properties?.action_link;

  let tokenHash = hashedToken;
  if (!tokenHash && actionLink) {
    try {
      const parsed = new URL(actionLink);
      tokenHash = parsed.searchParams.get("token") || parsed.searchParams.get("token_hash") || undefined;
    } catch {
      // fallback
    }
  }

  if (error || !tokenHash) {
    throw new ServiceError("The secure password link could not be generated.");
  }

  await writeAuditLog({
    action:
      input.intent === "password_setup"
        ? "client_password_setup_link_issued"
        : "client_password_recovery_link_issued",
    actorUserId: input.actorUserId ?? null,
    clientId: input.clientId,
    entityId: input.authUserId,
    entityType: "auth_user",
    eventId: input.eventId ?? null,
    metadata: {
      application_id: input.applicationId ?? null,
      issuance_reason: input.intent,
    },
  });

  const confirmUrl = new URL("/auth/confirm", baseUrl);
  confirmUrl.searchParams.set("token_hash", tokenHash);
  confirmUrl.searchParams.set("type", "recovery");
  confirmUrl.searchParams.set("next", "/reset-password");
  if (input.intent === "password_setup") {
    confirmUrl.searchParams.set("intent", "password_setup");
  }

  return confirmUrl.toString();
}

function buildResetPasswordUrl() {
  const configuredBaseUrl = process.env.APP_BASE_URL ?? process.env.NEXT_PUBLIC_APP_URL;

  if (!configuredBaseUrl) {
    throw new ServiceError("The application URL is not configured for secure password links.");
  }

  let baseUrl: URL;

  try {
    baseUrl = new URL(configuredBaseUrl);
  } catch {
    throw new ServiceError("The application URL is invalid for secure password links.");
  }

  const isLocalhost = baseUrl.hostname === "localhost" || baseUrl.hostname === "127.0.0.1";

  if (baseUrl.protocol !== "https:" && !(isLocalhost && baseUrl.protocol === "http:")) {
    throw new ServiceError("The application URL is not trusted for secure password links.");
  }

  return new URL("/reset-password", baseUrl).toString();
}

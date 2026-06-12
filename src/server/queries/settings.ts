import "server-only";

import { formatUserRoleLabel } from "@/lib/auth/role-labels";
import { requireTenantMember } from "@/lib/permissions";
import { createAdminClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  NOTIFICATION_EVENT_TYPES,
  type NotificationEventType,
  type PushSubscriptionStatus,
  type SettingsNotificationPreference,
} from "@/types/notifications";

export type SettingsPageData = {
  account: {
    email: string | null;
    initials: string;
    name: string | null;
    planLabel: string;
    planType: "max" | "pro" | "unknown";
    roleLabel: string;
    statusLabel: string;
  };
  notifications: {
    billingUpdates: boolean;
    guestMessage: boolean;
    newRsvpResponse: boolean;
    preferences: Record<NotificationEventType, SettingsNotificationPreference>;
    pushAvailable: boolean;
    pushNotifications: boolean;
    pushSubscriptionEndpoint: string | null;
    pushStatus: PushSubscriptionStatus;
    vapidPublicKey: string | null;
  };
  support: {
    isEnabled: boolean;
    messengerUrl: string | null;
  };
};

export async function getSettingsPageData(): Promise<SettingsPageData> {
  const profile = await requireTenantMember();
  const clientId = profile.client_id;

  if (!clientId) {
    throw new Error("Client tenant profile is missing client_id.");
  }

  const supabase = await createServerSupabaseClient();
  const adminSupabase = createAdminClient();

  const [
    { data: client, error: clientError },
    messengerUrl,
    preferences,
    activePushSubscription,
  ] = await Promise.all([
    supabase
      .from("clients")
      .select("contact_email, contact_name, name, plan_type, status")
      .eq("id", clientId)
      .single(),
    safeLoadMessengerUrl(adminSupabase),
    loadNotificationPreferences(supabase, {
      clientId,
      profileId: profile.id,
    }),
    loadActivePushSubscription(supabase, {
      clientId,
      profileId: profile.id,
    }),
  ]);

  if (clientError) {
    throw clientError;
  }

  const name = profile.full_name?.trim() || client.contact_name?.trim() || client.name?.trim() || null;
  const email = profile.email?.trim() || client.contact_email?.trim() || null;
  const planType = getPlanType(client.plan_type);
  const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.trim() || null;
  const pushAvailable = Boolean(vapidPublicKey);

  return {
    account: {
      email,
      initials: getInitials(name, email),
      name,
      planLabel: getPlanLabel(planType),
      planType,
      roleLabel: formatUserRoleLabel(profile.role),
      statusLabel: formatStatusLabel(client.status),
    },
    notifications: {
      billingUpdates: preferences.billing_update.inAppEnabled,
      guestMessage: preferences.guest_message.inAppEnabled,
      newRsvpResponse: preferences.new_rsvp_response.inAppEnabled,
      preferences,
      pushAvailable,
      pushNotifications: Boolean(activePushSubscription),
      pushStatus: getPushStatus({
        activeEndpoint: activePushSubscription?.endpoint ?? null,
        pushAvailable,
      }),
      pushSubscriptionEndpoint: activePushSubscription?.endpoint ?? null,
      vapidPublicKey,
    },
    support: {
      isEnabled: Boolean(messengerUrl),
      messengerUrl,
    },
  };
}

async function loadNotificationPreferences(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>,
  input: {
    clientId: string;
    profileId: string;
  },
): Promise<Record<NotificationEventType, SettingsNotificationPreference>> {
  const { data, error } = await supabase
    .from("notification_preferences")
    .select("email_enabled, event_type, in_app_enabled, push_enabled")
    .eq("profile_id", input.profileId)
    .eq("client_id", input.clientId);

  if (error) {
    throw error;
  }

  const rowsByType = new Map(
    (data ?? []).map((row) => [row.event_type as NotificationEventType, row]),
  );

  return NOTIFICATION_EVENT_TYPES.reduce(
    (preferences, eventType) => {
      const row = rowsByType.get(eventType);

      preferences[eventType] = {
        emailEnabled: row?.email_enabled ?? false,
        eventType,
        inAppEnabled: row?.in_app_enabled ?? true,
        pushEnabled: row?.push_enabled ?? false,
      };

      return preferences;
    },
    {} as Record<NotificationEventType, SettingsNotificationPreference>,
  );
}

async function loadActivePushSubscription(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>,
  input: {
    clientId: string;
    profileId: string;
  },
) {
  const { data, error } = await supabase
    .from("push_subscriptions")
    .select("endpoint")
    .eq("profile_id", input.profileId)
    .eq("client_id", input.clientId)
    .eq("enabled", true)
    .is("revoked_at", null)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

function getPushStatus(input: {
  activeEndpoint: string | null;
  pushAvailable: boolean;
}): PushSubscriptionStatus {
  if (!input.pushAvailable) {
    return "not_configured";
  }

  if (input.activeEndpoint) {
    return "on";
  }

  return "off";
}

async function safeLoadMessengerUrl(adminSupabase: ReturnType<typeof createAdminClient>) {
  try {
    const { data, error } = await adminSupabase
      .from("platform_public_settings")
      .select("messenger_page_url")
      .maybeSingle();

    if (error) {
      throw error;
    }

    return sanitizeExternalUrl(data?.messenger_page_url ?? null);
  } catch (error) {
    console.error("[settings] Failed to load messenger url", error);
    return null;
  }
}

function sanitizeExternalUrl(value: string | null) {
  const trimmed = value?.trim();

  if (!trimmed) {
    return null;
  }

  try {
    const parsed = new URL(trimmed);

    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return null;
    }

    return parsed.toString();
  } catch {
    return null;
  }
}

function getPlanType(value: string | null | undefined): SettingsPageData["account"]["planType"] {
  if (value === "pro" || value === "max") {
    return value;
  }

  return "unknown";
}

function getPlanLabel(planType: SettingsPageData["account"]["planType"]) {
  switch (planType) {
    case "max":
      return "Max";
    case "pro":
      return "Pro";
    default:
      return "Not available";
  }
}

function formatStatusLabel(value: string | null | undefined) {
  if (!value) {
    return "Not available";
  }

  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function getInitials(name: string | null, email: string | null) {
  const source = name?.trim() || email?.trim() || "";
  const emailPrefix = source.split("@")[0];
  const cleaned = source.includes("@") ? (emailPrefix ?? "") : source;
  const words = cleaned
    .split(/[\s._-]+/)
    .map((part) => part.trim())
    .filter(Boolean);

  if (words.length === 0) {
    return "WS";
  }

  if (words.length === 1) {
    return (words[0] ?? "WS").slice(0, 2).toUpperCase();
  }

  return `${words[0]?.[0] ?? ""}${words[1]?.[0] ?? ""}`.toUpperCase();
}

"use server";

import { revalidatePath } from "next/cache";
import { requireTenantMember } from "@/lib/permissions";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  RemovePushSubscriptionSchema,
  SavePushSubscriptionSchema,
} from "@/lib/validations/notifications.schema";
import { actionFailure, actionSuccess, parseActionInput } from "./action-utils";

export async function savePushSubscriptionAction(input: unknown) {
  try {
    const profile = await requireTenantMember();
    const clientId = profile.client_id;

    if (!clientId) {
      throw new Error("Client tenant profile is missing client_id.");
    }

    const payload = parseActionInput(SavePushSubscriptionSchema, input);
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
      .from("push_subscriptions")
      .upsert(
        {
          auth: payload.auth,
          client_id: clientId,
          enabled: true,
          endpoint: payload.endpoint,
          last_seen_at: new Date().toISOString(),
          p256dh: payload.p256dh,
          platform: payload.platform ?? null,
          profile_id: profile.id,
          revoked_at: null,
          user_agent: payload.userAgent ?? null,
        },
        {
          onConflict: "endpoint",
        },
      )
      .select("endpoint, enabled")
      .single();

    if (error) {
      throw error;
    }

    await setPushPreferencesEnabled(supabase, {
      clientId,
      enabled: true,
      profileId: profile.id,
    });

    revalidatePath("/dashboard/settings");

    return actionSuccess({
      enabled: data.enabled,
      endpoint: data.endpoint,
    });
  } catch (error) {
    return actionFailure(error);
  }
}

export async function removePushSubscriptionAction(input: unknown) {
  try {
    const profile = await requireTenantMember();
    const clientId = profile.client_id;

    if (!clientId) {
      throw new Error("Client tenant profile is missing client_id.");
    }

    const payload = parseActionInput(RemovePushSubscriptionSchema, input);
    const supabase = await createServerSupabaseClient();
    const { error } = await supabase
      .from("push_subscriptions")
      .update({
        enabled: false,
        revoked_at: new Date().toISOString(),
      })
      .eq("endpoint", payload.endpoint)
      .eq("profile_id", profile.id)
      .eq("client_id", clientId);

    if (error) {
      throw error;
    }

    await setPushPreferencesEnabled(supabase, {
      clientId,
      enabled: false,
      profileId: profile.id,
    });

    revalidatePath("/dashboard/settings");

    return actionSuccess({
      enabled: false,
      endpoint: payload.endpoint,
    });
  } catch (error) {
    return actionFailure(error);
  }
}

async function setPushPreferencesEnabled(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>,
  input: {
    clientId: string;
    enabled: boolean;
    profileId: string;
  },
) {
  const { error } = await supabase
    .from("notification_preferences")
    .update({ push_enabled: input.enabled })
    .eq("profile_id", input.profileId)
    .eq("client_id", input.clientId);

  if (error) {
    throw error;
  }
}

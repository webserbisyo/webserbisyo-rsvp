"use server";

import { revalidatePath } from "next/cache";
import { requireTenantMember } from "@/lib/permissions";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { UpdateNotificationPreferenceSchema } from "@/lib/validations/notifications.schema";
import type { SettingsNotificationPreference } from "@/types/notifications";
import { actionFailure, actionSuccess, parseActionInput } from "./action-utils";

export async function updateInAppNotificationPreferenceAction(input: unknown) {
  try {
    const profile = await requireTenantMember();
    const clientId = profile.client_id;

    if (!clientId) {
      throw new Error("Client tenant profile is missing client_id.");
    }

    const payload = parseActionInput(UpdateNotificationPreferenceSchema, input);
    const supabase = await createServerSupabaseClient();
    const { data: updated, error: updateError } = await supabase
      .from("notification_preferences")
      .update({ in_app_enabled: payload.enabled })
      .eq("profile_id", profile.id)
      .eq("client_id", clientId)
      .eq("event_type", payload.eventType)
      .select("email_enabled, event_type, in_app_enabled, push_enabled")
      .maybeSingle();

    if (updateError) {
      throw updateError;
    }

    let preference = updated;

    if (!preference) {
      const { data: inserted, error: insertError } = await supabase
        .from("notification_preferences")
        .insert({
          client_id: clientId,
          email_enabled: false,
          event_type: payload.eventType,
          in_app_enabled: payload.enabled,
          profile_id: profile.id,
          push_enabled: false,
        })
        .select("email_enabled, event_type, in_app_enabled, push_enabled")
        .single();

      if (insertError) {
        throw insertError;
      }

      preference = inserted;
    }

    revalidatePath("/dashboard/settings");

    return actionSuccess<SettingsNotificationPreference>({
      emailEnabled: preference.email_enabled,
      eventType: payload.eventType,
      inAppEnabled: preference.in_app_enabled,
      pushEnabled: preference.push_enabled,
    });
  } catch (error) {
    return actionFailure(error);
  }
}

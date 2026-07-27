"use server";

import {
  clearRecoveryIntentMarker,
  setRecoveryIntentMarker,
  verifyRecoveryIntentMarker,
} from "@/lib/auth/recovery-intent";
import { createAdminClient } from "@/lib/supabase/admin";

export async function setRecoveryMarkerAction(userId: string) {
  if (!userId) return { success: false };
  await setRecoveryIntentMarker(userId);
  return { success: true };
}

export async function clearRecoveryMarkerAction() {
  await clearRecoveryIntentMarker();
  return { success: true };
}

export async function verifyRecoveryMarkerAction(userId: string) {
  if (!userId) return { valid: false };
  const valid = await verifyRecoveryIntentMarker(userId);
  return { valid };
}

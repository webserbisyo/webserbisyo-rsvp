"use server";

import { requireAdmin } from "@/lib/permissions";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getAdminClients, parseAdminClientsSearchParams } from "@/server/queries/admin-clients";
import { actionFailure, actionSuccess } from "./action-utils";

export async function fetchAdminClientsAction(searchParams: Record<string, string>) {
  try {
    await requireAdmin();

    const supabase = await createServerSupabaseClient();
    const filters = parseAdminClientsSearchParams(searchParams);
    const result = await getAdminClients(filters, supabase);

    return actionSuccess(result);
  } catch (error) {
    return actionFailure(error);
  }
}

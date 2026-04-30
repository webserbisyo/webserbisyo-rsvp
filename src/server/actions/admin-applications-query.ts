"use server";

import { requireAdmin } from "@/lib/permissions";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  getAdminApplications,
  parseAdminApplicationsSearchParams,
} from "@/server/queries/admin-applications";
import { actionFailure, actionSuccess } from "./action-utils";

export async function fetchAdminApplicationsAction(searchParams: Record<string, string>) {
  try {
    await requireAdmin();

    const supabase = await createServerSupabaseClient();
    const filters = parseAdminApplicationsSearchParams(searchParams);
    const result = await getAdminApplications(filters, supabase);

    return actionSuccess(result);
  } catch (error) {
    return actionFailure(error);
  }
}

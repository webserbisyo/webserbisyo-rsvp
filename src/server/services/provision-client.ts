import "server-only";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { TablesInsert } from "@/lib/supabase/types";
import { assertServiceData, assertServiceSuccess } from "./service-error";

export type ProvisionClientInput = {
  contactEmail: string;
  contactName?: string | null;
  contactPhone?: string | null;
  name: string;
  planType: "pro" | "max";
};

export async function provisionClient(input: ProvisionClientInput) {
  const supabase = await createServerSupabaseClient();
  const row: TablesInsert<"clients"> = {
    contact_email: input.contactEmail,
    contact_name: input.contactName ?? null,
    contact_phone: input.contactPhone ?? null,
    name: input.name,
    plan_type: input.planType,
    status: "active",
  };

  const { data, error } = await supabase.from("clients").insert(row).select("*").single();

  assertServiceSuccess(error, "Failed to provision client.");
  assertServiceData(data, "Client provisioning returned no row.");

  return data;
}

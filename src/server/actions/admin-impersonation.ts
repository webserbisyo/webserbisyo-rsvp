"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { clientStatusAllowsDashboardAccess } from "@/lib/auth/client-access";
import {
  generateImpersonationToken,
  IMPERSONATION_COOKIE_NAME,
} from "@/lib/auth/impersonation";
import { requireAdmin } from "@/lib/permissions";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { writeAuditLog } from "@/server/services/write-audit-log";

export async function startClientImpersonationAction(targetClientId: string) {
  const admin = await requireAdmin();

  // Verify the target client exists and permits dashboard access
  const supabase = await createServerSupabaseClient();
  const { data: client, error } = await supabase
    .from("clients")
    .select("status, name")
    .eq("id", targetClientId)
    .maybeSingle();

  if (error || !client) {
    throw new Error("The target client could not be found.");
  }

  if (!clientStatusAllowsDashboardAccess(client.status)) {
    throw new Error(
      `Client "${client.name}" has status "${client.status}" and cannot be accessed.`,
    );
  }

  const token = generateImpersonationToken(admin.id, targetClientId);
  const cookieStore = await cookies();

  cookieStore.set(IMPERSONATION_COOKIE_NAME, token, {
    httpOnly: true,
    maxAge: 3600,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });

  await writeAuditLog({
    action: "admin_client_impersonation_started",
    actorUserId: admin.id,
    clientId: targetClientId,
    entityType: "clients",
    metadata: {
      admin_email: admin.email,
      target_client_id: targetClientId,
      target_client_name: client.name,
    },
  });

  redirect("/dashboard/event");
}

export async function stopClientImpersonationAction(targetClientId?: string) {
  const cookieStore = await cookies();
  cookieStore.delete(IMPERSONATION_COOKIE_NAME);

  if (targetClientId) {
    redirect(`/admin/clients/${targetClientId}`);
  } else {
    redirect("/admin/clients");
  }
}

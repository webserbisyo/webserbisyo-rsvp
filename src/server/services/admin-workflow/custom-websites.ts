import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import type { Tables, TablesInsert } from "@/lib/supabase/types";
import type {
  DisableCustomWebsiteInput,
  EnableCustomWebsiteInput,
  SaveCustomFrontendOriginInput,
} from "@/lib/validations/admin-workflow.schema";
import {
  ServiceError,
  assertServiceData,
  assertServiceSuccess,
} from "@/server/services/service-error";
import { writeAuditLog } from "@/server/services/write-audit-log";

export const CUSTOM_WEBSITE_TEMPLATE_ID = "wedding-custom-starter-v1";

const CUSTOM_WEBSITE_COLUMNS =
  "id, client_id, event_id, custom_frontend_origin_url, custom_frontend_enabled, template_id, platform_event_slug, status, connected_at, disabled_at, notes, created_at, updated_at";

type CustomWebsiteRow = Tables<"client_custom_websites">;

export async function saveCustomFrontendOrigin(
  input: SaveCustomFrontendOriginInput,
  actorUserId: string,
) {
  const originUrl = normalizeCustomFrontendOrigin(input.originUrl);
  const event = await loadOwnedEvent(input.clientId, input.eventId);
  const existing = await loadCustomWebsiteByEventId(input.eventId);
  const templateId = input.templateId ?? existing?.template_id ?? CUSTOM_WEBSITE_TEMPLATE_ID;
  const nextEnabled = existing?.custom_frontend_enabled ?? false;
  const row: TablesInsert<"client_custom_websites"> = {
    client_id: input.clientId,
    custom_frontend_enabled: nextEnabled,
    custom_frontend_origin_url: originUrl,
    disabled_at: nextEnabled ? null : (existing?.disabled_at ?? null),
    event_id: input.eventId,
    platform_event_slug: event.event_slug,
    status: nextEnabled ? "enabled" : "origin_saved",
    template_id: templateId,
  };

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("client_custom_websites")
    .upsert(row, { onConflict: "event_id" })
    .select(CUSTOM_WEBSITE_COLUMNS)
    .single();

  assertServiceSuccess(error, "Failed to save custom frontend origin.");
  assertServiceData(data, "Custom website save returned no row.");

  await writeCustomWebsiteAuditLog({
    action: "custom_frontend_origin_saved",
    actorUserId,
    clientId: input.clientId,
    eventId: input.eventId,
    row: data,
  });

  return data;
}

export async function enableCustomWebsite(input: EnableCustomWebsiteInput, actorUserId: string) {
  await loadOwnedEvent(input.clientId, input.eventId);

  const existing = await loadCustomWebsiteByEventId(input.eventId);
  const originUrl = normalizeCustomFrontendOrigin(existing?.custom_frontend_origin_url ?? "");

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("client_custom_websites")
    .update({
      connected_at: existing?.connected_at ?? new Date().toISOString(),
      custom_frontend_enabled: true,
      disabled_at: null,
      status: "enabled",
    })
    .eq("event_id", input.eventId)
    .select(CUSTOM_WEBSITE_COLUMNS)
    .single();

  assertServiceSuccess(error, "Failed to enable custom website.");
  assertServiceData(data, "Custom website enable returned no row.");

  if (data.custom_frontend_origin_url !== originUrl) {
    throw new ServiceError("Custom frontend origin URL could not be verified.");
  }

  await writeCustomWebsiteAuditLog({
    action: "custom_website_enabled",
    actorUserId,
    clientId: input.clientId,
    eventId: input.eventId,
    row: data,
  });

  return data;
}

export async function disableCustomWebsite(input: DisableCustomWebsiteInput, actorUserId: string) {
  await loadOwnedEvent(input.clientId, input.eventId);

  const existing = await loadCustomWebsiteByEventId(input.eventId);

  if (!existing) {
    throw new ServiceError("Custom website settings were not found.");
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("client_custom_websites")
    .update({
      custom_frontend_enabled: false,
      disabled_at: new Date().toISOString(),
      status: "disabled",
    })
    .eq("event_id", input.eventId)
    .select(CUSTOM_WEBSITE_COLUMNS)
    .single();

  assertServiceSuccess(error, "Failed to disable custom website.");
  assertServiceData(data, "Custom website disable returned no row.");

  await writeCustomWebsiteAuditLog({
    action: "custom_website_disabled",
    actorUserId,
    clientId: input.clientId,
    eventId: input.eventId,
    row: data,
  });

  return data;
}

async function loadOwnedEvent(clientId: string, eventId: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("rsvp_events")
    .select("id, client_id, event_slug")
    .eq("id", eventId)
    .eq("client_id", clientId)
    .maybeSingle();

  assertServiceSuccess(error, "Failed to verify linked event.");
  assertServiceData(data, "Linked event was not found for this client.");

  return data;
}

async function loadCustomWebsiteByEventId(eventId: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("client_custom_websites")
    .select(CUSTOM_WEBSITE_COLUMNS)
    .eq("event_id", eventId)
    .maybeSingle();

  assertServiceSuccess(error, "Failed to load custom website settings.");

  return data;
}

function normalizeCustomFrontendOrigin(value: string) {
  const trimmed = value.trim();

  if (!trimmed) {
    throw new ServiceError("A custom frontend origin URL is required.");
  }

  let url: URL;

  try {
    url = new URL(trimmed);
  } catch {
    throw new ServiceError("Enter a valid custom frontend origin URL.");
  }

  const isLocalhost = ["localhost", "127.0.0.1", "::1"].includes(url.hostname);

  if (process.env.NODE_ENV === "production" && url.protocol !== "https:") {
    throw new ServiceError("Production custom frontend origins must use HTTPS.");
  }

  if (process.env.NODE_ENV !== "production" && url.protocol !== "https:" && !isLocalhost) {
    throw new ServiceError("Custom frontend origins must use HTTPS unless using localhost.");
  }

  if (url.username || url.password) {
    throw new ServiceError("Custom frontend origins cannot include credentials.");
  }

  return url.origin;
}

async function writeCustomWebsiteAuditLog(input: {
  action: string;
  actorUserId: string;
  clientId: string;
  eventId: string;
  row: CustomWebsiteRow;
}) {
  const originHost = input.row.custom_frontend_origin_url
    ? new URL(input.row.custom_frontend_origin_url).hostname
    : null;

  await writeAuditLog({
    action: input.action,
    actorUserId: input.actorUserId,
    clientId: input.clientId,
    entityId: input.row.id,
    entityType: "client_custom_website",
    eventId: input.eventId,
    metadata: {
      custom_frontend_enabled: input.row.custom_frontend_enabled,
      origin_host: originHost,
      status: input.row.status,
      template_id: input.row.template_id,
    },
  });
}

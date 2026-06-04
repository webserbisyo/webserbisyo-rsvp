import "server-only";

import type { TablesUpdate } from "@/lib/supabase/types";
import { createAdminClient } from "@/lib/supabase/admin";
import { ServiceError, assertServiceData, assertServiceSuccess } from "@/server/services/service-error";
import { assertSafeCustomFrontendOriginForFetch } from "@/server/services/custom-websites/custom-website-origin";
import type { CustomWebsiteHealthStatus } from "@/server/services/custom-websites/types";

const HEALTH_CHECK_TIMEOUT_MS = 8_000;

export type CustomWebsiteHealthCheckResult = {
  checkedAt: string;
  error: string | null;
  responseMs: number | null;
  status: CustomWebsiteHealthStatus;
  statusCode: number | null;
};

export async function checkCustomWebsiteOriginHealth(input: {
  clientId: string;
  eventId: string;
}) {
  const supabase = createAdminClient();
  const { data: row, error: loadError } = await supabase
    .from("client_custom_websites")
    .select("id, client_id, event_id, custom_frontend_origin_url")
    .eq("client_id", input.clientId)
    .eq("event_id", input.eventId)
    .maybeSingle();

  assertServiceSuccess(loadError, "Failed to load custom website settings.");
  assertServiceData(row, "Custom website settings were not found.");

  const origin = row.custom_frontend_origin_url;

  if (!origin) {
    throw new ServiceError("Save a custom frontend origin before checking health.");
  }

  const result = await probeCustomWebsiteOrigin(origin);
  const update: TablesUpdate<"client_custom_websites"> = {
    last_health_checked_at: result.checkedAt,
    last_health_error: result.error,
    last_health_status: result.status,
    last_origin_response_ms: result.responseMs,
    last_origin_status_code: result.statusCode,
  };
  const { data, error } = await supabase
    .from("client_custom_websites")
    .update(update)
    .eq("id", row.id)
    .select(
      "id, client_id, event_id, custom_frontend_origin_url, custom_frontend_enabled, template_id, platform_event_slug, status, connected_at, disabled_at, preview_enabled, last_health_status, last_health_checked_at, last_health_error, last_origin_response_ms, last_origin_status_code, last_previewed_at, notes, created_at, updated_at",
    )
    .single();

  assertServiceSuccess(error, "Failed to save custom website health status.");
  assertServiceData(data, "Custom website health check returned no row.");

  return data;
}

export async function probeCustomWebsiteOrigin(origin: string): Promise<CustomWebsiteHealthCheckResult> {
  const checkedAt = new Date().toISOString();

  try {
    const safeOrigin = await assertSafeCustomFrontendOriginForFetch(origin);
    const headResult = await fetchOrigin(safeOrigin, "HEAD");

    if (headResult.statusCode && [405, 501].includes(headResult.statusCode)) {
      return toHealthResult(checkedAt, await fetchOrigin(safeOrigin, "GET"));
    }

    return toHealthResult(checkedAt, headResult);
  } catch (error) {
    return {
      checkedAt,
      error: toHealthErrorMessage(error),
      responseMs: null,
      status: "unhealthy",
      statusCode: null,
    };
  }
}

async function fetchOrigin(origin: string, method: "GET" | "HEAD") {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), HEALTH_CHECK_TIMEOUT_MS);
  const startedAt = Date.now();

  try {
    const response = await fetch(origin, {
      cache: "no-store",
      method,
      redirect: "manual",
      signal: controller.signal,
    });

    return {
      error: null,
      responseMs: Date.now() - startedAt,
      statusCode: response.status,
    };
  } catch (error) {
    return {
      error: toHealthErrorMessage(error),
      responseMs: Date.now() - startedAt,
      statusCode: null,
    };
  } finally {
    clearTimeout(timeout);
  }
}

function toHealthResult(
  checkedAt: string,
  result: { error: string | null; responseMs: number | null; statusCode: number | null },
): CustomWebsiteHealthCheckResult {
  const statusCode = result.statusCode;
  const isHealthy = typeof statusCode === "number" && statusCode >= 200 && statusCode < 400;

  return {
    checkedAt,
    error: isHealthy ? null : (result.error ?? `Origin returned HTTP ${statusCode ?? "unknown"}.`),
    responseMs: result.responseMs,
    status: isHealthy ? "healthy" : "unhealthy",
    statusCode,
  };
}

function toHealthErrorMessage(error: unknown) {
  if (error instanceof ServiceError) {
    return error.message;
  }

  if (error instanceof DOMException && error.name === "AbortError") {
    return "Custom frontend origin health check timed out.";
  }

  if (error instanceof Error) {
    return error.message.slice(0, 500);
  }

  return "Custom frontend origin health check failed.";
}

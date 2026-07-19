import "server-only";

import type { TablesUpdate } from "@/lib/supabase/types";
import { isCustomWebsiteUnavailableHtml } from "@/lib/event-website/custom-website-health-policy";
import { EVENT_WEBSITE_SECTION_CONTRACT_VERSION } from "@/lib/event-website/section-contract";
import { createAdminClient } from "@/lib/supabase/admin";
import { EventWebsiteContentIntegrityError } from "@/server/services/event-website-resolution";
import { resolvePublicEventWebsiteResult } from "@/server/services/resolve-public-event-website";
import {
  ServiceError,
  assertServiceData,
  assertServiceSuccess,
} from "@/server/services/service-error";
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

export async function checkCustomWebsiteOriginHealth(input: { clientId: string; eventId: string }) {
  const supabase = createAdminClient();
  const { data: row, error: loadError } = await supabase
    .from("client_custom_websites")
    .select("id, client_id, event_id, custom_frontend_origin_url, platform_event_slug")
    .eq("client_id", input.clientId)
    .eq("event_id", input.eventId)
    .maybeSingle();

  assertServiceSuccess(loadError, "Failed to load custom website settings.");
  assertServiceData(row, "Custom website settings were not found.");

  const origin = row.custom_frontend_origin_url;

  if (!origin) {
    throw new ServiceError("Save a custom frontend origin before checking health.");
  }

  const result = row.platform_event_slug
    ? await probeResolvedCustomWebsite(origin, row.platform_event_slug)
    : misconfiguredHealthResult();
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

export async function probeCustomWebsiteOrigin(
  origin: string,
): Promise<CustomWebsiteHealthCheckResult> {
  const checkedAt = new Date().toISOString();

  try {
    const safeOrigin = await assertSafeCustomFrontendOriginForFetch(origin);
    return toHealthResult(checkedAt, await fetchOrigin(safeOrigin));
  } catch (error) {
    return {
      checkedAt,
      error: toHealthErrorMessage(error),
      responseMs: null,
      status: "frontend_unreachable",
      statusCode: null,
    };
  }
}

async function probeResolvedCustomWebsite(origin: string, eventSlug: string) {
  const checkedAt = new Date().toISOString();

  try {
    const resolution = await resolvePublicEventWebsiteResult(eventSlug);

    if (resolution.status !== "RESOLVED") {
      return {
        checkedAt,
        error:
          resolution.status === "EVENT_NOT_PUBLISHED"
            ? "The configured event is not published."
            : "The configured event could not be resolved.",
        responseMs: null,
        status: "event_not_found" as const,
        statusCode: null,
      };
    }

    if (resolution.data.contractVersion !== EVENT_WEBSITE_SECTION_CONTRACT_VERSION) {
      return {
        checkedAt,
        error: "The custom website contract is incompatible.",
        responseMs: null,
        status: "contract_invalid" as const,
        statusCode: null,
      };
    }

    return probeCustomWebsiteOrigin(origin);
  } catch (error) {
    if (error instanceof EventWebsiteContentIntegrityError) {
      return {
        checkedAt,
        error: "The configured event content failed integrity validation.",
        responseMs: null,
        status: "event_content_invalid" as const,
        statusCode: 503,
      };
    }

    return {
      checkedAt,
      error: toHealthErrorMessage(error),
      responseMs: null,
      status: "frontend_unreachable" as const,
      statusCode: null,
    };
  }
}

function misconfiguredHealthResult(): CustomWebsiteHealthCheckResult {
  return {
    checkedAt: new Date().toISOString(),
    error: "The custom preview event slug is not configured.",
    responseMs: null,
    status: "preview_misconfigured",
    statusCode: null,
  };
}

async function fetchOrigin(origin: string) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), HEALTH_CHECK_TIMEOUT_MS);
  const startedAt = Date.now();

  try {
    const response = await fetch(origin, {
      cache: "no-store",
      method: "GET",
      redirect: "manual",
      signal: controller.signal,
    });

    const responseText = await response.text();
    return {
      error: null,
      unavailablePage: isCustomWebsiteUnavailableHtml(responseText),
      responseMs: Date.now() - startedAt,
      statusCode: response.status,
    };
  } catch (error) {
    return {
      error: toHealthErrorMessage(error),
      unavailablePage: false,
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
  const unavailablePage = "unavailablePage" in result && result.unavailablePage === true;
  const isHealthy =
    !unavailablePage && typeof statusCode === "number" && statusCode >= 200 && statusCode < 400;

  return {
    checkedAt,
    error: isHealthy
      ? null
      : unavailablePage
        ? "The custom frontend could not resolve its configured event."
        : (result.error ?? `Origin returned HTTP ${statusCode ?? "unknown"}.`),
    responseMs: result.responseMs,
    status: isHealthy ? "healthy" : unavailablePage ? "event_not_found" : "frontend_unreachable",
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

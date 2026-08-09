import "server-only";

import { createHash } from "node:crypto";

import { getMetaCapiRuntimeConfig } from "@/lib/meta/capi-config";
import { resolveMetaPixelForContext } from "@/lib/meta/pixel-resolution";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Json } from "@/lib/supabase/types";
import { writeAuditLog } from "./write-audit-log";

const META_CAPI_LEAD_EVENT_NAME = "Lead";
const META_CAPI_LEAD_CONTENT_NAME = "WebSerbisyo RSVP Application Submitted";
const META_CAPI_LEAD_CONTENT_CATEGORY = "RSVP Website Lead";

export type SendMetaCapiLeadInput = {
  applicationId: string;
  clientIpAddress?: string | null;
  clientUserAgent?: string | null;
  email?: string | null;
  eventSourceUrl?: string | null;
  fbc?: string | null;
  fbp?: string | null;
  fullName?: string | null;
  phone?: string | null;
  preferredPlan?: string | null;
  referenceCode: string;
};

type MetaCapiLeadStatus = "failed" | "sent" | "skipped";

type MetaCapiLeadResult = {
  eventId: string;
  httpStatus?: number;
  pixelSource?: "env" | "meta_pixels" | "none";
  reason?: string;
  responseSummary?: Json;
  status: MetaCapiLeadStatus;
};

type MetaCapiUserData = Partial<{
  client_ip_address: string;
  client_user_agent: string;
  em: string[];
  external_id: string[];
  fbc: string;
  fbp: string;
  fn: string[];
  ln: string[];
  ph: string[];
}>;

export async function sendMetaCapiLead(input: SendMetaCapiLeadInput) {
  const eventId = buildLeadEventId(input.referenceCode);
  const config = getMetaCapiRuntimeConfig();

  try {
    if (!config.leadEnabled) {
      const result = buildResult(eventId, "skipped", {
        pixelSource: "none",
        reason: "disabled",
      });
      await safeWriteLeadAuditLog(input, result);
      return result;
    }

    const pixel = await getMetaCapiLeadPixel();

    if (!pixel.pixelId) {
      const result = buildResult(eventId, "skipped", {
        pixelSource: "none",
        reason: "Meta CAPI pixel ID is not configured.",
      });
      await safeWriteLeadAuditLog(input, result);
      return result;
    }

    const accessToken = config.accessToken;

    if (!accessToken) {
      const result = buildResult(eventId, "skipped", {
        pixelSource: pixel.pixelSource,
        reason: "Meta CAPI access token is not configured.",
      });
      await safeWriteLeadAuditLog(input, result);
      return result;
    }

    const userData = buildUserData(input);

    if (Object.keys(userData).length === 0) {
      const result = buildResult(eventId, "skipped", {
        pixelSource: pixel.pixelSource,
        reason: "Meta CAPI user data is not available for matching.",
      });
      await safeWriteLeadAuditLog(input, result);
      return result;
    }

    const apiVersion = config.apiVersion;
    const endpoint = `https://graph.facebook.com/${apiVersion}/${pixel.pixelId}/events`;
    const response = await fetch(`${endpoint}?access_token=${encodeURIComponent(accessToken)}`, {
      body: JSON.stringify({
        data: [
          {
            action_source: "website" as const,
            custom_data: {
              content_category: META_CAPI_LEAD_CONTENT_CATEGORY,
              content_name: META_CAPI_LEAD_CONTENT_NAME,
              currency: "PHP",
              plan: normalizePlan(input.preferredPlan) ?? undefined,
              reference_code: input.referenceCode,
              value: getPlanValue(input.preferredPlan),
            },
            event_id: eventId,
            event_name: META_CAPI_LEAD_EVENT_NAME,
            event_source_url: input.eventSourceUrl ?? undefined,
            event_time: Math.floor(Date.now() / 1000),
            user_data: userData,
          },
        ],
        test_event_code: config.testEventCode ?? undefined,
      }),
      headers: {
        "content-type": "application/json",
      },
      method: "POST",
    });
    const responseBody = (await response.json().catch(() => null)) as unknown;
    const responseSummary = summarizeMetaResponse(responseBody);

    const result = buildResult(eventId, response.ok ? "sent" : "failed", {
      httpStatus: response.status,
      pixelSource: pixel.pixelSource,
      responseSummary,
    });
    await safeWriteLeadAuditLog(input, result);
    return result;
  } catch (error) {
    const result = buildResult(eventId, "failed", {
      reason: error instanceof Error ? error.message : "Meta CAPI Lead request failed.",
    });
    await safeWriteLeadAuditLog(input, result);
    return result;
  }
}

function buildLeadEventId(referenceCode: string) {
  return `${META_CAPI_LEAD_EVENT_NAME}:${referenceCode}`;
}

function buildResult(
  eventId: string,
  status: MetaCapiLeadStatus,
  details: Omit<MetaCapiLeadResult, "eventId" | "status"> = {},
): MetaCapiLeadResult {
  return {
    eventId,
    status,
    ...details,
  };
}

async function getMetaCapiLeadPixel() {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("meta_pixels")
    .select("id, pixel_id, tracking_scope, updated_at")
    .eq("is_active", true)
    .in("tracking_scope", ["global_public", "application"]);

  const pixel = !error
    ? resolveMetaPixelForContext(
        (data ?? []).map((row) => ({
          id: row.id,
          pixelId: row.pixel_id,
          trackingScope: row.tracking_scope,
          updatedAt: row.updated_at,
        })),
        "application_funnel",
      )
    : null;

  if (pixel?.pixelId) {
    return {
      pixelId: pixel.pixelId,
      pixelSource: "meta_pixels" as const,
    };
  }

  const envPixelId = process.env.META_PIXEL_ID?.trim() || null;

  return {
    pixelId: envPixelId,
    pixelSource: envPixelId ? ("env" as const) : ("none" as const),
  };
}

function buildUserData(input: SendMetaCapiLeadInput) {
  const userData: MetaCapiUserData = {};
  const email = normalizeEmail(input.email);
  const phone = normalizePhone(input.phone);
  const externalId = normalizeHashable(input.referenceCode);

  if (email) {
    userData.em = [sha256(email)];
  }

  if (phone) {
    userData.ph = [sha256(phone)];
  }

  const nameParts = input.fullName?.trim().split(/\s+/) ?? [];

  if (nameParts.length > 0 && nameParts[0]) {
    userData.fn = [sha256(nameParts[0].toLowerCase())];

    if (nameParts.length > 1) {
      userData.ln = [sha256(nameParts.slice(1).join(" ").toLowerCase())];
    }
  }

  if (externalId) {
    userData.external_id = [sha256(externalId)];
  }

  const fbp = input.fbp?.trim();
  if (fbp) {
    userData.fbp = fbp;
  }

  const fbc = input.fbc?.trim();
  if (fbc) {
    userData.fbc = fbc;
  }

  const clientIpAddress = input.clientIpAddress?.trim();
  if (clientIpAddress) {
    userData.client_ip_address = clientIpAddress;
  }

  const clientUserAgent = input.clientUserAgent?.trim();
  if (clientUserAgent) {
    userData.client_user_agent = clientUserAgent;
  }

  return userData;
}

async function safeWriteLeadAuditLog(input: SendMetaCapiLeadInput, result: MetaCapiLeadResult) {
  try {
    await writeAuditLog({
      action: `meta_capi_lead_${result.status}`,
      entityId: input.applicationId,
      entityType: "rsvp_applications",
      metadata: toAuditMetadata(input, result),
    });
  } catch {
    // Lead CAPI telemetry must never fail application submission.
  }
}

function toAuditMetadata(input: SendMetaCapiLeadInput, result: MetaCapiLeadResult): Json {
  return {
    event_id: result.eventId,
    event_name: META_CAPI_LEAD_EVENT_NAME,
    http_status: result.httpStatus ?? null,
    pixel_source: result.pixelSource ?? null,
    provider: "meta",
    reason: result.reason ?? null,
    reference_code: input.referenceCode,
    response_summary: result.responseSummary ?? null,
    status: result.status,
  };
}

function summarizeMetaResponse(response: unknown): Json {
  if (!response || typeof response !== "object") {
    return null;
  }

  const value = response as {
    error?: {
      code?: unknown;
      fbtrace_id?: unknown;
      message?: unknown;
      type?: unknown;
    };
    events_received?: unknown;
    fbtrace_id?: unknown;
    messages?: unknown;
  };

  return {
    error: value.error
      ? {
          code: safePrimitive(value.error.code),
          fbtrace_id: safePrimitive(value.error.fbtrace_id),
          message: safePrimitive(value.error.message),
          type: safePrimitive(value.error.type),
        }
      : null,
    events_received: safePrimitive(value.events_received),
    fbtrace_id: safePrimitive(value.fbtrace_id),
    messages: Array.isArray(value.messages)
      ? value.messages.filter((item): item is string => typeof item === "string").slice(0, 5)
      : null,
  };
}

function safePrimitive(value: unknown) {
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return value;
  }

  return null;
}

function getPlanValue(plan: string | null | undefined) {
  switch (normalizePlan(plan)) {
    case "max":
      return 3599;
    case "pro":
    default:
      return 1599;
  }
}

function normalizePlan(plan: string | null | undefined) {
  return plan === "max" || plan === "pro" ? plan : null;
}

function normalizeEmail(value: string | null | undefined) {
  return value?.trim().toLowerCase() || null;
}

function normalizePhone(value: string | null | undefined) {
  return value?.replaceAll(/\D/g, "") || null;
}

function normalizeHashable(value: string | null | undefined) {
  return value?.trim().toLowerCase() || null;
}

function sha256(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

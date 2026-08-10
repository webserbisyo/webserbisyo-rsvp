import "server-only";

import { createHash } from "node:crypto";
import { getMetaCapiRuntimeConfig } from "./capi-config";
import {
  buildMetaCapiEventEnvelope,
  classifyMetaCapiResponse,
  fingerprintMetaTestEventCode,
  summarizeMetaCapiResponse,
} from "./capi-response";

export type MetaCapiEventInput = {
  actionSource?: "other" | "website";
  amount: number;
  clientIpAddress?: string | null;
  clientUserAgent?: string | null;
  customData?: MetaCapiCustomData;
  currency: string;
  email?: string | null;
  eventId: string;
  eventName?: MetaCapiEventName;
  eventTime?: number;
  externalId?: string | null;
  fbc?: string | null;
  fbp?: string | null;
  fullName?: string | null;
  phone?: string | null;
  pixelId?: string | null;
  sourceUrl?: string | null;
};

export type MetaCapiEventName =
  | "CompleteRegistration"
  | "Contact"
  | "InitiateCheckout"
  | "PageView"
  | "Purchase"
  | "SelectPlan"
  | "StartApplicationClick"
  | "ViewContent";

export type MetaCapiCustomData = Record<string, boolean | number | string | undefined>;

export type MetaCapiSendResult = {
  diagnostics?: {
    actionSource: "other" | "website";
    currency: string;
    eventName: MetaCapiEventName;
    eventTime: number;
    eventsReceived?: number | null;
    fbtraceId?: string | null;
    httpStatus?: number;
    messages?: string[];
    pixelId: string | null;
    testEventCodeFingerprint: string | null;
    testEventCodePresent: boolean;
    testModeEnabled: boolean;
    value: number;
  };
  eventId: string;
  failureCode?: "http_error" | "ingestion_unconfirmed" | "transport_error";
  httpStatus?: number;
  reason?: string;
  response?: ReturnType<typeof summarizeMetaCapiResponse>;
  status: "failed" | "sent" | "skipped";
};

export async function sendMetaCapiEvent(input: MetaCapiEventInput): Promise<MetaCapiSendResult> {
  const config = getMetaCapiRuntimeConfig();
  const accessToken = config.accessToken;
  const pixelId = (input.pixelId ?? process.env.META_PIXEL_ID)?.trim() || null;
  const actionSource = input.actionSource ?? "website";
  const eventName = input.eventName ?? "Purchase";
  const eventTime = input.eventTime ?? Math.floor(Date.now() / 1000);
  const testEventCode = config.testEventCode;
  const requestDiagnostics = {
    actionSource,
    currency: input.currency,
    eventName,
    eventTime,
    pixelId,
    testEventCodeFingerprint: fingerprintMetaTestEventCode(testEventCode),
    testEventCodePresent: Boolean(testEventCode),
    testModeEnabled: config.testModeEnabled,
    value: input.amount,
  };

  if (!accessToken || !pixelId) {
    return {
      eventId: input.eventId,
      diagnostics: requestDiagnostics,
      reason: "Meta CAPI access token or pixel ID is not configured.",
      status: "skipped" as const,
    };
  }

  const userData = buildUserData(input);

  if (Object.keys(userData).length === 0) {
    return {
      eventId: input.eventId,
      diagnostics: requestDiagnostics,
      reason: "Meta CAPI user data is not available for matching.",
      status: "skipped" as const,
    };
  }

  const apiVersion = config.apiVersion;
  const endpoint = `https://graph.facebook.com/${apiVersion}/${pixelId}/events`;
  const body = buildMetaCapiEventEnvelope(
    {
      action_source: actionSource,
      custom_data: input.customData ?? {
        currency: input.currency,
        order_id: input.eventId,
        value: input.amount,
      },
      event_id: input.eventId,
      event_name: eventName,
      event_source_url: input.sourceUrl ?? undefined,
      event_time: eventTime,
      user_data: userData,
    },
    testEventCode,
  );

  try {
    const response = await fetch(`${endpoint}?access_token=${encodeURIComponent(accessToken)}`, {
      body: JSON.stringify(body),
      headers: {
        "content-type": "application/json",
      },
      method: "POST",
    });
    const responseBody = (await response.json().catch(() => null)) as unknown;
    const responseSummary = summarizeMetaCapiResponse(responseBody);
    const responseOutcome = classifyMetaCapiResponse(response.ok, responseSummary);
    const diagnostics = {
      ...requestDiagnostics,
      eventsReceived: responseSummary.eventsReceived,
      fbtraceId: responseSummary.fbtraceId ?? responseSummary.error?.fbtraceId ?? null,
      httpStatus: response.status,
      messages: responseSummary.messages,
    };

    if (responseOutcome === "http_failed") {
      return {
        diagnostics,
        eventId: input.eventId,
        failureCode: "http_error" as const,
        httpStatus: response.status,
        response: responseSummary,
        status: "failed" as const,
      };
    }

    if (responseOutcome === "ingestion_unconfirmed") {
      return {
        diagnostics,
        eventId: input.eventId,
        failureCode: "ingestion_unconfirmed" as const,
        httpStatus: response.status,
        reason: "Meta did not confirm ingestion of an event.",
        response: responseSummary,
        status: "failed" as const,
      };
    }

    return {
      diagnostics,
      eventId: input.eventId,
      httpStatus: response.status,
      response: responseSummary,
      status: "sent" as const,
    };
  } catch {
    return {
      diagnostics: requestDiagnostics,
      eventId: input.eventId,
      failureCode: "transport_error" as const,
      reason: "Meta CAPI request failed.",
      status: "failed" as const,
    };
  }
}

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

function buildUserData(input: MetaCapiEventInput) {
  const userData: MetaCapiUserData = {};
  const email = normalizeEmail(input.email);
  const phone = normalizePhone(input.phone);
  const externalId = normalizeHashable(input.externalId);

  if (email) {
    userData.em = [sha256(email)];
  }

  if (phone) {
    userData.ph = [sha256(phone)];
  }

  // First name / last name from fullName
  const nameParts = input.fullName?.trim().split(/\s+/) ?? [];

  if (nameParts.length > 0 && nameParts[0]) {
    userData.fn = [sha256(nameParts[0].toLowerCase())];

    if (nameParts.length > 1) {
      userData.ln = [sha256(nameParts.slice(1).join(" ").toLowerCase())];
    }
  }

  // External ID (hashed)
  if (externalId) {
    userData.external_id = [sha256(externalId)];
  }

  // Browser ID (fbp) — raw, not hashed per Meta spec
  const fbp = input.fbp?.trim();
  if (fbp) {
    userData.fbp = fbp;
  }

  // Click ID (fbc) — raw, not hashed per Meta spec
  const fbc = input.fbc?.trim();
  if (fbc) {
    userData.fbc = fbc;
  }

  const clientIpAddress = input.clientIpAddress?.trim();
  if (clientIpAddress) {
    userData.client_ip_address = clientIpAddress;
  }

  // Client user agent
  const clientUserAgent = input.clientUserAgent?.trim();
  if (clientUserAgent) {
    userData.client_user_agent = clientUserAgent;
  }

  return userData;
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

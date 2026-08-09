import "server-only";

import { createHash } from "node:crypto";
import { getMetaCapiRuntimeConfig } from "./capi-config";

export type MetaCapiEventInput = {
  amount: number;
  clientIpAddress?: string | null;
  clientUserAgent?: string | null;
  currency: "PHP";
  email?: string | null;
  eventId: string;
  eventName?: "Purchase";
  externalId?: string | null;
  fbc?: string | null;
  fbp?: string | null;
  fullName?: string | null;
  phone?: string | null;
  pixelId?: string | null;
  sourceUrl?: string | null;
  testEventCode?: string | null;
};

export async function sendMetaCapiEvent(input: MetaCapiEventInput) {
  const config = getMetaCapiRuntimeConfig();
  const accessToken = config.accessToken;
  const pixelId = input.pixelId ?? process.env.META_PIXEL_ID ?? null;

  if (!accessToken || !pixelId) {
    return {
      eventId: input.eventId,
      reason: "Meta CAPI access token or pixel ID is not configured.",
      status: "skipped" as const,
    };
  }

  const userData = buildUserData(input);

  if (Object.keys(userData).length === 0) {
    return {
      eventId: input.eventId,
      reason: "Meta CAPI user data is not available for matching.",
      status: "skipped" as const,
    };
  }

  const apiVersion = config.apiVersion;
  const endpoint = `https://graph.facebook.com/${apiVersion}/${pixelId}/events`;
  const body = {
    data: [
      {
        action_source: "website" as const,
        custom_data: {
          currency: input.currency,
          order_id: input.eventId,
          value: input.amount,
        },
        event_id: input.eventId,
        event_name: input.eventName ?? "Purchase",
        event_source_url: input.sourceUrl ?? undefined,
        event_time: Math.floor(Date.now() / 1000),
        user_data: userData,
      },
    ],
    test_event_code: input.testEventCode?.trim() || config.testEventCode || undefined,
  };

  try {
    const response = await fetch(`${endpoint}?access_token=${encodeURIComponent(accessToken)}`, {
      body: JSON.stringify(body),
      headers: {
        "content-type": "application/json",
      },
      method: "POST",
    });
    const responseBody = (await response.json().catch(() => null)) as unknown;

    if (!response.ok) {
      return {
        eventId: input.eventId,
        httpStatus: response.status,
        response: sanitizeMetaResponse(responseBody),
        status: "failed" as const,
      };
    }

    return {
      eventId: input.eventId,
      response: sanitizeMetaResponse(responseBody),
      status: "sent" as const,
    };
  } catch (error) {
    return {
      eventId: input.eventId,
      reason: error instanceof Error ? error.message : "Meta CAPI request failed.",
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

function sanitizeMetaResponse(response: unknown) {
  return {
    response,
  };
}

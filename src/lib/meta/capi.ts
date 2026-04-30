import "server-only";

import { createHash } from "node:crypto";

export type MetaCapiEventInput = {
  amount: number;
  currency: "PHP";
  email?: string | null;
  eventId: string;
  eventName?: "PaidConfirmed" | "Purchase";
  pixelId?: string | null;
  phone?: string | null;
  sourceUrl?: string | null;
  testEventCode?: string | null;
};

export async function sendMetaCapiEvent(input: MetaCapiEventInput) {
  const accessToken = process.env.META_CAPI_ACCESS_TOKEN;
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

  const apiVersion = process.env.META_CAPI_API_VERSION ?? "v24.0";
  const endpoint = `https://graph.facebook.com/${apiVersion}/${pixelId}/events`;
  const body = {
    data: [
      {
        action_source: process.env.META_CAPI_ACTION_SOURCE ?? "system_generated",
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
    test_event_code: input.testEventCode ?? process.env.META_CAPI_TEST_EVENT_CODE ?? undefined,
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

function buildUserData(input: MetaCapiEventInput) {
  const userData: Record<string, string[]> = {};
  const email = normalizeEmail(input.email);
  const phone = normalizePhone(input.phone);

  if (email) {
    userData.em = [sha256(email)];
  }

  if (phone) {
    userData.ph = [sha256(phone)];
  }

  return userData;
}

function normalizeEmail(value: string | null | undefined) {
  return value?.trim().toLowerCase() || null;
}

function normalizePhone(value: string | null | undefined) {
  return value?.replaceAll(/\D/g, "") || null;
}

function sha256(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

function sanitizeMetaResponse(response: unknown) {
  return {
    response,
  };
}

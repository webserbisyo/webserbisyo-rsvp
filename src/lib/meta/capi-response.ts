import { createHash } from "node:crypto";

const MAX_META_MESSAGES = 5;
const MAX_META_MESSAGE_LENGTH = 240;
const TEST_CODE_FINGERPRINT_LENGTH = 12;

export type MetaCapiResponseSummary = {
  error: {
    code: string | number | null;
    fbtraceId: string | null;
    message: string | null;
    type: string | null;
  } | null;
  eventsReceived: number | null;
  fbtraceId: string | null;
  messages: string[];
};

export function buildMetaCapiEventEnvelope<T>(event: T, testEventCode: string | null) {
  return {
    data: [event],
    test_event_code: testEventCode?.trim() || undefined,
  };
}

export function summarizeMetaCapiResponse(response: unknown): MetaCapiResponseSummary {
  if (!response || typeof response !== "object") {
    return emptySummary();
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
          code: safeCode(value.error.code),
          fbtraceId: safeString(value.error.fbtrace_id),
          message: safeString(value.error.message),
          type: safeString(value.error.type),
        }
      : null,
    eventsReceived:
      typeof value.events_received === "number" && Number.isFinite(value.events_received)
        ? value.events_received
        : null,
    fbtraceId: safeString(value.fbtrace_id),
    messages: Array.isArray(value.messages)
      ? value.messages
          .filter((message): message is string => typeof message === "string")
          .slice(0, MAX_META_MESSAGES)
          .map((message) => message.slice(0, MAX_META_MESSAGE_LENGTH))
      : [],
  };
}

export function isMetaCapiIngestionConfirmed(summary: MetaCapiResponseSummary) {
  return summary.eventsReceived !== null && summary.eventsReceived >= 1;
}

export function classifyMetaCapiResponse(
  responseOk: boolean,
  summary: MetaCapiResponseSummary,
): "http_failed" | "ingestion_unconfirmed" | "sent" {
  if (!responseOk) return "http_failed";
  return isMetaCapiIngestionConfirmed(summary) ? "sent" : "ingestion_unconfirmed";
}

export function fingerprintMetaTestEventCode(testEventCode: string | null) {
  const normalized = testEventCode?.trim();
  if (!normalized) return null;

  return createHash("sha256")
    .update(normalized)
    .digest("hex")
    .slice(0, TEST_CODE_FINGERPRINT_LENGTH);
}

function emptySummary(): MetaCapiResponseSummary {
  return {
    error: null,
    eventsReceived: null,
    fbtraceId: null,
    messages: [],
  };
}

function safeCode(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : safeString(value);
}

function safeString(value: unknown) {
  return typeof value === "string" ? value.slice(0, MAX_META_MESSAGE_LENGTH) : null;
}

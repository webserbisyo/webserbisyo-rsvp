import "server-only";

import { createHash } from "node:crypto";
import { ServiceError } from "@/server/services/service-error";

type RateLimitBucket = {
  count: number;
  resetAt: number;
};

const WINDOW_MS = 60_000;
const MAX_EVENT_ATTEMPTS_PER_WINDOW = 120;
const MAX_IP_EVENT_ATTEMPTS_PER_WINDOW = 8;
const MAX_BUCKETS = 5_000;
const buckets = new Map<string, RateLimitBucket>();

export function enforceRsvpSubmissionRateLimit(input: {
  clientAddress?: string | null;
  eventSlug: string;
  now?: number;
}) {
  const now = input.now ?? Date.now();

  consumeBucket(`event:${input.eventSlug}`, MAX_EVENT_ATTEMPTS_PER_WINDOW, now);

  if (input.clientAddress) {
    const addressHash = createHash("sha256").update(input.clientAddress).digest("hex");
    consumeBucket(
      `event-ip:${input.eventSlug}:${addressHash}`,
      MAX_IP_EVENT_ATTEMPTS_PER_WINDOW,
      now,
    );
  }

  pruneExpiredBuckets(now);
}

function consumeBucket(key: string, limit: number, now: number) {
  const existing = buckets.get(key);

  if (!existing || existing.resetAt <= now) {
    buckets.set(key, {
      count: 1,
      resetAt: now + WINDOW_MS,
    });
    return;
  }

  if (existing.count >= limit) {
    throw new ServiceError("Too many RSVP attempts. Please wait a minute and try again.", {
      code: "RATE_LIMITED",
    });
  }

  existing.count += 1;
}

function pruneExpiredBuckets(now: number) {
  if (buckets.size <= MAX_BUCKETS) {
    return;
  }

  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) {
      buckets.delete(key);
    }
  }
}

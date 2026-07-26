import "server-only";

import { createHash } from "node:crypto";

type Bucket = {
  count: number;
  resetAt: number;
};

const WINDOW_MS = 15 * 60_000;
const MAX_EMAIL_REQUESTS = 3;
const MAX_IP_REQUESTS = 10;
const buckets = new Map<string, Bucket>();
const inFlightEmails = new Set<string>();

export function canRequestPasswordReset(input: {
  clientAddress?: string | null;
  email: string;
  now?: number;
}) {
  const now = input.now ?? Date.now();
  const emailKey = `email:${hash(input.email)}`;

  if (!consume(emailKey, MAX_EMAIL_REQUESTS, now)) {
    return false;
  }

  if (input.clientAddress && !consume(`ip:${hash(input.clientAddress)}`, MAX_IP_REQUESTS, now)) {
    return false;
  }

  return true;
}

export async function withPasswordResetRequestLock<T>(
  email: string,
  operation: () => Promise<T>,
): Promise<T | null> {
  const key = hash(email);

  if (inFlightEmails.has(key)) {
    return null;
  }

  inFlightEmails.add(key);

  try {
    return await operation();
  } finally {
    inFlightEmails.delete(key);
  }
}

function consume(key: string, limit: number, now: number) {
  const existing = buckets.get(key);

  if (!existing || existing.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }

  if (existing.count >= limit) {
    return false;
  }

  existing.count += 1;
  return true;
}

function hash(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

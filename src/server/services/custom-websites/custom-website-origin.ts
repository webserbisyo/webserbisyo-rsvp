import "server-only";

import { lookup } from "node:dns/promises";
import net from "node:net";
import { ServiceError } from "@/server/services/service-error";

const LOCALHOST_NAMES = new Set(["localhost"]);
const LOOPBACK_IPS = new Set(["127.0.0.1", "::1", "0:0:0:0:0:0:0:1"]);

export function normalizeCustomFrontendOrigin(value: string) {
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

  if (!["http:", "https:"].includes(url.protocol)) {
    throw new ServiceError("Custom frontend origins must use HTTP or HTTPS.");
  }

  if (process.env.NODE_ENV === "production" && url.protocol !== "https:") {
    throw new ServiceError("Production custom frontend origins must use HTTPS.");
  }

  if (url.username || url.password) {
    throw new ServiceError("Custom frontend origins cannot include credentials.");
  }

  if (url.pathname !== "/" || url.search || url.hash) {
    url.pathname = "/";
    url.search = "";
    url.hash = "";
  }

  const hostname = normalizeHostname(url.hostname);
  const isLocalhost = isLocalhostName(hostname) || LOOPBACK_IPS.has(hostname);

  if (process.env.NODE_ENV !== "development" && isLocalhost) {
    throw new ServiceError("Localhost origins are allowed only in development.");
  }

  if (process.env.NODE_ENV !== "development" && url.protocol !== "https:") {
    throw new ServiceError("Custom frontend origins must use HTTPS.");
  }

  if (net.isIP(hostname) && isPrivateIp(hostname)) {
    throw new ServiceError("Custom frontend origins cannot use private or reserved IP addresses.");
  }

  return url.origin;
}

export async function assertSafeCustomFrontendOriginForFetch(origin: string) {
  const normalizedOrigin = normalizeCustomFrontendOrigin(origin);
  const hostname = normalizeHostname(new URL(normalizedOrigin).hostname);

  if (process.env.NODE_ENV === "development" && isLocalhostName(hostname)) {
    return normalizedOrigin;
  }

  if (net.isIP(hostname)) {
    if (isPrivateIp(hostname)) {
      throw new ServiceError(
        "Custom frontend origins cannot use private or reserved IP addresses.",
      );
    }

    return normalizedOrigin;
  }

  let addresses: Array<{ address: string }> = [];

  try {
    addresses = await lookup(hostname, { all: true, verbatim: true });
  } catch {
    throw new ServiceError("Custom frontend origin hostname could not be resolved.");
  }

  if (addresses.length === 0 || addresses.some((entry) => isPrivateIp(entry.address))) {
    throw new ServiceError("Custom frontend origin resolved to a private or reserved network.");
  }

  return normalizedOrigin;
}

function normalizeHostname(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/^\[|\]$/g, "")
    .replace(/\.+$/, "");
}

function isLocalhostName(value: string) {
  return LOCALHOST_NAMES.has(value);
}

function isPrivateIp(value: string) {
  if (LOOPBACK_IPS.has(value)) {
    return true;
  }

  if (net.isIPv4(value)) {
    const parts = value.split(".").map((part) => Number(part));
    const [a = 0, b = 0] = parts;

    return (
      a === 0 ||
      a === 10 ||
      a === 127 ||
      (a === 100 && b >= 64 && b <= 127) ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      a >= 224
    );
  }

  if (net.isIPv6(value)) {
    const normalized = value.toLowerCase();

    return (
      normalized === "::" ||
      normalized === "::1" ||
      normalized.startsWith("fc") ||
      normalized.startsWith("fd") ||
      normalized.startsWith("fe80:") ||
      normalized.startsWith("ff")
    );
  }

  return false;
}

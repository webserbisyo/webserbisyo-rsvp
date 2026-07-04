"use server";

import { headers } from "next/headers";
import { ApplicationSchema } from "@/lib/validations/application.schema";
import { submitApplication } from "@/server/services/submit-application";
import { actionFailure, actionSuccess, parseActionInput } from "./action-utils";

export async function submitApplicationAction(input: unknown) {
  try {
    const payload = parseActionInput(ApplicationSchema, input);
    const requestContext = await getRequestContext();
    const application = await submitApplication(payload, requestContext);

    return actionSuccess({
      applicationId: application.id,
      preferredManualPaymentOption: application.preferred_manual_payment_option,
      referenceCode: application.reference_code,
      status: application.status,
    });
  } catch (error) {
    return actionFailure(error);
  }
}

async function getRequestContext() {
  const requestHeaders = await headers();
  const clientIpAddress =
    requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    requestHeaders.get("x-real-ip") ??
    null;
  const clientUserAgent = requestHeaders.get("user-agent") ?? null;
  const eventSourceUrl = `${getRequestOrigin(requestHeaders)}/apply/success`;

  return {
    clientIpAddress,
    clientUserAgent,
    eventSourceUrl,
  };
}

function getRequestOrigin(requestHeaders: Headers) {
  const officialOrigin = getConfiguredOfficialOrigin(
    process.env.NEXT_PUBLIC_APP_URL,
    process.env.NEXT_PUBLIC_SITE_URL,
    process.env.SITE_URL,
    process.env.APP_BASE_URL,
  );

  if (officialOrigin) {
    return officialOrigin;
  }

  if (process.env.VERCEL_ENV === "production") {
    return "https://rsvp.webserbisyo.com";
  }

  const configuredOrigin = normalizeOrigin(process.env.NEXT_PUBLIC_APP_URL);

  if (configuredOrigin) {
    return configuredOrigin;
  }

  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host");
  const protocol = requestHeaders.get("x-forwarded-proto")?.split(",")[0]?.trim() ?? "https";

  if (host) {
    return `${protocol}://${host.split(",")[0]?.trim()}`.replace(/\/+$/, "");
  }

  return "https://rsvp.webserbisyo.com";
}

function getConfiguredOfficialOrigin(...values: Array<string | null | undefined>) {
  for (const value of values) {
    const origin = normalizeOrigin(value);

    if (origin && !isVercelOrigin(origin)) {
      return origin;
    }
  }

  return null;
}

function normalizeOrigin(value?: string | null) {
  const trimmed = value?.trim();

  if (!trimmed) {
    return null;
  }

  try {
    const url = new URL(/^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`);
    return url.origin.replace(/\/+$/, "");
  } catch {
    return null;
  }
}

function isVercelOrigin(value: string) {
  try {
    const hostname = new URL(value).hostname.toLowerCase();
    return hostname === "vercel.app" || hostname.endsWith(".vercel.app");
  } catch {
    return false;
  }
}

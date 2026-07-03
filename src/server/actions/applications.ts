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
  const configuredOrigin = process.env.NEXT_PUBLIC_APP_URL?.trim();

  if (configuredOrigin) {
    return configuredOrigin.replace(/\/+$/, "");
  }

  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host");
  const protocol = requestHeaders.get("x-forwarded-proto")?.split(",")[0]?.trim() ?? "https";

  if (host) {
    return `${protocol}://${host.split(",")[0]?.trim()}`.replace(/\/+$/, "");
  }

  return "https://rsvp.webserbisyo.com";
}

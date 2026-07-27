import { ZodError } from "zod";
import {
  notFoundJson,
  publicApiErrorJson,
  publicApiSuccessJson,
} from "@/lib/public-api";
import { PublicEventSlugSchema } from "@/lib/event-website/public-event";
import { getPrivateAccessTokenFromSearchParams, normalizePrivateAccessToken } from "@/lib/private-access";
import { type PublicRsvpSubmitSuccess } from "@/lib/validations/rsvp-response.schema";
import { ServiceError } from "@/server/services/service-error";
import { submitRsvpResponse } from "@/server/services/submit-rsvp-response";

export async function POST(
  request: Request,
  context: { params: Promise<{ eventSlug: string }> },
) {
  const { eventSlug } = await context.params;
  const parsedSlug = PublicEventSlugSchema.safeParse(eventSlug);

  if (!parsedSlug.success) {
    return publicApiErrorJson({
      code: "bad_request",
      message: "Invalid event slug.",
      scope: "public-rsvp-submit",
      status: 400,
    });
  }

  let rawBody: unknown;
  const accessTokenFromQuery = getPrivateAccessTokenFromSearchParams(new URL(request.url).searchParams);

  try {
    rawBody = await request.json();
  } catch {
    return publicApiErrorJson({
      code: "bad_request",
      message: "Request body must be valid JSON.",
      scope: "public-rsvp-submit",
      status: 400,
    });
  }

  try {
    const response = await submitRsvpResponse(
      {
        ...(rawBody && typeof rawBody === "object" ? rawBody : {}),
        eventSlug: parsedSlug.data,
      },
      {
        accessToken:
          accessTokenFromQuery ||
          (rawBody && typeof rawBody === "object"
            ? normalizePrivateAccessToken(
                (rawBody as { accessToken?: unknown }).accessToken as string | undefined,
              )
            : null),
        clientAddress:
          request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
          request.headers.get("x-real-ip") ??
          null,
        source: "public_custom_frontend",
      },
    );

    if (!response) {
      throw new Error("Failed to submit RSVP response.");
    }

    const data: PublicRsvpSubmitSuccess = {
      responseId: response.id,
      submittedAt: response.submitted_at,
    };

    return publicApiSuccessJson(data, 201);
  } catch (error) {
    if (error instanceof ZodError) {
      return publicApiErrorJson({
        code: "bad_request",
        fieldErrors: error.flatten().fieldErrors,
        message: "Please check the submitted fields.",
        scope: "public-rsvp-submit",
        status: 400,
      });
    }

    if (error instanceof ServiceError) {
      const status = getSubmitErrorStatus(error);

      if (status === 404) {
        return notFoundJson("public-rsvp-submit", error.message);
      }

      return publicApiErrorJson({
        code: "request_rejected",
        message: error.message,
        scope: "public-rsvp-submit",
        status,
      });
    }

    return publicApiErrorJson({
      code: "internal_error",
      message: "The RSVP could not be submitted.",
      scope: "public-rsvp-submit",
      status: 500,
    });
  }
}

function getSubmitErrorStatus(error: ServiceError) {
  if (
    error.cause &&
    typeof error.cause === "object" &&
    "code" in error.cause &&
    error.cause.code === "RATE_LIMITED"
  ) {
    return 429;
  }

  const message = error.message;
  if (
    message === "RSVP event is not available." ||
    message === "RSVP form is not available for this event." ||
    message === "This private event link is not available."
  ) {
    return 404;
  }

  return 400;
}

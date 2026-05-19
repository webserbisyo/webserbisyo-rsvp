import { ZodError } from "zod";
import {
  notFoundJson,
  publicApiErrorJson,
  publicApiSuccessJson,
} from "@/lib/public-api";
import { PublicEventSlugSchema } from "@/lib/event-website/public-event";
import {
  PublicRsvpResponseFieldsSchema,
  type PublicRsvpSubmitSuccess,
} from "@/lib/validations/rsvp-response.schema";
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

  const parsedBody = PublicRsvpResponseFieldsSchema.safeParse(rawBody);

  if (!parsedBody.success) {
    return publicApiErrorJson({
      code: "bad_request",
      fieldErrors: parsedBody.error.flatten().fieldErrors,
      message: "Please check the submitted fields.",
      scope: "public-rsvp-submit",
      status: 400,
    });
  }

  try {
    const response = await submitRsvpResponse({
      ...parsedBody.data,
      eventSlug: parsedSlug.data,
    });
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
      const status = getSubmitErrorStatus(error.message);

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

function getSubmitErrorStatus(message: string) {
  if (
    message === "RSVP event is not available." ||
    message === "RSVP form is not available for this event."
  ) {
    return 404;
  }

  return 400;
}

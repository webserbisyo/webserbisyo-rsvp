import { notFoundJson, publicApiErrorJson, publicApiSuccessJson } from "@/lib/public-api";
import { PublicEventSlugSchema } from "@/lib/event-website/public-event";
import { getPrivateAccessTokenFromSearchParams } from "@/lib/private-access";
import { logEventWebsiteOperation } from "@/server/services/event-website-operation-log";
import { EventWebsiteContentIntegrityError } from "@/server/services/event-website-resolution";
import { resolvePublicEventWebsiteResult } from "@/server/services/resolve-public-event-website";

export async function GET(
  request: Request,
  context: { params: Promise<{ eventSlug: string }> },
) {
  const { eventSlug } = await context.params;
  const parsedSlug = PublicEventSlugSchema.safeParse(eventSlug);

  if (!parsedSlug.success) {
    return publicApiErrorJson({
      code: "bad_request",
      message: "Invalid event slug.",
      scope: "public-event",
      status: 400,
    });
  }

  try {
    const result = await resolvePublicEventWebsiteResult(
      parsedSlug.data,
      getPrivateAccessTokenFromSearchParams(new URL(request.url).searchParams),
    );

    if (result.status !== "RESOLVED") {
      logEventWebsiteOperation("warn", {
        category: result.status,
        eventId: "unresolved",
        operation: "public_resolve",
        stage: "failed",
      });
      return notFoundJson("public-event", "Published event not found.");
    }

    return publicApiSuccessJson(result.data);
  } catch (error) {
    if (error instanceof EventWebsiteContentIntegrityError) {
      logEventWebsiteOperation("error", {
        category: error.code,
        eventId: error.eventId,
        issuePaths: error.issuePaths,
        operation: "public_resolve",
        stage: "failed",
      });
      return publicApiErrorJson({
        code: "event_content_unavailable",
        message: "Event data is temporarily unavailable.",
        scope: "public-event",
        status: 503,
      });
    }

    return publicApiErrorJson({
      code: "internal_error",
      message: "The public event could not be loaded.",
      scope: "public-event",
      status: 500,
    });
  }
}

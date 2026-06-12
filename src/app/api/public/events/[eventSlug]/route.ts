import { notFoundJson, publicApiErrorJson, publicApiSuccessJson } from "@/lib/public-api";
import { PublicEventSlugSchema } from "@/lib/event-website/public-event";
import { getPrivateAccessTokenFromSearchParams } from "@/lib/private-access";
import { resolvePublicEventWebsite } from "@/server/services/resolve-public-event-website";

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
    const event = await resolvePublicEventWebsite(
      parsedSlug.data,
      getPrivateAccessTokenFromSearchParams(new URL(request.url).searchParams),
    );

    if (!event) {
      return notFoundJson("public-event", "Published event not found.");
    }

    return publicApiSuccessJson(event);
  } catch {
    return publicApiErrorJson({
      code: "internal_error",
      message: "The public event could not be loaded.",
      scope: "public-event",
      status: 500,
    });
  }
}

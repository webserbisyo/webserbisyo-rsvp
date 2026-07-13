import { PublicEventSlugSchema } from "@/lib/event-website/public-event";
import { logEventWebsiteOperation } from "@/server/services/event-website-operation-log";
import { verifyEventWebsitePreviewToken } from "@/server/services/event-website-preview-token";
import { resolveDraftEventWebsitePreview } from "@/server/services/resolve-draft-event-website-preview";

const NO_STORE_HEADERS = {
  "Cache-Control": "private, no-store, max-age=0",
  "Content-Type": "application/json",
};

export async function GET(request: Request, context: { params: Promise<{ eventSlug: string }> }) {
  const { eventSlug } = await context.params;
  const parsedSlug = PublicEventSlugSchema.safeParse(eventSlug);
  const token = getBearerToken(request) ?? new URL(request.url).searchParams.get("previewToken");
  const claims = token ? verifyEventWebsitePreviewToken(token) : null;
  const safeEventId = claims?.eventId ?? "unresolved";

  if (!parsedSlug.success || !claims || claims.eventSlug !== parsedSlug.data) {
    logEventWebsiteOperation("warn", {
      category: !token ? "missing_token" : "invalid_token",
      eventId: safeEventId,
      operation: "draft_preview",
      stage: "authorization_failed",
    });
    return Response.json(
      { error: { code: "forbidden", message: "Draft preview access is invalid or expired." } },
      { headers: NO_STORE_HEADERS, status: 403 },
    );
  }

  try {
    const event = await resolveDraftEventWebsitePreview({
      clientId: claims.clientId,
      eventId: claims.eventId,
      eventSlug: claims.eventSlug,
    });

    if (!event) {
      return Response.json(
        { error: { code: "not_found", message: "Saved draft preview not found." } },
        { headers: NO_STORE_HEADERS, status: 404 },
      );
    }

    return Response.json({ data: event }, { headers: NO_STORE_HEADERS });
  } catch {
    logEventWebsiteOperation("error", {
      category: "fetch_failed",
      eventId: claims.eventId,
      operation: "draft_preview",
      stage: "failed",
    });
    return Response.json(
      {
        error: { code: "internal_error", message: "The saved draft preview could not be loaded." },
      },
      { headers: NO_STORE_HEADERS, status: 500 },
    );
  }
}

function getBearerToken(request: Request) {
  const authorization = request.headers.get("authorization");
  return authorization?.startsWith("Bearer ") ? authorization.slice(7).trim() : null;
}

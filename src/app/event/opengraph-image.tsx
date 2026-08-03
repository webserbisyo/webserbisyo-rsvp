import { createEventFallbackImage } from "@/lib/social/event-fallback-image";
import { SOCIAL_PREVIEWS } from "@/config/social-previews";

export const alt = SOCIAL_PREVIEWS.eventFallback.alt;
export const contentType = "image/png";
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const size = {
  height: 630,
  width: 1200,
};

export default function Image() {
  return createEventFallbackImage();
}

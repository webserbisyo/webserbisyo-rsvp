import "server-only";

import { resolvePublicEvent } from "@/server/services/resolve-public-event";

export async function getPublicRsvpData(eventSlug: string) {
  return resolvePublicEvent(eventSlug);
}

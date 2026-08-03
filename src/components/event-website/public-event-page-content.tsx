import { EventWebsiteRenderer } from "@/components/event-website/event-website-renderer";
import { PublicMetaPixelScripts } from "@/components/meta-pixels/public-meta-pixel-scripts";
import type { PublicEventDto } from "@/lib/event-website/public-event";
import type { PublicMetaPixelConfig } from "@/server/queries/public-meta-pixels";
export {
  buildPublicEventMetadata,
  buildStandalonePublicRsvpMetadata,
} from "@/lib/event-website/public-event-metadata";

export function PublicEventPageContent({
  event,
  pixels,
}: {
  event: PublicEventDto;
  pixels: PublicMetaPixelConfig[];
}) {
  return (
    <main className="event-website-public-page min-h-screen bg-[linear-gradient(180deg,#fff8ef_0%,#ffffff_55%,#fff6ec_100%)] text-slate-900">
      <PublicMetaPixelScripts eventName="ViewContent" pixels={pixels} />

      <div className="event-preview-public-shell">
        <div className="event-preview-frame event-preview-frame--public">
          {/* Public event pages render from the published snapshot only, never from mutable draft content. */}
          <EventWebsiteRenderer
            draft={event.renderModel}
            guestbookMessages={event.guestbookMessages}
            hideEmptyGuestbook
            publicRsvp={{
              availabilityMessage: event.rsvp.availabilityMessage,
              eventSlug: event.eventSlug,
              isAcceptingResponses: event.rsvp.isAcceptingResponses,
              settings: event.rsvp.settings,
            }}
            sections={event.sections}
          />
        </div>
      </div>
    </main>
  );
}

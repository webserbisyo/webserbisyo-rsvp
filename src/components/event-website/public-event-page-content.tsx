import type { Metadata } from "next";
import { EventWebsiteRenderer } from "@/components/event-website/event-website-renderer";
import { PublicMetaPixelScripts } from "@/components/meta-pixels/public-meta-pixel-scripts";
import {
  formatEventWebsiteDate,
  formatEventWebsiteTime,
} from "@/lib/event-website/formatting";
import type { PublicEventDto } from "@/lib/event-website/public-event";
import { getBestPublicRsvpUrl } from "@/lib/public-rsvp-url";
import type { PublicMetaPixelConfig } from "@/server/queries/public-meta-pixels";

export function buildPublicEventMetadata(event: PublicEventDto | null): Metadata {
  if (!event) {
    return {
      description: "Published event website.",
      robots: {
        follow: false,
        index: false,
      },
      title: "Event Website",
    };
  }

  const displayName = event.renderModel.coupleInfo.displayAs.trim() || event.eventTitle;
  const summaryParts = [
    formatPublicDate(event.eventDate),
    formatPublicTime(event.eventTime),
    event.venueName,
  ].filter(Boolean);
  const canonicalUrl = getBestPublicRsvpUrl({
    slug: event.eventSlug,
    subdomain: event.subdomainSlug,
  });

  return {
    alternates:
      event.visibility === "private"
        ? undefined
        : canonicalUrl
          ? {
              canonical: canonicalUrl,
            }
          : undefined,
    description:
      summaryParts.length > 0
        ? `${displayName} event details. ${summaryParts.join(" • ")}`
        : `${displayName} event details and RSVP information.`,
    robots:
      event.visibility === "private"
        ? {
            follow: false,
            index: false,
          }
        : undefined,
    title: displayName,
  };
}

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

function formatPublicDate(value: string | null) {
  return value ? formatEventWebsiteDate(value, "") || null : null;
}

function formatPublicTime(value: string | null) {
  return value ? formatEventWebsiteTime(value, "") || null : null;
}

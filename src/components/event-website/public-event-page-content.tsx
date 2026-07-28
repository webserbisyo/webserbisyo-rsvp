import type { Metadata } from "next";
import { EventWebsiteRenderer } from "@/components/event-website/event-website-renderer";
import { PublicMetaPixelScripts } from "@/components/meta-pixels/public-meta-pixel-scripts";
import type { PublicEventDto } from "@/lib/event-website/public-event";
import { getBestPublicRsvpUrl, getOfficialPublicAppUrl } from "@/lib/public-rsvp-url";
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
    event.formatted.eventDateLabel,
    event.formatted.eventTimeLabel,
    event.venueName,
  ].filter(Boolean);
  const canonicalUrl = getBestPublicRsvpUrl({
    slug: event.eventSlug,
    subdomain: event.subdomainSlug,
  });
  const description =
    summaryParts.length > 0
      ? `${displayName} event details. ${summaryParts.join(" • ")}`
      : `${displayName} event details and RSVP information.`;

  const giftOptionImage = event.sectionsByKey.gift_details?.options?.find(
    (opt) => opt.image?.url && /^https?:\/\//i.test(opt.image.url.trim()),
  )?.image?.url?.trim();
  const heroImageUrl = giftOptionImage || null;
  const officialAppUrl = getOfficialPublicAppUrl();
  const genericPlatformOgImage = `${officialAppUrl}/opengraph-image`;

  return {
    alternates:
      event.visibility === "private"
        ? undefined
        : canonicalUrl
          ? {
              canonical: canonicalUrl,
            }
          : undefined,
    description,
    openGraph: {
      description,
      images: heroImageUrl
        ? [
            {
              alt: `${displayName} event invitation`,
              url: heroImageUrl,
            },
          ]
        : [
            {
              alt: "WebSerbisyo RSVP Event Website",
              height: 630,
              type: "image/png",
              url: genericPlatformOgImage,
              width: 1200,
            },
          ],
      siteName: "WebSerbisyo RSVP",
      title: displayName,
      type: "website",
      url: canonicalUrl ?? undefined,
    },
    robots:
      event.visibility === "private"
        ? {
            follow: false,
            index: false,
          }
        : undefined,
    title: displayName,
    twitter: {
      card: "summary_large_image",
      description,
      images: heroImageUrl ? [heroImageUrl] : [genericPlatformOgImage],
      title: displayName,
    },
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

import type { Metadata } from "next";
import { getVersionedSocialImage, SOCIAL_PREVIEWS } from "@/config/social-previews";
import type { PublicEventDto } from "@/lib/event-website/public-event";
import {
  buildOfficialPublicRsvpStandaloneUrl,
  getBestPublicRsvpUrl,
  getOfficialPublicAppUrl,
} from "@/lib/public-rsvp-url";

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
  const socialImage = getEventSocialImage(event, displayName);

  return {
    alternates:
      event.visibility === "private"
        ? undefined
        : canonicalUrl
          ? { canonical: canonicalUrl }
          : undefined,
    description,
    openGraph: {
      description,
      images: [socialImage],
      siteName: "WebSerbisyo RSVP",
      title: displayName,
      type: "website",
      url: canonicalUrl ?? undefined,
    },
    robots: event.visibility === "private" ? { follow: false, index: false } : undefined,
    title: displayName,
    twitter: {
      card: "summary_large_image",
      description,
      images: [socialImage.url],
      title: displayName,
    },
  };
}

export function buildStandalonePublicRsvpMetadata(event: PublicEventDto): Metadata {
  const displayName = event.renderModel.coupleInfo.displayAs.trim() || event.eventTitle;
  const description = `Confirm your attendance and view the important details for ${displayName}.`;
  const canonicalUrl =
    event.visibility === "private"
      ? undefined
      : buildOfficialPublicRsvpStandaloneUrl(event.eventSlug);
  const socialImage = getEventSocialImage(event, displayName);

  return {
    alternates: canonicalUrl ? { canonical: canonicalUrl } : undefined,
    description,
    openGraph: {
      description,
      images: [socialImage],
      siteName: "WebSerbisyo RSVP",
      title: `RSVP for ${displayName}`,
      type: "website",
      url: canonicalUrl,
    },
    robots: event.visibility === "private" ? { follow: false, index: false } : undefined,
    title: `RSVP for ${displayName}`,
    twitter: {
      card: "summary_large_image",
      description,
      images: [socialImage.url],
      title: `RSVP for ${displayName}`,
    },
  };
}

function getEventSocialImage(event: PublicEventDto, displayName: string) {
  const giftOptionImage = event.sectionsByKey.gift_details?.options
    ?.find((opt) => opt.image?.url && /^https?:\/\//i.test(opt.image.url.trim()))
    ?.image?.url?.trim();

  if (giftOptionImage) {
    return {
      alt: `${displayName} event invitation`,
      url: giftOptionImage,
    };
  }

  return {
    alt: SOCIAL_PREVIEWS.eventFallback.alt,
    height: 630,
    type: "image/png",
    url: `${getOfficialPublicAppUrl()}${getVersionedSocialImage(SOCIAL_PREVIEWS.eventFallback)}`,
    width: 1200,
  };
}

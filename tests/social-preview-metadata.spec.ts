import { expect, test } from "@playwright/test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  buildPublicEventMetadata,
  buildStandalonePublicRsvpMetadata,
} from "../src/lib/event-website/public-event-metadata";
import { SOCIAL_PREVIEWS, getVersionedSocialImage } from "../src/config/social-previews";
import type { PublicEventDto } from "../src/lib/event-website/public-event";

test("public social preview URLs are versioned by route", () => {
  expect(getVersionedSocialImage(SOCIAL_PREVIEWS.marketing)).toBe(
    "/marketing/opengraph-image?v=2026-08-hero-v1",
  );
  expect(getVersionedSocialImage(SOCIAL_PREVIEWS.apply)).toBe(
    "/apply/opengraph-image?v=2026-08-apply-v1",
  );
  expect(getVersionedSocialImage(SOCIAL_PREVIEWS.eventFallback)).toBe(
    "/event/opengraph-image?v=2026-08-event-v1",
  );
});

test("event metadata keeps a qualifying event image and otherwise uses the neutral fallback", () => {
  const fallbackMetadata = buildPublicEventMetadata(createEvent());
  const fallbackImage = getFirstOpenGraphImage(fallbackMetadata);

  expect(fallbackImage.url).toBe(
    "https://rsvp.webserbisyo.com/event/opengraph-image?v=2026-08-event-v1",
  );
  expect(fallbackImage.alt).toBe(SOCIAL_PREVIEWS.eventFallback.alt);

  const eventImage = "https://example.com/event-invitation.png";
  const eventMetadata = buildPublicEventMetadata(
    createEvent({
      gift_details: {
        options: [{ image: { url: eventImage } }],
      },
    }),
  );

  expect(getFirstOpenGraphImage(eventMetadata).url).toBe(eventImage);
});

test("standalone RSVP metadata is event-aware and uses the same fallback policy", () => {
  const metadata = buildStandalonePublicRsvpMetadata(createEvent());

  expect(metadata.title).toBe("RSVP for Jamie & Alex");
  expect(getFirstOpenGraphImage(metadata).url).toBe(
    "https://rsvp.webserbisyo.com/event/opengraph-image?v=2026-08-event-v1",
  );
});

test("legacy image and private metadata routes do not retain obsolete marketing copy", () => {
  const legacyImage = readSource("src/app/opengraph-image.tsx");
  const rootLayout = readSource("src/app/layout.tsx");
  const applyStart = readSource("src/app/(public)/apply/start/page.tsx");
  const applySuccess = readSource("src/app/(public)/apply/success/page.tsx");
  const authLayout = readSource("src/app/(auth)/layout.tsx");
  const manageRoute = readSource("src/app/(public)/r/[slug]/manage/[token]/page.tsx");

  expect(legacyImage).not.toContain("Premium digital RSVP websites");
  expect(legacyImage).not.toContain("Start application");
  expect(rootLayout).not.toContain('url: "/opengraph-image"');
  expect(rootLayout).not.toContain('images: ["/opengraph-image"]');
  expect(applyStart).toContain("index: false");
  expect(applyStart).toContain("follow: false");
  expect(applySuccess).toContain("index: false");
  expect(applySuccess).toContain("follow: false");
  expect(authLayout).toContain("index: false");
  expect(manageRoute).toContain("index: false");
  expect(manageRoute).toContain("follow: false");
});

function createEvent(sectionsByKey: Record<string, unknown> = {}): PublicEventDto {
  return {
    eventSlug: "jamie-alex",
    eventTitle: "Jamie & Alex",
    formatted: {
      eventDateLabel: "Saturday, August 3",
      eventTimeLabel: "4:00 PM",
    },
    renderModel: {
      coupleInfo: {
        displayAs: "Jamie & Alex",
      },
    },
    sectionsByKey,
    subdomainSlug: null,
    venueName: "Garden Venue",
    visibility: "public",
  } as unknown as PublicEventDto;
}

function getFirstOpenGraphImage(metadata: ReturnType<typeof buildPublicEventMetadata>) {
  const openGraph = metadata.openGraph as { images: Array<{ alt: string; url: string }> };
  return openGraph.images[0]!;
}

function readSource(relativePath: string) {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

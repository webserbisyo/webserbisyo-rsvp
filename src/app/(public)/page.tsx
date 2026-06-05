import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { PublicEventPageContent, buildPublicRsvpMetadata } from "@/components/event-website/public-event-page-content";
import { LandingMessageHero } from "@/components/landing/landing-message-hero";
import { LandingNavbar } from "@/components/landing/landing-navbar";
import { LandingVisualHero } from "@/components/landing/landing-visual-hero";
import { extractPublicRsvpSubdomainSlug } from "@/lib/public-rsvp-host";
import { getRsvpBaseDomain } from "@/lib/public-rsvp-url";
import { getPublicMetaPixelsForRoute } from "@/server/queries/public-meta-pixels";
import { resolvePublicEventWebsiteBySubdomain } from "@/server/services/resolve-public-event-website";

const landingMetadata: Metadata = {
  title: "WebSerbisyo RSVP — Digital RSVP websites for Filipino celebrations",
  description:
    "Launch a polished RSVP page for your event. Collect guest responses and manage your guestbook from one organized dashboard.",
};

export async function generateMetadata(): Promise<Metadata> {
  const event = await resolveWildcardHostEvent();

  return event ? buildPublicRsvpMetadata(event) : landingMetadata;
}

export default async function PublicLandingPage() {
  const event = await resolveWildcardHostEvent();

  if (event) {
    const pixels = await getPublicMetaPixelsForRoute({
      eventSlug: event.eventSlug,
      route: "event_page",
    });

    return <PublicEventPageContent event={event} pixels={pixels} />;
  }

  if (await isWildcardHostRequest()) {
    notFound();
  }

  return (
    <>
      <LandingNavbar />
      <main>
        <LandingVisualHero />
        <LandingMessageHero />
      </main>
    </>
  );
}

async function resolveWildcardHostEvent() {
  const host = await getRequestHost();
  const subdomain = host ? extractPublicRsvpSubdomainSlug(host) : null;

  if (!subdomain) {
    return null;
  }

  return resolvePublicEventWebsiteBySubdomain(subdomain);
}

async function isWildcardHostRequest() {
  const host = await getRequestHost();
  const normalizedHost = host?.trim().toLowerCase().split(":")[0] ?? null;
  const wildcardBaseDomain = getRsvpBaseDomain();

  return Boolean(
    normalizedHost &&
      wildcardBaseDomain &&
      normalizedHost !== wildcardBaseDomain &&
      normalizedHost.endsWith(`.${wildcardBaseDomain}`),
  );
}

async function getRequestHost() {
  const requestHeaders = await headers();
  const forwardedHost = requestHeaders.get("x-forwarded-host");

  if (forwardedHost) {
    return forwardedHost.split(",")[0]?.trim() ?? null;
  }

  return requestHeaders.get("host");
}

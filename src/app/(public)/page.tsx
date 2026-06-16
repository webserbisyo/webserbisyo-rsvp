import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import {
  PublicEventPageContent,
  buildPublicEventMetadata,
} from "@/components/event-website/public-event-page-content";
import { LandingNavbar } from "@/components/landing/landing-navbar";
import { LandingVisualHero } from "@/components/landing/landing-visual-hero";
import { extractPublicRsvpSubdomainSlug } from "@/lib/public-rsvp-host";
import { getPrivateAccessTokenFromSearchParams } from "@/lib/private-access";
import { getRsvpBaseDomain } from "@/lib/public-rsvp-url";
import { getPublicMetaPixelsForRoute } from "@/server/queries/public-meta-pixels";
import { resolvePublicEventWebsiteBySubdomain } from "@/server/services/resolve-public-event-website";

const landingMetadata: Metadata = {
  title: "WebSerbisyo RSVP — Digital RSVP websites for Filipino celebrations",
  description:
    "Launch a polished RSVP page for your event. Collect guest responses and manage your guestbook from one organized dashboard.",
};

type PublicLandingPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({
  searchParams,
}: PublicLandingPageProps = {}): Promise<Metadata> {
  const event = await resolveWildcardHostEvent(await searchParams);

  if (event) {
    return buildPublicEventMetadata(event);
  }

  if (await isWildcardHostRequest()) {
    return {
      title: "Event unavailable | WebSerbisyo RSVP",
      description: "This event website is not currently available.",
      robots: { index: false, follow: false },
    };
  }

  return landingMetadata;
}

export default async function PublicLandingPage({ searchParams }: PublicLandingPageProps) {
  const event = await resolveWildcardHostEvent(await searchParams);

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
      </main>
    </>
  );
}

async function resolveWildcardHostEvent(
  searchParams?: Record<string, string | string[] | undefined>,
) {
  const host = await getRequestHost();
  const subdomain = host ? extractPublicRsvpSubdomainSlug(host) : null;

  if (!subdomain) {
    return null;
  }

  const requestSearchParams = new URLSearchParams();
  const access = Array.isArray(searchParams?.access)
    ? searchParams?.access[0]
    : searchParams?.access;

  if (access) {
    requestSearchParams.set("access", access);
  }

  return resolvePublicEventWebsiteBySubdomain(
    subdomain,
    getPrivateAccessTokenFromSearchParams(requestSearchParams),
  );
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

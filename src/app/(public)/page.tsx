import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import {
  PublicEventPageContent,
  buildPublicEventMetadata,
} from "@/components/event-website/public-event-page-content";
import { LandingNavbar } from "@/components/landing/landing-navbar";
import { LandingVisualHero } from "@/components/landing/landing-visual-hero";
import { LandingTrustBar } from "@/components/landing/landing-trust-bar";
import { LandingHowItWorks } from "@/components/landing/landing-how-it-works";
import { LandingFeatures } from "@/components/landing/landing-features";
import { LandingTrustPromise } from "@/components/landing/landing-trust-promise";
import { LandingPricing } from "@/components/landing/landing-pricing";
import { LandingFAQ } from "@/components/landing/landing-faq";
import { LandingFooter } from "@/components/landing/landing-footer";
import { PublicMetaPixelScripts } from "@/components/meta-pixels/public-meta-pixel-scripts";
import { extractPublicRsvpSubdomainSlug } from "@/lib/public-rsvp-host";
import { getPrivateAccessTokenFromSearchParams } from "@/lib/private-access";
import { getRsvpBaseDomain } from "@/lib/public-rsvp-url";
import { getMarketingJsonLd } from "@/lib/seo/json-ld";
import { getPublicMetaPixelsForRoute } from "@/server/queries/public-meta-pixels";
import { getPublicApplyConfig } from "@/server/queries/public-apply";
import { resolvePublicEventWebsiteBySubdomain } from "@/server/services/resolve-public-event-website";

const landingMetadata: Metadata = {
  alternates: {
    canonical: "https://rsvp.webserbisyo.com",
  },
  description:
    "Create a beautiful digital wedding RSVP website with guest management, hosting, support, and a preview-first process. Website muna, bago bayad.",
  openGraph: {
    description:
      "Create a beautiful digital wedding RSVP website with guest management, hosting, support, and a preview-first process. Website muna, bago bayad.",
    images: [
      {
        alt: "WebSerbisyo RSVP premium digital RSVP websites",
        height: 630,
        url: "/opengraph-image",
        width: 1200,
      },
    ],
    siteName: "WebSerbisyo RSVP",
    title: "WebSerbisyo RSVP — Premium Digital RSVP Websites for Filipino Couples",
    type: "website",
    url: "https://rsvp.webserbisyo.com",
  },
  robots: {
    follow: true,
    index: true,
  },
  title: {
    absolute: "WebSerbisyo RSVP — Premium Digital RSVP Websites for Filipino Couples",
  },
  twitter: {
    card: "summary_large_image",
    description:
      "Create a beautiful digital wedding RSVP website with guest management, hosting, support, and a preview-first process. Website muna, bago bayad.",
    images: ["/opengraph-image"],
    title: "WebSerbisyo RSVP — Premium Digital RSVP Websites for Filipino Couples",
  },
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

  const [landingPixels, applyConfig] = await Promise.all([
    getPublicMetaPixelsForRoute({ route: "application" }),
    getPublicApplyConfig(),
  ]);

  return (
    <>
      <LandingNavbar />
      <main>
        <LandingVisualHero />
        <LandingTrustBar />
        <LandingHowItWorks messengerPageUrl={applyConfig.messengerPageUrl} />
        <LandingFeatures messengerPageUrl={applyConfig.messengerPageUrl} />
        <LandingTrustPromise />
        <LandingPricing />
        <LandingFAQ messengerPageUrl={applyConfig.messengerPageUrl} />
      </main>
      <LandingFooter messengerPageUrl={applyConfig.messengerPageUrl} />
      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: JSON.stringify(getMarketingJsonLd()) }}
      />
      <PublicMetaPixelScripts
        eventName="ViewContent"
        eventParams={{
          content_category: "RSVP Website Service",
          content_name: "WebSerbisyo RSVP Landing Page",
          source_route: "/",
        }}
        executionKey="landing"
        pixels={landingPixels}
      />
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

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PublicEventPageContent, buildPublicEventMetadata } from "@/components/event-website/public-event-page-content";
import { getPrivateAccessTokenFromSearchParams } from "@/lib/private-access";
import { getPublicMetaPixelsForRoute } from "@/server/queries/public-meta-pixels";
import { resolvePublicEventWebsite } from "@/server/services/resolve-public-event-website";

type PublicRsvpPageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({
  params,
  searchParams,
}: PublicRsvpPageProps): Promise<Metadata> {
  const { slug } = await params;
  const resolvedSearchParams = await searchParams;
  const requestSearchParams = new URLSearchParams();
  const access = Array.isArray(resolvedSearchParams.access)
    ? resolvedSearchParams.access[0]
    : resolvedSearchParams.access;

  if (access) {
    requestSearchParams.set("access", access);
  }

  const event = await resolvePublicEventWebsite(
    slug,
    getPrivateAccessTokenFromSearchParams(requestSearchParams),
  );

  if (!event) {
    return {
      title: "Event unavailable | WebSerbisyo RSVP",
      description: "This event website is not currently available.",
      robots: { index: false, follow: false },
    };
  }

  return buildPublicEventMetadata(event);
}

export default async function PublicRsvpPage({ params, searchParams }: PublicRsvpPageProps) {
  const { slug } = await params;
  const resolvedSearchParams = await searchParams;
  const requestSearchParams = new URLSearchParams();
  const access = Array.isArray(resolvedSearchParams.access)
    ? resolvedSearchParams.access[0]
    : resolvedSearchParams.access;

  if (access) {
    requestSearchParams.set("access", access);
  }

  const event = await resolvePublicEventWebsite(
    slug,
    getPrivateAccessTokenFromSearchParams(requestSearchParams),
  );

  if (!event) {
    notFound();
  }

  const pixels = await getPublicMetaPixelsForRoute({
    eventSlug: event.eventSlug,
    route: "event_page",
  });

  return <PublicEventPageContent event={event} pixels={pixels} />;
}

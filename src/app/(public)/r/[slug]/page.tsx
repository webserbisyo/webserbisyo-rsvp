import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PublicEventPageContent, buildPublicEventMetadata } from "@/components/event-website/public-event-page-content";
import { getPublicMetaPixelsForRoute } from "@/server/queries/public-meta-pixels";
import { resolvePublicEventWebsite } from "@/server/services/resolve-public-event-website";

type PublicRsvpPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: PublicRsvpPageProps): Promise<Metadata> {
  const { slug } = await params;
  const event = await resolvePublicEventWebsite(slug);

  return buildPublicEventMetadata(event);
}

export default async function PublicRsvpPage({ params }: PublicRsvpPageProps) {
  const { slug } = await params;
  const event = await resolvePublicEventWebsite(slug);

  if (!event) {
    notFound();
  }

  const pixels = await getPublicMetaPixelsForRoute({
    eventSlug: event.eventSlug,
    route: "event_page",
  });

  return <PublicEventPageContent event={event} pixels={pixels} />;
}

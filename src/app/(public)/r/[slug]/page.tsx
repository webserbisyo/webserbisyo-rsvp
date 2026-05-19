import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EventWebsiteRenderer } from "@/components/event-website/event-website-renderer";
import { PublicMetaPixelScripts } from "@/components/meta-pixels/public-meta-pixel-scripts";
import { getPublicMetaPixelsForRoute } from "@/server/queries/public-meta-pixels";
import { resolvePublicEventWebsite } from "@/server/services/resolve-public-event-website";

type PublicRsvpPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: PublicRsvpPageProps): Promise<Metadata> {
  const { slug } = await params;
  const event = await resolvePublicEventWebsite(slug);

  if (!event) {
    return {
      description: "Published RSVP event page.",
      title: "Event Website",
    };
  }

  const displayName = event.renderModel.coupleInfo.displayAs.trim() || event.eventTitle;
  const summaryParts = [
    formatPublicDate(event.eventDate),
    formatPublicTime(event.eventTime),
    event.venueName,
  ].filter(Boolean);

  return {
    description:
      summaryParts.length > 0
        ? `${displayName} event details. ${summaryParts.join(" • ")}`
        : `${displayName} event details and RSVP information.`,
    title: `${displayName} RSVP`,
  };
}

export default async function PublicRsvpPage({ params }: PublicRsvpPageProps) {
  const { slug } = await params;
  const event = await resolvePublicEventWebsite(slug);

  if (!event) {
    notFound();
  }

  const pixels = await getPublicMetaPixelsForRoute({
    eventSlug: slug,
    route: "event_page",
  });

  return (
    <main className="event-website-public-page min-h-screen bg-[linear-gradient(180deg,#fff8ef_0%,#ffffff_55%,#fff6ec_100%)] text-slate-900">
      <PublicMetaPixelScripts eventName="ViewContent" pixels={pixels} />

      <div className="event-preview-public-shell">
        <div className="event-preview-frame event-preview-frame--public">
          {/* Public event pages render from the published snapshot only, never from mutable draft content. */}
          <EventWebsiteRenderer
            draft={event.renderModel}
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
  if (!value) {
    return null;
  }

  const date = new Date(`${value}T00:00:00+08:00`);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return new Intl.DateTimeFormat("en-PH", {
    dateStyle: "full",
    timeZone: "Asia/Manila",
  }).format(date);
}

function formatPublicTime(value: string | null) {
  if (!value) {
    return null;
  }

  const normalizedTime = value.length === 5 ? `${value}:00` : value;
  const date = new Date(`2026-01-01T${normalizedTime}+08:00`);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return new Intl.DateTimeFormat("en-PH", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "Asia/Manila",
  }).format(date);
}

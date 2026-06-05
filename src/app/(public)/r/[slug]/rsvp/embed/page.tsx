import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PublicMetaPixelScripts } from "@/components/meta-pixels/public-meta-pixel-scripts";
import { PublicRsvpEmbedResizer } from "@/components/public-rsvp/public-rsvp-embed-resizer";
import { PublicRsvpResponseForm } from "@/components/public-rsvp/public-rsvp-response-form";
import { Badge } from "@/components/ui/badge";
import { getPublicMetaPixelsForRoute } from "@/server/queries/public-meta-pixels";
import { resolvePublicEventWebsite } from "@/server/services/resolve-public-event-website";

type PublicRsvpEmbedPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: PublicRsvpEmbedPageProps): Promise<Metadata> {
  const { slug } = await params;
  const event = await resolvePublicEventWebsite(slug);
  const title = event
    ? `${event.renderModel.coupleInfo.displayAs.trim() || event.eventTitle} RSVP Embed`
    : "RSVP Embed";

  return {
    description: "Embedded WebSerbisyo RSVP form.",
    robots: {
      follow: false,
      index: false,
    },
    title,
  };
}

export default async function PublicRsvpEmbedPage({ params }: PublicRsvpEmbedPageProps) {
  const { slug } = await params;
  const event = await resolvePublicEventWebsite(slug);

  if (!event) {
    notFound();
  }

  const pixels = await getPublicMetaPixelsForRoute({
    eventSlug: event.eventSlug,
    route: "rsvp_submit",
  });
  const displayName = event.renderModel.coupleInfo.displayAs.trim() || event.eventTitle;
  const details = [event.formatted.eventDateTimeLabel, event.formatted.venueLabel].filter(Boolean);

  return (
    <main className="event-website-public-page min-h-screen bg-[linear-gradient(180deg,#fff8ef_0%,#ffffff_60%,#fff6ec_100%)] px-3 py-4 text-slate-900 sm:px-4">
      <PublicMetaPixelScripts eventName="ViewContent" pixels={pixels} />
      <PublicRsvpEmbedResizer />

      <section className="mx-auto grid w-full max-w-[680px] gap-4">
        <div className="event-preview-section gap-2 px-1">
          <Badge variant="outline" className="event-preview-section-label">
            RSVP
          </Badge>
          <p className="event-preview-host-line">Confirm your attendance</p>
          <h1 className="text-balance font-serif text-[clamp(1.55rem,6vw,2.5rem)] font-medium leading-tight text-[#2d2824]">
            {displayName}
          </h1>
          {details.length > 0 ? (
            <p className="event-preview-copy max-w-[36rem]">{details.join(" · ")}</p>
          ) : null}
        </div>

        <div className="event-preview-rsvp-public-shell" id="rsvp-form">
          <PublicRsvpResponseForm
            availabilityMessage={event.rsvp.availabilityMessage}
            eventSlug={event.eventSlug}
            isAcceptingResponses={event.rsvp.isAcceptingResponses}
            settings={event.rsvp.settings}
          />
        </div>
      </section>
    </main>
  );
}

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PublicMetaPixelScripts } from "@/components/meta-pixels/public-meta-pixel-scripts";
import { PublicRsvpResponseForm } from "@/components/public-rsvp/public-rsvp-response-form";
import { Badge } from "@/components/ui/badge";
import { getPublicMetaPixelsForRoute } from "@/server/queries/public-meta-pixels";
import { resolvePublicEventWebsite } from "@/server/services/resolve-public-event-website";

type PublicRsvpOnlyPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({
  params,
}: PublicRsvpOnlyPageProps): Promise<Metadata> {
  const { slug } = await params;
  const event = await resolvePublicEventWebsite(slug);
  const title = event
    ? `${event.renderModel.coupleInfo.displayAs.trim() || event.eventTitle} RSVP`
    : "RSVP";

  return {
    description: "Confirm your attendance for this event.",
    robots: {
      follow: false,
      index: false,
    },
    title,
  };
}

export default async function PublicRsvpOnlyPage({ params }: PublicRsvpOnlyPageProps) {
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
  const venueLabel = event.formatted.venueLabel;
  const dateTimeLabel = event.formatted.eventDateTimeLabel;

  return (
    <main className="event-website-public-page min-h-screen bg-[linear-gradient(180deg,#fff8ef_0%,#ffffff_55%,#fff6ec_100%)] px-4 py-8 text-slate-900 sm:px-6">
      <PublicMetaPixelScripts eventName="ViewContent" pixels={pixels} />

      <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-[720px] flex-col justify-center">
        <section className="event-preview-section">
          <Badge variant="outline" className="event-preview-section-label">
            RSVP
          </Badge>
          <p className="event-preview-host-line">Confirm your attendance</p>
          <h1 className="text-balance text-[clamp(2rem,7vw,3.5rem)] font-semibold leading-tight text-[#2d2824]">
            {displayName}
          </h1>
          {dateTimeLabel || venueLabel ? (
            <dl className="event-preview-detail-list mt-6">
              {dateTimeLabel ? (
                <div>
                  <dt>Date and Time</dt>
                  <dd>{dateTimeLabel}</dd>
                </div>
              ) : null}
              {venueLabel ? (
                <div>
                  <dt>Venue</dt>
                  <dd>{venueLabel}</dd>
                </div>
              ) : null}
            </dl>
          ) : null}

          <div className="event-preview-rsvp-public-shell mt-6" id="rsvp-form">
            <PublicRsvpResponseForm
              availabilityMessage={event.rsvp.availabilityMessage}
              eventSlug={event.eventSlug}
              isAcceptingResponses={event.rsvp.isAcceptingResponses}
              settings={event.rsvp.settings}
            />
          </div>
        </section>
      </div>
    </main>
  );
}

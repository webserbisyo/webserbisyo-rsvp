import type { Metadata } from "next";
import { CalendarDays, MapPin } from "lucide-react";
import { notFound } from "next/navigation";
import { PublicRsvpResponseForm } from "@/components/public-rsvp/public-rsvp-response-form";
import { PublicMetaPixelScripts } from "@/components/meta-pixels/public-meta-pixel-scripts";
import { formatEventWebsiteDate, formatEventWebsiteTime } from "@/lib/event-website/formatting";
import { type PublicEventDto } from "@/lib/event-website/public-event";
import { buildStandalonePublicRsvpMetadata } from "@/lib/event-website/public-event-metadata";
import { normalizePrivateAccessToken } from "@/lib/private-access";
import type { PublicMetaPixelConfig } from "@/server/queries/public-meta-pixels";
import { getPublicMetaPixelsForRoute } from "@/server/queries/public-meta-pixels";
import { resolvePublicEventWebsite } from "@/server/services/resolve-public-event-website";

type PublicStandaloneRsvpPageProps = {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({
  params,
  searchParams,
}: PublicStandaloneRsvpPageProps): Promise<Metadata> {
  const { slug } = await params;
  const token = getAccessTokenFromSearchParams(await searchParams);
  const event = await resolvePublicEventWebsite(slug, token);

  if (!event) {
    return {
      description: "Published RSVP page.",
      robots: {
        follow: false,
        index: false,
      },
      title: "RSVP",
    };
  }

  return buildStandalonePublicRsvpMetadata(event);
}

export default async function PublicStandaloneRsvpPage({
  params,
  searchParams,
}: PublicStandaloneRsvpPageProps) {
  const { slug } = await params;
  const token = getAccessTokenFromSearchParams(await searchParams);
  const event = await resolvePublicEventWebsite(slug, token);

  if (!event) {
    notFound();
  }

  const pixels = await getPublicMetaPixelsForRoute({
    eventSlug: event.eventSlug,
    route: "event_page",
  });

  return <PublicStandaloneRsvpPageContent event={event} pixels={pixels} />;
}

function PublicStandaloneRsvpPageContent({
  event,
  pixels,
}: {
  event: PublicEventDto;
  pixels: PublicMetaPixelConfig[];
}) {
  const displayName = event.renderModel.coupleInfo.displayAs.trim() || event.eventTitle;
  const eventDateTimeLabel =
    formatPublicDate(event.eventDate) && formatPublicTime(event.eventTime)
      ? `${formatPublicDate(event.eventDate)} at ${formatPublicTime(event.eventTime)}`
      : (formatPublicDate(event.eventDate) ?? formatPublicTime(event.eventTime));
  const venueLabel = [event.venueName?.trim(), event.venueAddress?.trim()]
    .filter(Boolean)
    .join(", ");

  return (
    <main className="event-website-public-page min-h-screen bg-[linear-gradient(180deg,#fff8ef_0%,#ffffff_55%,#fff6ec_100%)] text-slate-900">
      <PublicMetaPixelScripts eventName="ViewContent" pixels={pixels} />

      <div className="event-preview-public-shell">
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 rounded-[28px] border border-[#eadbd0] bg-white/95 p-6 shadow-sm shadow-[#8a4b2e]/10 sm:p-8">
          <div className="space-y-3 text-center">
            <p className="text-[11px] font-semibold tracking-[0.24em] text-[#a38376] uppercase">
              Dedicated RSVP
            </p>
            <h1 className="text-3xl font-semibold tracking-tight text-[#2d1f1a] sm:text-4xl">
              {displayName}
            </h1>
            <p className="mx-auto max-w-2xl text-sm leading-6 text-[#6b4b40] sm:text-[15px]">
              Share this page directly with guests who need the RSVP form without opening the full
              website first.
            </p>
          </div>

          <div className="grid gap-3 rounded-2xl border border-[#eadbd0] bg-[#fdf8f4] p-4 text-sm text-[#5f4b43] sm:grid-cols-2">
            {eventDateTimeLabel ? (
              <div className="flex items-start gap-3">
                <CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-[#c96f4c]" />
                <div>
                  <p className="font-semibold text-[#2d1f1a]">Date & Time</p>
                  <p>{eventDateTimeLabel}</p>
                </div>
              </div>
            ) : null}

            {venueLabel ? (
              <div className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#c96f4c]" />
                <div>
                  <p className="font-semibold text-[#2d1f1a]">Venue</p>
                  <p>{venueLabel}</p>
                </div>
              </div>
            ) : null}
          </div>

          <section id="rsvp" className="space-y-4">
            <div className="space-y-2 text-center">
              <h2 className="text-2xl font-semibold tracking-tight text-[#2d1f1a]">
                Confirm Your Attendance
              </h2>
              <p className="mx-auto max-w-2xl text-sm leading-6 text-[#6b4b40]">
                Complete the official RSVP form below. The host will receive your response in the
                WebSerbisyo dashboard.
              </p>
            </div>
            <div id="rsvp-form">
              <PublicRsvpResponseForm
                availabilityMessage={event.rsvp.availabilityMessage}
                eventSlug={event.eventSlug}
                isAcceptingResponses={event.rsvp.isAcceptingResponses}
                settings={event.rsvp.settings}
              />
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

function formatPublicDate(value: string | null) {
  return value ? formatEventWebsiteDate(value, "") || null : null;
}

function formatPublicTime(value: string | null) {
  return value ? formatEventWebsiteTime(value, "") || null : null;
}

function getAccessTokenFromSearchParams(
  searchParams?: Record<string, string | string[] | undefined>,
) {
  const rawValue = searchParams?.access;
  return normalizePrivateAccessToken(Array.isArray(rawValue) ? rawValue[0] : rawValue);
}

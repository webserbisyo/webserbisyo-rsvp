import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  buildPreviewDraftFromContent,
  previewSupportedSectionKeys,
} from "@/components/dashboard/event/event-website-preview-data";
import { EventWebsiteRenderer } from "@/components/event-website/event-website-renderer";
import { PublicMetaPixelScripts } from "@/components/meta-pixels/public-meta-pixel-scripts";
import { resolveEventWebsiteSections } from "@/config/event-website-sections";
import { getPublicMetaPixelsForRoute } from "@/server/queries/public-meta-pixels";
import { resolvePublicEventWebsite } from "@/server/services/resolve-public-event-website";

type PublicRsvpPageProps = {
  params: Promise<{ slug: string }>;
};

const supportedSectionKeySet = new Set(previewSupportedSectionKeys);

export async function generateMetadata({ params }: PublicRsvpPageProps): Promise<Metadata> {
  const { slug } = await params;
  const event = await resolvePublicEventWebsite(slug);

  if (!event) {
    return {
      description: "Published RSVP event page.",
      title: "Event Website",
    };
  }

  const displayName = event.content.sections.host_info.displayAs.trim() || event.eventTitle;
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
  const rsvpAvailability = getRsvpAvailability(event.rsvpOpenAt, event.rsvpCloseAt);
  const previewDraft = buildPreviewDraftFromContent(event.content);
  const resolvedSections = resolveEventWebsiteSections(event.eventType);
  const publicSections = event.sectionsToRender
    .filter((sectionKey) => supportedSectionKeySet.has(sectionKey))
    .filter((sectionKey) =>
      [...resolvedSections.requiredSections, ...resolvedSections.optionalSections].some(
        (section) => section.key === sectionKey,
      ),
    );

  return (
    <main className="event-website-public-page min-h-screen bg-[linear-gradient(180deg,#fff8ef_0%,#ffffff_55%,#fff6ec_100%)] text-slate-900">
      <PublicMetaPixelScripts eventName="ViewContent" pixels={pixels} />

      <div className="event-preview-public-shell">
        <div className="event-preview-frame event-preview-frame--public">
          <EventWebsiteRenderer
            draft={previewDraft}
            publicRsvp={{
              availabilityMessage: rsvpAvailability.message,
              eventSlug: event.eventSlug,
              isAcceptingResponses: rsvpAvailability.isAcceptingResponses,
            settings: event.content.sections.rsvp_form,
          }}
            sections={publicSections}
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

function formatPublicDateTime(value: string | null) {
  if (!value) {
    return null;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return new Intl.DateTimeFormat("en-PH", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Manila",
  }).format(date);
}

function getRsvpAvailability(rsvpOpenAt: string | null, rsvpCloseAt: string | null) {
  const now = Date.now();

  if (rsvpOpenAt && new Date(rsvpOpenAt).getTime() > now) {
    return {
      isAcceptingResponses: false,
      message: `RSVP submissions open on ${formatPublicDateTime(rsvpOpenAt) ?? "the scheduled opening date"}.`,
    };
  }

  if (rsvpCloseAt && new Date(rsvpCloseAt).getTime() < now) {
    return {
      isAcceptingResponses: false,
      message: "The RSVP deadline has passed.",
    };
  }

  return {
    isAcceptingResponses: true,
    message: null,
  };
}

import { z } from "zod";
import {
  resolveEventWebsiteSections,
  type EventWebsiteSectionKey,
} from "@/config/event-website-sections";
import {
  buildEventWebsiteRenderModel,
  eventWebsiteRenderModelSectionKeys,
  type EventWebsiteRenderModel,
} from "@/lib/event-website/render-model";
import {
  PUBLIC_RSVP_SLUG_MAX_LENGTH,
  PUBLIC_RSVP_SLUG_MIN_LENGTH,
  PUBLIC_RSVP_SLUG_PATTERN,
} from "@/lib/public-rsvp-slugs";
import type { EventWebsiteContent, EventWebsiteRsvpFormSection } from "@/lib/event-website/types";

export const PublicEventSlugSchema = z
  .string()
  .trim()
  .min(PUBLIC_RSVP_SLUG_MIN_LENGTH)
  .max(PUBLIC_RSVP_SLUG_MAX_LENGTH)
  .regex(PUBLIC_RSVP_SLUG_PATTERN);

export type PublicEventVisibility = "private" | "public" | "unlisted";

export type PublicEventRsvpState = {
  availabilityMessage: string | null;
  closeAt: string | null;
  isAcceptingResponses: boolean;
  openAt: string | null;
  settings: EventWebsiteRsvpFormSection;
};

export type PublicEventDto = {
  content: EventWebsiteContent;
  eventDate: string | null;
  eventSlug: string;
  eventTime: string | null;
  eventTitle: string;
  eventType: string;
  publishedAt: string;
  renderModel: EventWebsiteRenderModel;
  rsvp: PublicEventRsvpState;
  sections: EventWebsiteSectionKey[];
  venueAddress: string | null;
  venueName: string | null;
  visibility: PublicEventVisibility;
};

export function buildPublicEventDto({
  content,
  eventDate,
  eventSlug,
  eventTime,
  eventTitle,
  eventType,
  publishedAt,
  rsvpCloseAt,
  rsvpOpenAt,
  venueAddress,
  venueName,
  visibility,
}: {
  content: EventWebsiteContent;
  eventDate: string | null;
  eventSlug: string;
  eventTime: string | null;
  eventTitle: string;
  eventType: string;
  publishedAt: string;
  rsvpCloseAt: string | null;
  rsvpOpenAt: string | null;
  venueAddress: string | null;
  venueName: string | null;
  visibility: PublicEventVisibility;
}): PublicEventDto {
  const publicContent = sanitizePublicContent(content);

  return {
    content: publicContent,
    eventDate,
    eventSlug,
    eventTime,
    eventTitle,
    eventType,
    publishedAt,
    renderModel: buildEventWebsiteRenderModel(publicContent),
    rsvp: getPublicEventRsvpState(publicContent.sections.rsvp_form, rsvpOpenAt, rsvpCloseAt),
    sections: buildPublicRenderableSections(publicContent, eventType),
    venueAddress,
    venueName,
    visibility,
  };
}

export function buildPublicRenderableSections(
  content: EventWebsiteContent,
  eventType: string | null | undefined,
): EventWebsiteSectionKey[] {
  const supportedSectionKeySet = new Set<EventWebsiteSectionKey>(eventWebsiteRenderModelSectionKeys);
  const resolvedSections = resolveEventWebsiteSections(eventType);
  const allowedSections = new Set<EventWebsiteSectionKey>(
    [...resolvedSections.requiredSections, ...resolvedSections.optionalSections].map(
      (section) => section.key,
    ),
  );
  const visibleSections = content.layout.sectionOrder.filter(
    (sectionKey) => sectionKey === "contact_socials" || content.layout.enabledSections[sectionKey],
  );
  const contactSections = visibleSections.filter((sectionKey) => sectionKey === "contact_socials");
  const orderedSections = [
    ...visibleSections.filter((sectionKey) => sectionKey !== "contact_socials"),
    ...contactSections,
  ];

  return orderedSections.filter(
    (sectionKey) =>
      supportedSectionKeySet.has(sectionKey as EventWebsiteSectionKey) &&
      allowedSections.has(sectionKey as EventWebsiteSectionKey),
  ) as EventWebsiteSectionKey[];
}

export function getPublicEventRsvpState(
  settings: EventWebsiteRsvpFormSection,
  openAt: string | null,
  closeAt: string | null,
): PublicEventRsvpState {
  const now = Date.now();

  if (openAt && new Date(openAt).getTime() > now) {
    return {
      availabilityMessage: `RSVP submissions open on ${formatPublicDateTime(openAt) ?? "the scheduled opening date"}.`,
      closeAt,
      isAcceptingResponses: false,
      openAt,
      settings,
    };
  }

  if (closeAt && new Date(closeAt).getTime() < now) {
    return {
      availabilityMessage: "The RSVP deadline has passed.",
      closeAt,
      isAcceptingResponses: false,
      openAt,
      settings,
    };
  }

  return {
    availabilityMessage: null,
    closeAt,
    isAcceptingResponses: true,
    openAt,
    settings,
  };
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

function sanitizePublicContent(content: EventWebsiteContent): EventWebsiteContent {
  return {
    ...content,
    meta: {
      savedAt: null,
      savedBy: null,
    },
  };
}

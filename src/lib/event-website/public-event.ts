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
  formatPublicDate,
  formatPublicDateTime,
  formatPublicRsvpDeadline,
  formatPublicTime,
} from "@/lib/event-website/formatting";
import {
  buildOfficialPublicRsvpUrl,
  buildOfficialPublicRsvpStandaloneUrl,
  resolvePublicRsvpLinkSet,
} from "@/lib/public-rsvp-url";
import {
  PUBLIC_RSVP_SLUG_MAX_LENGTH,
  PUBLIC_RSVP_SLUG_MIN_LENGTH,
  PUBLIC_RSVP_SLUG_PATTERN,
} from "@/lib/public-rsvp-slugs";
import type {
  EventWebsiteContent,
  EventWebsiteGuestbookMessage,
  EventWebsiteImageAsset,
  EventWebsiteRsvpFormSection,
} from "@/lib/event-website/types";

export const PublicEventSlugSchema = z
  .string()
  .trim()
  .min(PUBLIC_RSVP_SLUG_MIN_LENGTH)
  .max(PUBLIC_RSVP_SLUG_MAX_LENGTH)
  .regex(PUBLIC_RSVP_SLUG_PATTERN);

export type PublicEventVisibility = "private" | "public" | "unlisted";
export const PUBLIC_EVENT_RENDER_VISIBILITIES: PublicEventVisibility[] = [
  "private",
  "public",
  "unlisted",
];

export type PublicEventRsvpState = {
  availabilityMessage: string | null;
  closeAt: string | null;
  isAcceptingResponses: boolean;
  openAt: string | null;
  settings: EventWebsiteRsvpFormSection;
};

export type PublicEventUrls = {
  fallbackUrl: string;
  fallbackRsvpUrl: string;
  publicRsvpUrl: string;
  publicWebsiteUrl: string | null;
};

export type PublicEventFormattedLabels = {
  eventDateLabel: string | null;
  eventDateTimeLabel: string | null;
  eventTimeLabel: string | null;
  rsvpDeadlineLabel: string | null;
  venueLabel: string | null;
};

export type PublicEventGiftImage = {
  alt: string | null;
  height?: number;
  url: string;
  width?: number;
};

export type PublicEventGiftOption = {
  id: string;
  image: PublicEventGiftImage | null;
  title: string;
};

export type PublicGuestbookMessageDto = {
  approvedAt: string | null;
  guestName: string;
  message: string;
  submittedAt: string | null;
};

export type PublicEventSectionsByKey = {
  attire_motif: EventWebsiteContent["sections"]["attire_motif"];
  contact_socials: EventWebsiteContent["sections"]["contact_socials"];
  countdown: EventWebsiteContent["sections"]["countdown"];
  entourage: EventWebsiteContent["sections"]["entourage"];
  extra_info: EventWebsiteContent["sections"]["extra_info"];
  gift_details: Omit<EventWebsiteContent["sections"]["gift_details"], "options"> & {
    options: PublicEventGiftOption[];
  };
  guestbook: EventWebsiteContent["sections"]["guestbook"] & {
    messages: PublicGuestbookMessageDto[];
  };
  host_info: EventWebsiteContent["sections"]["host_info"];
  main_event: EventWebsiteContent["sections"]["main_event"];
  music_effects: EventWebsiteContent["sections"]["music_effects"];
  principal_sponsors: EventWebsiteContent["sections"]["principal_sponsors"];
  rsvp_form: EventWebsiteContent["sections"]["rsvp_form"];
  secondary_event: EventWebsiteContent["sections"]["secondary_event"];
  story_message: EventWebsiteContent["sections"]["story_message"];
  timeline_program: EventWebsiteContent["sections"]["timeline_program"];
  venue: EventWebsiteContent["sections"]["venue"];
};

export type PublicEventDto = {
  content: EventWebsiteContent;
  eventDate: string | null;
  eventSlug: string;
  eventTime: string | null;
  eventTitle: string;
  eventType: string;
  guestbookMessages: EventWebsiteGuestbookMessage[];
  publishedAt: string;
  publicGuestbookMessages: PublicGuestbookMessageDto[];
  renderModel: EventWebsiteRenderModel;
  rsvp: PublicEventRsvpState;
  sections: EventWebsiteSectionKey[];
  sectionsByKey: PublicEventSectionsByKey;
  formatted: PublicEventFormattedLabels;
  subdomainSlug: string | null;
  urls: PublicEventUrls;
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
  subdomainSlug,
  venueAddress,
  venueName,
  visibility,
  guestbookMessages,
}: {
  content: EventWebsiteContent;
  eventDate: string | null;
  eventSlug: string;
  eventTime: string | null;
  eventTitle: string;
  eventType: string;
  guestbookMessages: EventWebsiteGuestbookMessage[];
  publishedAt: string;
  rsvpCloseAt: string | null;
  rsvpOpenAt: string | null;
  subdomainSlug: string | null;
  venueAddress: string | null;
  venueName: string | null;
  visibility: PublicEventVisibility;
}): PublicEventDto {
  const publicContent = sanitizePublicContent(content);
  const publicGuestbookMessages = guestbookMessages.map(toPublicGuestbookMessageDto);
  const urls = buildPublicEventUrls({
    eventSlug,
    subdomainSlug,
  });
  const formatted = buildPublicEventFormattedLabels({
    eventDate,
    eventTime,
    rsvpDeadline: publicContent.sections.main_event.rsvpDeadline,
    venueAddress,
    venueName,
  });

  return {
    content: publicContent,
    eventDate,
    eventSlug,
    eventTime,
    eventTitle,
    eventType,
    guestbookMessages,
    publicGuestbookMessages,
    publishedAt,
    renderModel: buildEventWebsiteRenderModel(publicContent),
    rsvp: getPublicEventRsvpState(publicContent.sections.rsvp_form, rsvpOpenAt, rsvpCloseAt),
    sections: buildPublicRenderableSections(publicContent, eventType, guestbookMessages.length),
    sectionsByKey: buildPublicSectionsByKey(publicContent, publicGuestbookMessages),
    formatted,
    subdomainSlug,
    urls,
    venueAddress,
    venueName,
    visibility,
  };
}

export function buildPublicRenderableSections(
  content: EventWebsiteContent,
  eventType: string | null | undefined,
  guestbookMessageCount = 0,
): EventWebsiteSectionKey[] {
  const supportedSectionKeySet = new Set<EventWebsiteSectionKey>(eventWebsiteRenderModelSectionKeys);
  const resolvedSections = resolveEventWebsiteSections(eventType);
  const allowedSections = new Set<EventWebsiteSectionKey>(
    [...resolvedSections.requiredSections, ...resolvedSections.optionalSections].map(
      (section) => section.key,
    ),
  );
  const orderedSections = content.layout.sectionOrder.filter(
    (sectionKey) => content.layout.enabledSections[sectionKey],
  );

  return orderedSections.filter(
    (sectionKey) =>
      (sectionKey !== "guestbook" || guestbookMessageCount > 0) &&
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

function sanitizePublicContent(content: EventWebsiteContent): EventWebsiteContent {
  return {
    ...content,
    meta: {
      savedAt: null,
      savedBy: null,
    },
  };
}

function buildPublicEventUrls({
  eventSlug,
  subdomainSlug,
}: {
  eventSlug: string;
  subdomainSlug: string | null;
}): PublicEventUrls {
  const linkSet = resolvePublicRsvpLinkSet({
    slug: eventSlug,
    subdomain: subdomainSlug,
  });

  return {
    fallbackUrl: buildOfficialPublicRsvpUrl(eventSlug),
    fallbackRsvpUrl: buildOfficialPublicRsvpStandaloneUrl(eventSlug),
    publicRsvpUrl: buildOfficialPublicRsvpStandaloneUrl(eventSlug),
    publicWebsiteUrl: subdomainSlug ? linkSet.wildcardProductionUrl : null,
  };
}

function buildPublicEventFormattedLabels({
  eventDate,
  eventTime,
  rsvpDeadline,
  venueAddress,
  venueName,
}: {
  eventDate: string | null;
  eventTime: string | null;
  rsvpDeadline: string | null;
  venueAddress: string | null;
  venueName: string | null;
}): PublicEventFormattedLabels {
  const eventDateLabel = formatPublicDate(eventDate);
  const eventTimeLabel = formatPublicTime(eventTime);

  return {
    eventDateLabel,
    eventDateTimeLabel:
      eventDateLabel && eventTimeLabel ? `${eventDateLabel} at ${eventTimeLabel}` : eventDateLabel,
    eventTimeLabel,
    rsvpDeadlineLabel: formatPublicRsvpDeadline(rsvpDeadline),
    venueLabel: [venueName?.trim(), venueAddress?.trim()].filter(Boolean).join(", ") || null,
  };
}

function buildPublicSectionsByKey(
  content: EventWebsiteContent,
  guestbookMessages: PublicGuestbookMessageDto[],
): PublicEventSectionsByKey {
  return {
    attire_motif: { ...content.sections.attire_motif },
    contact_socials: { ...content.sections.contact_socials },
    countdown: { ...content.sections.countdown },
    entourage: {
      groups: content.sections.entourage.groups.map((group) => ({ ...group })),
      introLine: content.sections.entourage.introLine,
    },
    extra_info: {
      items: content.sections.extra_info.items.map((item) => ({ ...item })),
      sectionIntro: content.sections.extra_info.sectionIntro,
      sectionTitle: content.sections.extra_info.sectionTitle,
    },
    gift_details: {
      giftNote: content.sections.gift_details.giftNote,
      options: content.sections.gift_details.options.map((option) => ({
        id: option.id,
        image: toPublicGiftImage(option.image, option.title),
        title: option.title,
      })),
      sectionIntro: content.sections.gift_details.sectionIntro,
    },
    guestbook: {
      ...content.sections.guestbook,
      messages: guestbookMessages,
    },
    host_info: { ...content.sections.host_info },
    main_event: { ...content.sections.main_event },
    music_effects: { ...content.sections.music_effects },
    principal_sponsors: { ...content.sections.principal_sponsors },
    rsvp_form: {
      ...content.sections.rsvp_form,
      customQuestions: content.sections.rsvp_form.customQuestions.map((question) => ({
        ...question,
        options: [...question.options],
      })),
    },
    secondary_event: { ...content.sections.secondary_event },
    story_message: { ...content.sections.story_message },
    timeline_program: {
      items: content.sections.timeline_program.items.map((item) => ({ ...item })),
    },
    venue: { ...content.sections.venue },
  };
}

function toPublicGiftImage(
  image: EventWebsiteImageAsset | null,
  title: string,
): PublicEventGiftImage | null {
  if (!image) {
    return null;
  }

  const url = image.url?.trim();

  // Expose only already-public http(s) URLs and never leak storage paths or private file handles.
  if (!url || !isPublicHttpUrl(url)) {
    return null;
  }

  return {
    alt: image.alt?.trim() || (title.trim() ? `${title.trim()} gift image` : null),
    url,
  };
}

function toPublicGuestbookMessageDto(
  message: EventWebsiteGuestbookMessage,
): PublicGuestbookMessageDto {
  return {
    approvedAt: message.approvedAt,
    guestName: message.guestName,
    message: message.message,
    submittedAt: message.submittedAt,
  };
}

function isPublicHttpUrl(value: string) {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

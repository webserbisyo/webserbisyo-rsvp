import type {
  EventWebsiteSectionDefinition,
  EventWebsiteSectionKey,
} from "@/config/event-website-sections";
import {
  buildEventWebsiteRenderModel,
  eventWebsiteRenderModelSectionKeys,
  type EventWebsiteRenderModel,
} from "@/lib/event-website/render-model";
import {
  formatEventWebsiteDate,
  formatEventWebsiteDateTime,
  formatEventWebsiteDateTimeLocalInput,
  formatEventWebsiteTime,
} from "@/lib/event-website/formatting";
import {
  DEFAULT_EVENT_WEBSITE_GUESTBOOK_EMPTY_STATE,
  DEFAULT_EVENT_WEBSITE_GUESTBOOK_INTRO,
  DEFAULT_EVENT_WEBSITE_GUESTBOOK_TITLE,
  eventWebsiteContentSectionKeys,
  type EventWebsiteContent,
  type EventWebsiteContentSectionKey,
  type EventWebsiteCustomQuestionFieldType,
} from "@/lib/event-website/types";

export type EventWebsitePreviewDevice = "desktop" | "mobile";

export type EventWebsiteCustomQuestionDraft =
  EventWebsitePreviewDraft["rsvpForm"]["customQuestions"][number];
export type EventWebsiteTimelineItemDraft =
  EventWebsitePreviewDraft["timelineProgram"]["items"][number];
export type EventWebsiteEntourageGroupDraft =
  EventWebsitePreviewDraft["entourage"]["groups"][number];
export type EventWebsiteExtraInfoItemDraft = EventWebsitePreviewDraft["extraInfo"]["items"][number];
export type EventWebsiteGiftOptionDraft =
  EventWebsitePreviewDraft["giftDetails"]["options"][number];

export type EventWebsitePreviewDraft = EventWebsiteRenderModel;

type EventWebsitePreviewEventData = {
  eventWebsiteContent?: EventWebsiteContent | null;
  eventContent: {
    coupleOrCelebrantNames: string | null;
    eventStory?: string | null;
    giftNote?: string | null;
    heroSubtitle: string | null;
    heroTitle: string | null;
    rsvpNote: string | null;
    scheduleNote: string | null;
    venueNote: string | null;
  } | null;
  eventDate: string | null;
  eventTime: string | null;
  maxGuestCount: number | null;
  rsvpCloseAt: string | null;
  title: string | null;
  venueAddress: string | null;
  venueName: string | null;
};

export const previewSupportedSectionKeys =
  eventWebsiteRenderModelSectionKeys as readonly EventWebsiteSectionKey[];

const defaultWeddingFlow: EventWebsiteSectionKey[] = [...eventWebsiteContentSectionKeys];
let eventWebsiteDraftIdCounter = 0;

export function createEventWebsiteDraftItemId(prefix: string) {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  eventWebsiteDraftIdCounter += 1;
  return `${prefix}-${eventWebsiteDraftIdCounter}`;
}

export const previewDefaultDraft: EventWebsitePreviewDraft = {
  attireDressCode: {
    colorMotifNote: "Please wear shades that complement our wedding colors.",
    dressCodeNote: "Formal or semi-formal attire is encouraged.",
    sectionIntro: "We would love to see you in our wedding motif.",
  },
  ceremony: {
    endTime: "18:00",
    eventDate: "2026-06-06",
    eventLabel: "Wedding Ceremony",
    eventTime: "16:00",
    rsvpDeadline: "2026-06-01T18:00",
    scheduleNote: "Please arrive at least 15 minutes before the ceremony starts.",
  },
  contactSocials: {
    contactNumber: "+63 917 123 4567",
    contactPerson: "Anna Santos",
    email: "hello@example.com",
    facebookUrl: "https://facebook.com/juanandmaria",
    instagramUrl: "https://instagram.com/juanandmaria",
    tikTokUrl: "https://tiktok.com/@juanandmaria",
  },
  countdown: {
    shortNote: "We can't wait to celebrate with you.",
    title: "Counting down to our special day",
  },
  coupleInfo: {
    brideName: "Maria",
    displayAs: "Juan & Maria",
    groomName: "Juan",
    hostLine: "Alexander Morales Wedding RSVP",
    shortHostMessage:
      "Together with their families, Juan and Maria invite you to celebrate their wedding day.",
  },
  entourage: {
    groups: [
      { groupTitle: "Maid of Honor", id: "entourage-maid-of-honor", names: "Maria Santos" },
      { groupTitle: "Best Man", id: "entourage-best-man", names: "Juan Dela Cruz" },
      {
        groupTitle: "Bridesmaids",
        id: "entourage-bridesmaids",
        names: "Ana Cruz, Bella Reyes, Carla Lim",
      },
      {
        groupTitle: "Groomsmen",
        id: "entourage-groomsmen",
        names: "Marco Reyes, Paolo Santos, Luis Garcia",
      },
    ],
    introLine: "Meet the family and friends standing with us on our wedding day.",
  },
  extraInfo: {
    items: [
      {
        details: "Parking is available near the venue entrance.",
        id: "extra-info-parking",
        title: "Parking",
      },
      {
        details: "Please arrive at least 30 minutes before the ceremony.",
        id: "extra-info-reminder",
        title: "Reminder",
      },
    ],
    sectionIntro: "Here are a few helpful notes for our guests.",
    sectionTitle: "Additional Details",
  },
  giftDetails: {
    giftNote:
      "If you wish to give a gift, a monetary gift would be greatly appreciated as we begin this new chapter together.",
    options: [
      { file: null, id: "gift-option-1", image: null, title: "GCash" },
      { file: null, id: "gift-option-2", image: null, title: "Bank Transfer" },
    ],
    sectionIntro: "Your presence is the greatest gift.",
  },
  loveStory: {
    sectionIntro: "A little story about how our journey began.",
    storyBody:
      "From the first hello to this special day, our journey has been filled with simple moments, answered prayers, and love that continued to grow. We are grateful to celebrate this chapter with the people who matter most to us.",
    storyTitle: "Our Story",
  },
  guestbook: {
    emptyStateMessage: DEFAULT_EVENT_WEBSITE_GUESTBOOK_EMPTY_STATE,
    sectionIntro: DEFAULT_EVENT_WEBSITE_GUESTBOOK_INTRO,
    sectionTitle: DEFAULT_EVENT_WEBSITE_GUESTBOOK_TITLE,
  },
  musicEffects: {
    musicLink: "",
    musicTitle: "Our Wedding Song",
    playButtonLabel: "Play our song",
    shortNote: "A song that reminds us of our journey together.",
  },
  principalSponsors: {
    introLine: "We are grateful for the love and guidance of our principal sponsors.",
    names:
      "Mr. Juan Dela Cruz\nMrs. Maria Dela Cruz\nMr. Pedro Santos\nMrs. Ana Santos\nMr. Roberto Reyes\nMrs. Elena Reyes",
  },
  reception: {
    address: "Talisay City, Negros Occidental, Philippines",
    endTime: "21:00",
    mapsLink: "#",
    note: "Dinner and program will follow after the ceremony.",
    startTime: "18:00",
    title: "Wedding Reception",
    venueName: "The Ruins Garden Hall",
  },
  rsvpForm: {
    companionAgeEnabled: false,
    companionLimit: "1",
    companionNameEnabled: true,
    customQuestions: [],
    emailEnabled: true,
    emailRequired: true,
    foodAllergiesEnabled: false,
    messageToHostEnabled: true,
    phoneEnabled: false,
    phoneRequired: false,
    plusOneEnabled: false,
  },
  timelineProgram: {
    items: [
      {
        description: "Guests may proceed to the entrance area.",
        id: "timeline-guest-arrival",
        time: "15:00",
        title: "Guest Arrival",
      },
      {
        description: "The wedding ceremony begins.",
        id: "timeline-ceremony",
        time: "16:00",
        title: "Ceremony",
      },
      {
        description: "Dinner and program will follow.",
        id: "timeline-reception",
        time: "18:00",
        title: "Reception",
      },
      {
        description: "Celebrate with food, speeches, and special moments.",
        id: "timeline-dinner-program",
        time: "20:00",
        title: "Dinner & Program",
      },
    ],
  },
  venue: {
    address: "Talisay City, Negros Occidental, Philippines",
    arrivalNote:
      "Parking is available near the entrance. Please follow the event signage upon arrival.",
    mapsLink: "#",
    venueName: "The Ruins, Bacolod",
  },
};

export function buildInitialPreviewDraft(
  eventData: EventWebsitePreviewEventData,
): EventWebsitePreviewDraft {
  if (eventData.eventWebsiteContent) {
    return buildEventWebsiteRenderModel(eventData.eventWebsiteContent);
  }

  return {
    ...previewDefaultDraft,
    attireDressCode: { ...previewDefaultDraft.attireDressCode },
    ceremony: {
      ...previewDefaultDraft.ceremony,
      eventDate: eventData.eventDate || previewDefaultDraft.ceremony.eventDate,
      eventTime: formatInputTime(eventData.eventTime) || previewDefaultDraft.ceremony.eventTime,
      rsvpDeadline:
        formatDateTimeLocal(eventData.rsvpCloseAt) || previewDefaultDraft.ceremony.rsvpDeadline,
      scheduleNote:
        eventData.eventContent?.scheduleNote || previewDefaultDraft.ceremony.scheduleNote,
    },
    contactSocials: { ...previewDefaultDraft.contactSocials },
    countdown: { ...previewDefaultDraft.countdown },
    coupleInfo: {
      ...previewDefaultDraft.coupleInfo,
      hostLine: eventData.eventContent?.heroTitle || previewDefaultDraft.coupleInfo.hostLine,
      shortHostMessage:
        eventData.eventContent?.heroSubtitle || previewDefaultDraft.coupleInfo.shortHostMessage,
    },
    entourage: {
      ...previewDefaultDraft.entourage,
      groups: previewDefaultDraft.entourage.groups.map((group) => ({ ...group })),
    },
    extraInfo: {
      ...previewDefaultDraft.extraInfo,
      items: previewDefaultDraft.extraInfo.items.map((item) => ({ ...item })),
    },
    giftDetails: {
      ...previewDefaultDraft.giftDetails,
      options: previewDefaultDraft.giftDetails.options.map((option) => ({ ...option })),
    },
    loveStory: { ...previewDefaultDraft.loveStory },
    guestbook: { ...previewDefaultDraft.guestbook },
    musicEffects: { ...previewDefaultDraft.musicEffects },
    principalSponsors: { ...previewDefaultDraft.principalSponsors },
    reception: {
      ...previewDefaultDraft.reception,
      address: eventData.venueAddress || previewDefaultDraft.reception.address,
    },
    rsvpForm: {
      ...previewDefaultDraft.rsvpForm,
      plusOneEnabled: Boolean(eventData.maxGuestCount),
    },
    timelineProgram: {
      items: previewDefaultDraft.timelineProgram.items.map((item) => ({ ...item })),
    },
    venue: {
      ...previewDefaultDraft.venue,
      address: eventData.venueAddress || previewDefaultDraft.venue.address,
      arrivalNote: eventData.eventContent?.venueNote || previewDefaultDraft.venue.arrivalNote,
      venueName: eventData.venueName || previewDefaultDraft.venue.venueName,
    },
  };
}

export function buildInitialEnabledSections(
  sections: EventWebsiteSectionDefinition[],
  hydratedEnabledSections?: Partial<Record<EventWebsiteSectionKey, boolean>> | null,
): Record<EventWebsiteSectionKey, boolean> {
  return Object.fromEntries(
    sections.map((section) => [
      section.key,
      section.required ? true : (hydratedEnabledSections?.[section.key] ?? section.defaultEnabled),
    ]),
  ) as Record<EventWebsiteSectionKey, boolean>;
}

export function buildInitialWebsiteFlow(
  sections: EventWebsiteSectionDefinition[],
  preferredOrder: readonly EventWebsiteSectionKey[] = defaultWeddingFlow,
): EventWebsiteSectionDefinition[] {
  const sectionMap = new Map(sections.map((section) => [section.key, section]));
  const pinnedSections = preferredOrder
    .map((key) => sectionMap.get(key))
    .filter((section): section is EventWebsiteSectionDefinition => Boolean(section));
  const pinnedKeys = new Set(pinnedSections.map((section) => section.key));
  const remainingSections = sections.filter(
    (section) => !section.comingSoon && !pinnedKeys.has(section.key),
  );

  return [...pinnedSections, ...remainingSections];
}

export function buildPreviewDraftFromContent(
  content: EventWebsiteContent,
): EventWebsitePreviewDraft {
  return buildEventWebsiteRenderModel(content);
}

export function buildEventWebsiteContentFromPreviewDraft({
  enabledSections,
  previewDraft,
  savedContent,
  sectionOrder,
}: {
  enabledSections: Partial<Record<EventWebsiteSectionKey, boolean>>;
  previewDraft: EventWebsitePreviewDraft;
  savedContent: EventWebsiteContent;
  sectionOrder: readonly EventWebsiteSectionKey[];
}): EventWebsiteContent {
  return {
    ...savedContent,
    layout: {
      enabledSections: {
        ...savedContent.layout.enabledSections,
        ...pickSavedSectionEnabledState(enabledSections),
      },
      sectionOrder: mapSectionOrder(sectionOrder),
    },
    sections: {
      attire_motif: {
        colorMotifNote: previewDraft.attireDressCode.colorMotifNote,
        dressCodeNote: previewDraft.attireDressCode.dressCodeNote,
        sectionIntro: previewDraft.attireDressCode.sectionIntro,
      },
      contact_socials: {
        contactNumber: previewDraft.contactSocials.contactNumber,
        contactPerson: previewDraft.contactSocials.contactPerson,
        email: previewDraft.contactSocials.email,
        facebookUrl: previewDraft.contactSocials.facebookUrl,
        instagramUrl: previewDraft.contactSocials.instagramUrl,
        tikTokUrl: previewDraft.contactSocials.tikTokUrl,
      },
      countdown: {
        shortNote: previewDraft.countdown.shortNote,
        title: previewDraft.countdown.title,
      },
      extra_info: {
        items: previewDraft.extraInfo.items.map((item, index) => ({
          details: item.details,
          id:
            item.id ||
            savedContent.sections.extra_info.items[index]?.id ||
            createEventWebsiteDraftItemId("extra-info"),
          title: item.title,
        })),
        sectionIntro: previewDraft.extraInfo.sectionIntro,
        sectionTitle: previewDraft.extraInfo.sectionTitle,
      },
      gallery: {
        sectionIntro: savedContent.sections.gallery.sectionIntro,
        sectionTitle: savedContent.sections.gallery.sectionTitle,
      },
      gift_details: {
        giftNote: previewDraft.giftDetails.giftNote,
        options: previewDraft.giftDetails.options.map((option, index) => ({
          id:
            option.id ||
            savedContent.sections.gift_details.options[index]?.id ||
            createEventWebsiteDraftItemId("gift-option"),
          image:
            option.image ??
            savedContent.sections.gift_details.options.find(
              (savedOption) => savedOption.id === option.id,
            )?.image ??
            savedContent.sections.gift_details.options[index]?.image ??
            null,
          title: option.title,
        })),
        sectionIntro: previewDraft.giftDetails.sectionIntro,
      },
      guestbook: {
        emptyStateMessage: previewDraft.guestbook.emptyStateMessage,
        sectionIntro: previewDraft.guestbook.sectionIntro,
        sectionTitle: previewDraft.guestbook.sectionTitle,
      },
      host_info: {
        brideName: previewDraft.coupleInfo.brideName,
        displayAs: previewDraft.coupleInfo.displayAs,
        groomName: previewDraft.coupleInfo.groomName,
        hostLine: previewDraft.coupleInfo.hostLine,
        shortHostMessage: previewDraft.coupleInfo.shortHostMessage,
      },
      main_event: {
        endTime: previewDraft.ceremony.endTime,
        eventDate: previewDraft.ceremony.eventDate,
        eventLabel: previewDraft.ceremony.eventLabel,
        eventTime: previewDraft.ceremony.eventTime,
        rsvpDeadline: previewDraft.ceremony.rsvpDeadline,
        scheduleNote: previewDraft.ceremony.scheduleNote,
      },
      music_effects: {
        musicLink: previewDraft.musicEffects.musicLink,
        musicTitle: previewDraft.musicEffects.musicTitle,
        playButtonLabel: previewDraft.musicEffects.playButtonLabel,
        shortNote: previewDraft.musicEffects.shortNote,
      },
      principal_sponsors: {
        introLine: previewDraft.principalSponsors.introLine,
        names: previewDraft.principalSponsors.names,
      },
      rsvp_form: {
        companionAgeEnabled: previewDraft.rsvpForm.companionAgeEnabled,
        companionLimit: parseCompanionLimit(
          previewDraft.rsvpForm.companionLimit,
          savedContent.sections.rsvp_form.companionLimit,
        ),
        companionNameEnabled: previewDraft.rsvpForm.companionNameEnabled,
        customQuestions: previewDraft.rsvpForm.customQuestions.map((question, index) => ({
          fieldType: question.fieldType as EventWebsiteCustomQuestionFieldType,
          id:
            question.id ||
            savedContent.sections.rsvp_form.customQuestions[index]?.id ||
            createEventWebsiteDraftItemId("custom-question"),
          label: question.label,
          options: [...question.options],
          required: question.required,
        })),
        emailEnabled: true,
        emailRequired: true,
        foodAllergiesEnabled: previewDraft.rsvpForm.foodAllergiesEnabled,
        messageToHostEnabled: true,
        phoneEnabled: previewDraft.rsvpForm.phoneEnabled,
        phoneRequired: previewDraft.rsvpForm.phoneEnabled
          ? previewDraft.rsvpForm.phoneRequired
          : false,
        plusOneEnabled: previewDraft.rsvpForm.plusOneEnabled,
      },
      secondary_event: {
        address: previewDraft.reception.address,
        endTime: previewDraft.reception.endTime,
        mapsLink: previewDraft.reception.mapsLink,
        note: previewDraft.reception.note,
        startTime: previewDraft.reception.startTime,
        title: previewDraft.reception.title,
        venueName: previewDraft.reception.venueName,
      },
      story_message: {
        sectionIntro: previewDraft.loveStory.sectionIntro,
        storyBody: previewDraft.loveStory.storyBody,
        storyTitle: previewDraft.loveStory.storyTitle,
      },
      timeline_program: {
        items: previewDraft.timelineProgram.items.map((item, index) => ({
          description: item.description,
          id:
            item.id ||
            savedContent.sections.timeline_program.items[index]?.id ||
            createEventWebsiteDraftItemId("timeline-item"),
          time: item.time,
          title: item.title,
        })),
      },
      entourage: {
        groups: previewDraft.entourage.groups.map((group, index) => ({
          groupTitle: group.groupTitle,
          id:
            group.id ||
            savedContent.sections.entourage.groups[index]?.id ||
            createEventWebsiteDraftItemId("entourage-group"),
          names: group.names,
        })),
        introLine: previewDraft.entourage.introLine,
      },
      venue: {
        address: previewDraft.venue.address,
        arrivalNote: previewDraft.venue.arrivalNote,
        mapsLink: previewDraft.venue.mapsLink,
        venueName: previewDraft.venue.venueName,
      },
    },
  };
}

function mapSectionOrder(
  sectionOrder: readonly EventWebsiteSectionKey[],
): EventWebsiteContentSectionKey[] {
  return sectionOrder.filter((key): key is EventWebsiteContentSectionKey =>
    eventWebsiteContentSectionKeys.includes(key as EventWebsiteContentSectionKey),
  );
}

function parseCompanionLimit(value: string, fallback: number) {
  const parsed = Number.parseInt(value, 10);

  if (Number.isNaN(parsed)) {
    return fallback;
  }

  return Math.max(0, Math.min(parsed, 10));
}

function pickSavedSectionEnabledState(
  enabledSections: Partial<Record<EventWebsiteSectionKey, boolean>>,
): Partial<Record<EventWebsiteContentSectionKey, boolean>> {
  return Object.fromEntries(
    eventWebsiteContentSectionKeys.flatMap((key) =>
      typeof enabledSections[key] === "boolean" ? [[key, enabledSections[key]]] : [],
    ),
  ) as Partial<Record<EventWebsiteContentSectionKey, boolean>>;
}

export function formatPreviewDate(value: string, fallback: string) {
  return formatEventWebsiteDate(value, fallback);
}

export function formatPreviewTime(value: string, fallback: string) {
  return formatEventWebsiteTime(value, fallback);
}

export function formatPreviewDateTime(value: string, fallback: string) {
  return formatEventWebsiteDateTime(value, fallback);
}

function formatInputTime(value: string | null) {
  if (!value) {
    return "";
  }

  return value.slice(0, 5);
}

function formatDateTimeLocal(value: string | null) {
  return formatEventWebsiteDateTimeLocalInput(value);
}

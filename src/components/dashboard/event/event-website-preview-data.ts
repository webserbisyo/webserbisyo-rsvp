import type { EventWebsiteSectionDefinition, EventWebsiteSectionKey } from "@/config/event-website-sections";
import {
  eventWebsiteContentSectionKeys,
  type EventWebsiteContent,
  type EventWebsiteContentSectionKey,
  type EventWebsiteCustomQuestionFieldType,
} from "@/lib/event-website/types";

export type EventWebsitePreviewDevice = "desktop" | "mobile";

export type EventWebsiteCustomQuestionDraft = {
  fieldType: string;
  label: string;
  options: string[];
  required: boolean;
};

export type EventWebsiteTimelineItemDraft = {
  description: string;
  time: string;
  title: string;
};

export type EventWebsiteEntourageGroupDraft = {
  groupTitle: string;
  names: string;
};

export type EventWebsiteExtraInfoItemDraft = {
  details: string;
  title: string;
};

export type EventWebsiteGiftOptionDraft = {
  file: File | null;
  title: string;
};

export type EventWebsitePreviewDraft = {
  attireDressCode: {
    colorMotifNote: string;
    dressCodeNote: string;
    sectionIntro: string;
  };
  ceremony: {
    endTime: string;
    eventDate: string;
    eventLabel: string;
    eventTime: string;
    rsvpDeadline: string;
    scheduleNote: string;
  };
  contactSocials: {
    contactNumber: string;
    contactPerson: string;
    email: string;
    facebookUrl: string;
    instagramUrl: string;
    tikTokUrl: string;
  };
  countdown: {
    shortNote: string;
    title: string;
  };
  coupleInfo: {
    brideName: string;
    displayAs: string;
    groomName: string;
    hostLine: string;
    shortHostMessage: string;
  };
  entourage: {
    groups: EventWebsiteEntourageGroupDraft[];
    introLine: string;
  };
  extraInfo: {
    items: EventWebsiteExtraInfoItemDraft[];
    sectionIntro: string;
    sectionTitle: string;
  };
  giftDetails: {
    options: EventWebsiteGiftOptionDraft[];
    giftNote: string;
    sectionIntro: string;
  };
  loveStory: {
    sectionIntro: string;
    storyBody: string;
    storyTitle: string;
  };
  messages: {
    messageBody: string;
    sectionTitle: string;
  };
  musicEffects: {
    musicLink: string;
    musicTitle: string;
    playButtonLabel: string;
    shortNote: string;
  };
  principalSponsors: {
    introLine: string;
    names: string;
  };
  reception: {
    address: string;
    endTime: string;
    mapsLink: string;
    note: string;
    startTime: string;
    title: string;
    venueName: string;
  };
  rsvpForm: {
    companionAgeEnabled: boolean;
    companionLimit: string;
    companionNameEnabled: boolean;
    customQuestions: EventWebsiteCustomQuestionDraft[];
    foodAllergiesEnabled: boolean;
    messageToHostEnabled: boolean;
    plusOneEnabled: boolean;
  };
  timelineProgram: {
    items: EventWebsiteTimelineItemDraft[];
  };
  venue: {
    address: string;
    arrivalNote: string;
    mapsLink: string;
    venueName: string;
  };
};

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
  eventWebsiteContentSectionKeys as readonly EventWebsiteSectionKey[];

const defaultWeddingFlow: EventWebsiteSectionKey[] = [...eventWebsiteContentSectionKeys];

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
      { groupTitle: "Maid of Honor", names: "Maria Santos" },
      { groupTitle: "Best Man", names: "Juan Dela Cruz" },
      { groupTitle: "Bridesmaids", names: "Ana Cruz, Bella Reyes, Carla Lim" },
      { groupTitle: "Groomsmen", names: "Marco Reyes, Paolo Santos, Luis Garcia" },
    ],
    introLine: "Meet the family and friends standing with us on our wedding day.",
  },
  extraInfo: {
    items: [
      { details: "Parking is available near the venue entrance.", title: "Parking" },
      { details: "Please arrive at least 30 minutes before the ceremony.", title: "Reminder" },
    ],
    sectionIntro: "Here are a few helpful notes for our guests.",
    sectionTitle: "Additional Details",
  },
  giftDetails: {
    giftNote:
      "If you wish to give a gift, a monetary gift would be greatly appreciated as we begin this new chapter together.",
    options: [
      { file: null, title: "GCash" },
      { file: null, title: "Bank Transfer" },
    ],
    sectionIntro: "Your presence is the greatest gift.",
  },
  loveStory: {
    sectionIntro: "A little story about how our journey began.",
    storyBody:
      "From the first hello to this special day, our journey has been filled with simple moments, answered prayers, and love that continued to grow. We are grateful to celebrate this chapter with the people who matter most to us.",
    storyTitle: "Our Story",
  },
  messages: {
    messageBody:
      "Your presence means the world to us. Thank you for celebrating this special day with us.",
    sectionTitle: "A Note from Us",
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
    foodAllergiesEnabled: false,
    messageToHostEnabled: true,
    plusOneEnabled: false,
  },
  timelineProgram: {
    items: [
      {
        description: "Guests may proceed to the entrance area.",
        time: "15:00",
        title: "Guest Arrival",
      },
      {
        description: "The wedding ceremony begins.",
        time: "16:00",
        title: "Ceremony",
      },
      {
        description: "Dinner and program will follow.",
        time: "18:00",
        title: "Reception",
      },
      {
        description: "Celebrate with food, speeches, and special moments.",
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
    return buildPreviewDraftFromContent(eventData.eventWebsiteContent);
  }

  return {
    ...previewDefaultDraft,
    attireDressCode: { ...previewDefaultDraft.attireDressCode },
    ceremony: {
      ...previewDefaultDraft.ceremony,
      eventDate: eventData.eventDate || previewDefaultDraft.ceremony.eventDate,
      eventTime: formatInputTime(eventData.eventTime) || previewDefaultDraft.ceremony.eventTime,
      rsvpDeadline: formatDateTimeLocal(eventData.rsvpCloseAt) || previewDefaultDraft.ceremony.rsvpDeadline,
      scheduleNote: eventData.eventContent?.scheduleNote || previewDefaultDraft.ceremony.scheduleNote,
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
    messages: { ...previewDefaultDraft.messages },
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
      section.required ? true : hydratedEnabledSections?.[section.key] ?? section.defaultEnabled,
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

export function buildPreviewDraftFromContent(content: EventWebsiteContent): EventWebsitePreviewDraft {
  return {
    attireDressCode: {
      colorMotifNote: content.sections.attire_motif.colorMotifNote,
      dressCodeNote: content.sections.attire_motif.dressCodeNote,
      sectionIntro: content.sections.attire_motif.sectionIntro,
    },
    ceremony: {
      endTime: content.sections.main_event.endTime,
      eventDate: content.sections.main_event.eventDate,
      eventLabel: content.sections.main_event.eventLabel,
      eventTime: content.sections.main_event.eventTime,
      rsvpDeadline: content.sections.main_event.rsvpDeadline,
      scheduleNote: content.sections.main_event.scheduleNote,
    },
    contactSocials: {
      contactNumber: content.sections.contact_socials.contactNumber,
      contactPerson: content.sections.contact_socials.contactPerson,
      email: content.sections.contact_socials.email,
      facebookUrl: content.sections.contact_socials.facebookUrl,
      instagramUrl: content.sections.contact_socials.instagramUrl,
      tikTokUrl: content.sections.contact_socials.tikTokUrl,
    },
    countdown: {
      shortNote: content.sections.countdown.shortNote,
      title: content.sections.countdown.title,
    },
    coupleInfo: {
      brideName: content.sections.host_info.brideName,
      displayAs: content.sections.host_info.displayAs,
      groomName: content.sections.host_info.groomName,
      hostLine: content.sections.host_info.hostLine,
      shortHostMessage: content.sections.host_info.shortHostMessage,
    },
    entourage: {
      groups: content.sections.entourage.groups.map((group) => ({
        groupTitle: group.groupTitle,
        names: group.names,
      })),
      introLine: content.sections.entourage.introLine,
    },
    extraInfo: {
      items: content.sections.extra_info.items.map((item) => ({
        details: item.details,
        title: item.title,
      })),
      sectionIntro: content.sections.extra_info.sectionIntro,
      sectionTitle: content.sections.extra_info.sectionTitle,
    },
    giftDetails: {
      giftNote: content.sections.gift_details.giftNote,
      options: content.sections.gift_details.options.map((option) => ({
        file: null,
        title: option.title,
      })),
      sectionIntro: content.sections.gift_details.sectionIntro,
    },
    loveStory: {
      sectionIntro: content.sections.story_message.sectionIntro,
      storyBody: content.sections.story_message.storyBody,
      storyTitle: content.sections.story_message.storyTitle,
    },
    messages: {
      messageBody: content.sections.guestbook.messageBody,
      sectionTitle: content.sections.guestbook.sectionTitle,
    },
    musicEffects: {
      musicLink: content.sections.music_effects.musicLink,
      musicTitle: content.sections.music_effects.musicTitle,
      playButtonLabel: content.sections.music_effects.playButtonLabel,
      shortNote: content.sections.music_effects.shortNote,
    },
    principalSponsors: {
      introLine: content.sections.principal_sponsors.introLine,
      names: content.sections.principal_sponsors.names,
    },
    reception: {
      address: content.sections.secondary_event.address,
      endTime: content.sections.secondary_event.endTime,
      mapsLink: content.sections.secondary_event.mapsLink,
      note: content.sections.secondary_event.note,
      startTime: content.sections.secondary_event.startTime,
      title: content.sections.secondary_event.title,
      venueName: content.sections.secondary_event.venueName,
    },
    rsvpForm: {
      companionAgeEnabled: content.sections.rsvp_form.companionAgeEnabled,
      companionLimit: `${content.sections.rsvp_form.companionLimit}`,
      companionNameEnabled: content.sections.rsvp_form.companionNameEnabled,
      customQuestions: content.sections.rsvp_form.customQuestions.map((question) => ({
        fieldType: question.fieldType,
        label: question.label,
        options: [...question.options],
        required: question.required,
      })),
      foodAllergiesEnabled: content.sections.rsvp_form.foodAllergiesEnabled,
      messageToHostEnabled: content.sections.rsvp_form.messageToHostEnabled,
      plusOneEnabled: content.sections.rsvp_form.plusOneEnabled,
    },
    timelineProgram: {
      items: content.sections.timeline_program.items.map((item) => ({
        description: item.description,
        time: item.time,
        title: item.title,
      })),
    },
    venue: {
      address: content.sections.venue.address,
      arrivalNote: content.sections.venue.arrivalNote,
      mapsLink: content.sections.venue.mapsLink,
      venueName: content.sections.venue.venueName,
    },
  };
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
          id: savedContent.sections.extra_info.items[index]?.id ?? `extra-info-${index + 1}`,
          title: item.title,
        })),
        sectionIntro: previewDraft.extraInfo.sectionIntro,
        sectionTitle: previewDraft.extraInfo.sectionTitle,
      },
      gift_details: {
        giftNote: previewDraft.giftDetails.giftNote,
        options: previewDraft.giftDetails.options.map((option, index) => ({
          id: savedContent.sections.gift_details.options[index]?.id ?? `gift-option-${index + 1}`,
          image: savedContent.sections.gift_details.options[index]?.image ?? null,
          title: option.title,
        })),
        sectionIntro: previewDraft.giftDetails.sectionIntro,
      },
      guestbook: {
        messageBody: previewDraft.messages.messageBody,
        sectionTitle: previewDraft.messages.sectionTitle,
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
          id: savedContent.sections.rsvp_form.customQuestions[index]?.id ?? `custom-question-${index + 1}`,
          label: question.label,
          options: [...question.options],
          required: question.required,
        })),
        foodAllergiesEnabled: previewDraft.rsvpForm.foodAllergiesEnabled,
        messageToHostEnabled: previewDraft.rsvpForm.messageToHostEnabled,
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
          id: savedContent.sections.timeline_program.items[index]?.id ?? `timeline-item-${index + 1}`,
          time: item.time,
          title: item.title,
        })),
      },
      entourage: {
        groups: previewDraft.entourage.groups.map((group, index) => ({
          groupTitle: group.groupTitle,
          id: savedContent.sections.entourage.groups[index]?.id ?? `entourage-group-${index + 1}`,
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

function mapSectionOrder(sectionOrder: readonly EventWebsiteSectionKey[]): EventWebsiteContentSectionKey[] {
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
  if (!value) {
    return fallback;
  }

  const date = new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return fallback;
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "full",
  }).format(date);
}

export function formatPreviewTime(value: string, fallback: string) {
  if (!value) {
    return fallback;
  }

  const [hours, minutes] = value.split(":");
  const date = new Date();
  date.setHours(Number(hours), Number(minutes), 0, 0);

  if (Number.isNaN(date.getTime())) {
    return fallback;
  }

  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

export function formatPreviewDateTime(value: string, fallback: string) {
  if (!value) {
    return fallback;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return fallback;
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "long",
    timeStyle: "short",
  }).format(date);
}

function formatInputTime(value: string | null) {
  if (!value) {
    return "";
  }

  return value.slice(0, 5);
}

function formatDateTimeLocal(value: string | null) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const offsetDate = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return offsetDate.toISOString().slice(0, 16);
}

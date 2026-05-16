import type { EventWebsiteSectionDefinition, EventWebsiteSectionKey } from "@/config/event-website-sections";

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
  eventContent: {
    coupleOrCelebrantNames: string | null;
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

export const previewSupportedSectionKeys = [
  "host_info",
  "countdown",
  "music_effects",
  "main_event",
  "venue",
  "secondary_event",
  "timeline_program",
  "entourage",
  "principal_sponsors",
  "attire_motif",
  "extra_info",
  "rsvp_form",
  "gift_details",
  "guestbook",
  "story_message",
  "contact_socials",
] as const satisfies EventWebsiteSectionKey[];

const defaultWeddingFlow: EventWebsiteSectionKey[] = [
  "host_info",
  "countdown",
  "music_effects",
  "main_event",
  "venue",
  "secondary_event",
  "timeline_program",
  "entourage",
  "principal_sponsors",
  "attire_motif",
  "extra_info",
  "rsvp_form",
  "gift_details",
  "guestbook",
  "story_message",
  "contact_socials",
];

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
): Record<EventWebsiteSectionKey, boolean> {
  return Object.fromEntries(
    sections.map((section) => [section.key, section.required || section.defaultEnabled]),
  ) as Record<EventWebsiteSectionKey, boolean>;
}

export function buildInitialWebsiteFlow(
  sections: EventWebsiteSectionDefinition[],
): EventWebsiteSectionDefinition[] {
  const sectionMap = new Map(sections.map((section) => [section.key, section]));
  const pinnedSections = defaultWeddingFlow
    .map((key) => sectionMap.get(key))
    .filter((section): section is EventWebsiteSectionDefinition => Boolean(section));
  const pinnedKeys = new Set(pinnedSections.map((section) => section.key));
  const remainingSections = sections.filter(
    (section) => !section.comingSoon && !pinnedKeys.has(section.key),
  );

  return [...pinnedSections, ...remainingSections];
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

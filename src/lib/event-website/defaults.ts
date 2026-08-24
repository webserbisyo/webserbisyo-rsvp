import {
  DEFAULT_EVENT_WEBSITE_GUESTBOOK_EMPTY_STATE,
  DEFAULT_EVENT_WEBSITE_GUESTBOOK_INTRO,
  DEFAULT_EVENT_WEBSITE_GUESTBOOK_TITLE,
  DEFAULT_RSVP_DEADLINE_OFFSET_DAYS,
  DEFAULT_RSVP_DEADLINE_TIME,
  DEFAULT_WEDDING_EVENT_TYPE,
  eventWebsiteContentSectionKeys,
  type EventWebsiteContent,
  type EventWebsiteContentEventType,
  type EventWebsiteContentSectionKey,
  type EventWebsiteDefaultsContext,
} from "@/lib/event-website/types";
import {
  formatCanonicalRsvpCloseAtToEditorInput,
  normalizeCanonicalDateInput,
  normalizeCanonicalTimeInput,
} from "@/lib/event-website/canonical";

const DEFAULT_WEDDING_EVENT_DATE = "2026-06-06";
const DEFAULT_WEDDING_EVENT_TIME = "16:00";
const DEFAULT_WEDDING_EVENT_END_TIME = "18:00";

export function getDefaultWeddingSectionOrder(): EventWebsiteContentSectionKey[] {
  return [...eventWebsiteContentSectionKeys];
}

export function getDefaultDebutSectionOrder(): EventWebsiteContentSectionKey[] {
  return [
    "host_info",
    "countdown",
    "music_effects",
    "gallery",
    "story_message",
    "main_event",
    "venue",
    "secondary_event",
    "timeline_program",
    "eighteen_roses_candles",
    "debut_court",
    "principal_sponsors",
    "attire_motif",
    "extra_info",
    "rsvp_form",
    "gift_details",
    "guestbook",
    "contact_socials",
    "entourage",
    "godparents",
  ];
}

export function getDefaultBirthdaySectionOrder(): EventWebsiteContentSectionKey[] {
  return [
    "host_info",
    "countdown",
    "music_effects",
    "gallery",
    "story_message",
    "main_event",
    "venue",
    "secondary_event",
    "timeline_program",
    "principal_sponsors",
    "attire_motif",
    "extra_info",
    "rsvp_form",
    "gift_details",
    "guestbook",
    "contact_socials",
    "entourage",
    "eighteen_roses_candles",
    "debut_court",
    "godparents",
  ];
}

export function getDefaultBaptismSectionOrder(): EventWebsiteContentSectionKey[] {
  return [
    "host_info",
    "countdown",
    "music_effects",
    "gallery",
    "story_message",
    "main_event",
    "venue",
    "secondary_event",
    "timeline_program",
    "godparents",
    "attire_motif",
    "extra_info",
    "rsvp_form",
    "gift_details",
    "guestbook",
    "contact_socials",
    "entourage",
    "eighteen_roses_candles",
    "debut_court",
    "principal_sponsors",
  ];
}

export function getDefaultWeddingEnabledSections(): Record<EventWebsiteContentSectionKey, boolean> {
  return Object.fromEntries(
    eventWebsiteContentSectionKeys.map((key) => [
      key,
      !["eighteen_roses_candles", "debut_court", "godparents"].includes(key),
    ]),
  ) as Record<EventWebsiteContentSectionKey, boolean>;
}

export function getDisallowedSectionsForEventType(
  eventType?: string | null,
): readonly EventWebsiteContentSectionKey[] {
  const normalized = typeof eventType === "string" ? eventType.toLowerCase() : "wedding";
  if (normalized === "debut") {
    return ["entourage", "godparents"];
  }
  if (normalized === "birthday") {
    return ["entourage", "eighteen_roses_candles", "debut_court", "godparents"];
  }
  if (normalized === "baptism") {
    return ["entourage", "eighteen_roses_candles", "debut_court", "principal_sponsors"];
  }
  if (normalized === "wedding") {
    return ["eighteen_roses_candles", "debut_court", "godparents"];
  }
  return [];
}

function isLegacyDebutSectionOrder(storedOrder: readonly string[]): boolean {
  const contactIndex = storedOrder.indexOf("contact_socials");
  const rosesIndex = storedOrder.indexOf("eighteen_roses_candles");
  const courtIndex = storedOrder.indexOf("debut_court");
  const storyIndex = storedOrder.indexOf("story_message");

  return (
    (contactIndex !== -1 && rosesIndex !== -1 && contactIndex < rosesIndex) ||
    (contactIndex !== -1 && courtIndex !== -1 && contactIndex < courtIndex) ||
    (contactIndex !== -1 && storyIndex !== -1 && storyIndex > contactIndex)
  );
}

function isLegacyBirthdaySectionOrder(storedOrder: readonly string[]): boolean {
  const contactIndex = storedOrder.indexOf("contact_socials");
  const attireIndex = storedOrder.indexOf("attire_motif");
  const sponsorsIndex = storedOrder.indexOf("principal_sponsors");
  return (
    (contactIndex !== -1 && attireIndex !== -1 && contactIndex < attireIndex) ||
    (contactIndex !== -1 && sponsorsIndex !== -1 && contactIndex < sponsorsIndex)
  );
}

function isLegacyBaptismSectionOrder(storedOrder: readonly string[]): boolean {
  const contactIndex = storedOrder.indexOf("contact_socials");
  const godparentsIndex = storedOrder.indexOf("godparents");
  const secondaryIndex = storedOrder.indexOf("secondary_event");

  return (
    (contactIndex !== -1 && godparentsIndex !== -1 && contactIndex < godparentsIndex) ||
    (secondaryIndex !== -1 && secondaryIndex < 3) ||
    storedOrder.length !== 20
  );
}

const LEGACY_WEDDING_CORE_KEYS: readonly string[] = [
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

/**
 * Resolves the canonical section order for an event website.
 * - For "wedding", the section order is fixed to the canonical wedding sequence (getDefaultWeddingSectionOrder())
 *   when complete or legacy-upgradeable, but retains incomplete arrays to reject malformed data.
 * - For "debut", auto-upgrades legacy stored orders (where contact_socials precedes traditions) to getDefaultDebutSectionOrder().
 * - For "birthday", auto-upgrades legacy stored orders (where contact_socials precedes attire/sponsors) to getDefaultBirthdaySectionOrder().
 * - For "baptism", auto-upgrades legacy stored orders to getDefaultBaptismSectionOrder().
 * - For other custom orders, preserves any valid stored custom order, appending missing default keys.
 */
export function resolveEventWebsiteSectionOrder({
  eventType,
  storedSectionOrder,
}: {
  eventType?: string | null;
  storedSectionOrder?: readonly string[] | null;
}): EventWebsiteContentSectionKey[] {
  const normalizedType = typeof eventType === "string" ? eventType : "wedding";
  const rawOrder = Array.isArray(storedSectionOrder) ? storedSectionOrder : [];

  if (normalizedType === "wedding") {
    if (rawOrder.length === 0) {
      return getDefaultWeddingSectionOrder();
    }
    const hasAllCoreKeys = LEGACY_WEDDING_CORE_KEYS.every((key) => rawOrder.includes(key));
    if (hasAllCoreKeys) {
      return getDefaultWeddingSectionOrder();
    }
    return rawOrder.filter((key): key is EventWebsiteContentSectionKey =>
      eventWebsiteContentSectionKeys.includes(key as EventWebsiteContentSectionKey),
    );
  }
  if (normalizedType === "debut" && (rawOrder.length === 0 || isLegacyDebutSectionOrder(rawOrder))) {
    return getDefaultDebutSectionOrder();
  }
  if (normalizedType === "birthday" && (rawOrder.length === 0 || isLegacyBirthdaySectionOrder(rawOrder))) {
    return getDefaultBirthdaySectionOrder();
  }
  if (normalizedType === "baptism" && (rawOrder.length === 0 || isLegacyBaptismSectionOrder(rawOrder))) {
    return getDefaultBaptismSectionOrder();
  }

  const defaults = buildDefaultEventWebsiteContent(normalizedType);
  const seenOrderKeys = new Set<EventWebsiteContentSectionKey>();
  const sectionOrder: EventWebsiteContentSectionKey[] = [];

  for (const item of rawOrder) {
    if (
      typeof item === "string" &&
      eventWebsiteContentSectionKeys.includes(item as EventWebsiteContentSectionKey) &&
      !seenOrderKeys.has(item as EventWebsiteContentSectionKey)
    ) {
      seenOrderKeys.add(item as EventWebsiteContentSectionKey);
      sectionOrder.push(item as EventWebsiteContentSectionKey);
    }
  }

  for (const defaultKey of defaults.layout.sectionOrder) {
    if (!seenOrderKeys.has(defaultKey)) {
      seenOrderKeys.add(defaultKey);
      sectionOrder.push(defaultKey);
    }
  }

  return sectionOrder;
}

export function buildDefaultWeddingEventWebsiteContent(
  context: EventWebsiteDefaultsContext = {},
): EventWebsiteContent {
  const rawCoupleNames = firstNonEmpty(context.eventContent?.coupleOrCelebrantNames);
  const coupleNames = deriveWeddingNames(rawCoupleNames);
  const hostLine = firstNonEmpty(
    context.eventContent?.heroTitle,
    context.event?.title,
    buildClientWeddingTitle(context.client?.name),
    "Alexander Morales Wedding RSVP",
  );
  const shortHostMessage = firstNonEmpty(
    context.eventContent?.heroSubtitle,
    buildWeddingInvitationMessage(coupleNames.groomName, coupleNames.brideName),
  );
  const eventDate =
    normalizeCanonicalDateInput(context.event?.eventDate) || DEFAULT_WEDDING_EVENT_DATE;
  const eventTime =
    normalizeCanonicalTimeInput(context.event?.eventTime) || DEFAULT_WEDDING_EVENT_TIME;
  const rsvpDeadline =
    formatCanonicalRsvpCloseAtToEditorInput(context.event?.rsvpCloseAt) ||
    buildDefaultRsvpDeadline(eventDate, DEFAULT_RSVP_DEADLINE_OFFSET_DAYS);
  const venueName = firstNonEmpty(context.event?.venueName, "The Ruins, Bacolod");
  const venueAddress = firstNonEmpty(
    context.event?.venueAddress,
    extractApplicationLocation(context.application),
    "Talisay City, Negros Occidental, Philippines",
  );
  const contactPerson = firstNonEmpty(
    context.client?.contactName,
    context.profile?.fullName,
    "Anna Santos",
  );
  const contactEmail = firstNonEmpty(context.profile?.email, "hello@example.com");

  return {
    assets: {},
    eventType: DEFAULT_WEDDING_EVENT_TYPE,
    layout: {
      enabledSections: getDefaultWeddingEnabledSections(),
      sectionOrder: getDefaultWeddingSectionOrder(),
    },
    meta: {
      savedAt: null,
      savedBy: null,
    },
    sections: {
      attire_motif: {
        colorMotifNote: "Please wear shades that complement our wedding colors.",
        dressCodeNote: "Formal or semi-formal attire is encouraged.",
        sectionIntro: "We would love to see you in our wedding motif.",
      },
      contact_socials: {
        contactNumber: "",
        contactPerson,
        email: contactEmail,
        facebookUrl: "",
        instagramUrl: "",
        tikTokUrl: "",
      },
      countdown: {
        shortNote: "We can't wait to celebrate with you.",
        title: "Counting down to our special day",
      },
      extra_info: {
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
      gallery: {
        sectionIntro: "Photo highlights and visual memories.",
        sectionTitle: "Gallery",
      },
      gift_details: {
        giftNote: firstNonEmpty(
          context.eventContent?.giftNote,
          "If you wish to give a gift, a monetary gift would be greatly appreciated as we begin this new chapter together.",
        ),
        options: [
          { id: "gift-option-1", image: null, title: "GCash" },
          { id: "gift-option-2", image: null, title: "Bank Transfer" },
        ],
        sectionIntro: "Your presence is the greatest gift.",
      },
      guestbook: {
        emptyStateMessage: DEFAULT_EVENT_WEBSITE_GUESTBOOK_EMPTY_STATE,
        sectionIntro: DEFAULT_EVENT_WEBSITE_GUESTBOOK_INTRO,
        sectionTitle: DEFAULT_EVENT_WEBSITE_GUESTBOOK_TITLE,
      },
      host_info: {
        kind: "wedding",
        brideName: coupleNames.brideName,
        displayAs: coupleNames.displayAs,
        groomName: coupleNames.groomName,
        hostLine,
        shortHostMessage,
      },
      main_event: {
        endTime: DEFAULT_WEDDING_EVENT_END_TIME,
        eventDate,
        eventLabel: "Wedding Ceremony",
        eventTime,
        rsvpDeadline,
        scheduleNote: firstNonEmpty(
          context.eventContent?.scheduleNote,
          "Please arrive at least 15 minutes before the ceremony starts.",
        ),
      },
      music_effects: {
        musicLink: "",
        musicTitle: "Our Wedding Song",
        playButtonLabel: "Play our song",
        shortNote: "A song that reminds us of our journey together.",
      },
      principal_sponsors: {
        introLine: "We are grateful for the love and guidance of our principal sponsors.",
        names:
          "Mr. Juan Dela Cruz\nMrs. Maria Dela Cruz\nMr. Pedro Santos\nMrs. Ana Santos\nMr. Roberto Reyes\nMrs. Elena Reyes",
      },
      rsvp_form: {
        companionAgeEnabled: false,
        companionLimit: 1,
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
      secondary_event: {
        address: venueAddress,
        endTime: "21:00",
        mapsLink: "",
        note: "Dinner and program will follow after the ceremony.",
        startTime: "18:00",
        title: "Wedding Reception",
        venueName: "The Ruins Garden Hall",
      },
      story_message: {
        sectionIntro: "A little story about how our journey began.",
        storyBody: firstNonEmpty(
          context.eventContent?.eventStory,
          "From the first hello to this special day, our journey has been filled with simple moments, answered prayers, and love that continued to grow. We are grateful to celebrate this chapter with the people who matter most to us.",
        ),
        storyTitle: "Our Story",
      },
      timeline_program: {
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
            time: eventTime,
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
      venue: {
        address: venueAddress,
        arrivalNote: firstNonEmpty(
          context.eventContent?.venueNote,
          "Parking is available near the entrance. Please follow the event signage upon arrival.",
        ),
        mapsLink: "",
        venueName,
      },
      eighteen_roses_candles: { groups: [] },
      debut_court: { groups: [] },
      godparents: { groups: [] },
    },
    version: 1,
  };
}

export function buildDefaultEventWebsiteContent(
  eventType: string | null | undefined,
  context: EventWebsiteDefaultsContext = {},
): EventWebsiteContent {
  if (eventType === "wedding") return buildDefaultWeddingEventWebsiteContent(context);
  if (eventType === "birthday") return buildDefaultBirthdayEventWebsiteContent(context);
  if (eventType === "debut") return buildDefaultDebutEventWebsiteContent(context);
  if (eventType === "baptism") return buildDefaultBaptismEventWebsiteContent(context);
  return buildDefaultWeddingEventWebsiteContent(context);
}

export function buildDefaultBirthdayEventWebsiteContent(
  context: EventWebsiteDefaultsContext = {},
): EventWebsiteContent {
  return buildNeutralTargetContent("birthday", context, {
    guestbookTitle: "Birthday Wishes",
    mainEventLabel: "Birthday Celebration",
    sectionOrder: getDefaultBirthdaySectionOrder(),
    storyTitle: "Celebrant's Story",
    enabled: [
      "host_info",
      "countdown",
      "music_effects",
      "gallery",
      "story_message",
      "main_event",
      "venue",
      "timeline_program",
      "attire_motif",
      "rsvp_form",
      "gift_details",
      "guestbook",
      "contact_socials",
    ],
  });
}

export function buildDefaultDebutEventWebsiteContent(
  context: EventWebsiteDefaultsContext = {},
): EventWebsiteContent {
  return buildNeutralTargetContent("debut", context, {
    guestbookTitle: "Debut Wishes",
    mainEventLabel: "Debut Celebration",
    sectionOrder: getDefaultDebutSectionOrder(),
    storyTitle: "A Special Celebration",
    enabled: [
      "host_info",
      "countdown",
      "music_effects",
      "gallery",
      "story_message",
      "main_event",
      "venue",
      "timeline_program",
      "eighteen_roses_candles",
      "attire_motif",
      "rsvp_form",
      "gift_details",
      "guestbook",
      "contact_socials",
    ],
  });
}

export function buildDefaultBaptismEventWebsiteContent(
  context: EventWebsiteDefaultsContext = {},
): EventWebsiteContent {
  return buildNeutralTargetContent("baptism", context, {
    guestbookTitle: "Prayers & Blessings",
    mainEventLabel: "Christening Ceremony",
    sectionOrder: getDefaultBaptismSectionOrder(),
    storyTitle: "Welcoming Liam into Faith",
    enabled: [
      "host_info",
      "countdown",
      "music_effects",
      "gallery",
      "story_message",
      "main_event",
      "venue",
      "timeline_program",
      "godparents",
      "attire_motif",
      "rsvp_form",
      "gift_details",
      "guestbook",
      "contact_socials",
    ],
  });
}

function buildNeutralTargetContent(
  eventType: Exclude<EventWebsiteContentEventType, "wedding">,
  context: EventWebsiteDefaultsContext,
  options: {
    enabled: EventWebsiteContentSectionKey[];
    guestbookTitle: string;
    mainEventLabel: string;
    sectionOrder?: EventWebsiteContentSectionKey[];
    storyTitle: string;
  },
): EventWebsiteContent {
  const base = buildDefaultWeddingEventWebsiteContent(context);
  const eventDate = normalizeCanonicalDateInput(context.event?.eventDate) || "";
  const eventTime = normalizeCanonicalTimeInput(context.event?.eventTime) || "";
  const rsvpDeadline = formatCanonicalRsvpCloseAtToEditorInput(context.event?.rsvpCloseAt) || "";
  const enabled = Object.fromEntries(
    eventWebsiteContentSectionKeys.map((key) => [key, options.enabled.includes(key)]),
  ) as Record<EventWebsiteContentSectionKey, boolean>;
  const hostInfo =
    eventType === "birthday"
      ? {
          kind: "birthday" as const,
          celebrantName: "",
          milestone: "",
          displayAs: "",
          hostLine: "",
          shortHostMessage: "",
        }
      : eventType === "debut"
        ? {
            kind: "debut" as const,
            debutantName: "",
            milestone: "18th Birthday",
            displayAs: "",
            hostLine: "",
            shortHostMessage: "",
          }
        : {
            kind: "baptism" as const,
            childName: "",
            parentNames: "",
            displayAs: "",
            hostLine: "",
            shortHostMessage: "",
          };

  return {
    ...base,
    eventType,
    layout: {
      enabledSections: enabled,
      sectionOrder: options.sectionOrder ?? [...eventWebsiteContentSectionKeys],
    },
    sections: {
      ...base.sections,
      host_info: hostInfo,
      countdown: {
        title: "Counting down to the celebration",
        shortNote: "We can't wait to celebrate with you.",
      },
      main_event: {
        endTime: "",
        eventDate,
        eventLabel: options.mainEventLabel,
        eventTime,
        rsvpDeadline,
        scheduleNote: "",
      },
      venue: {
        address: normalizeText(context.event?.venueAddress),
        arrivalNote: "",
        mapsLink: "",
        venueName: normalizeText(context.event?.venueName),
      },
      secondary_event: {
        address: "",
        endTime: "",
        mapsLink: "",
        note: "",
        startTime: "",
        title: eventType === "baptism" ? "Reception" : "",
        venueName: "",
      },
      attire_motif:
        eventType === "birthday"
          ? {
              colorMotifNote: "",
              dressCodeNote: "Smart casual or party attire.",
              sectionIntro: "Wear something comfortable and celebratory!",
            }
          : { colorMotifNote: "", dressCodeNote: "", sectionIntro: "" },
      contact_socials: {
        contactNumber: "",
        contactPerson: "",
        email: "",
        facebookUrl: "",
        instagramUrl: "",
        tikTokUrl: "",
      },
      extra_info: { items: [], sectionIntro: "", sectionTitle: "Additional Details" },
      gallery: { sectionIntro: "", sectionTitle: "Gallery" },
      gift_details:
        eventType === "birthday"
          ? {
              giftNote:
                "Your presence is the greatest gift. If you wish to send a monetary gift, details are provided below.",
              options: [
                { id: "gift-option-1", image: null, title: "GCash" },
                { id: "gift-option-2", image: null, title: "Bank Transfer" },
              ],
              sectionIntro: "Your presence is the greatest gift.",
            }
          : {
              giftNote: "",
              options: [],
              sectionIntro: "Your presence is the greatest gift.",
            },
      guestbook: {
        emptyStateMessage: DEFAULT_EVENT_WEBSITE_GUESTBOOK_EMPTY_STATE,
        sectionIntro: "Messages shared by family and friends.",
        sectionTitle: options.guestbookTitle,
      },
      music_effects:
        eventType === "birthday"
          ? {
              musicLink: "",
              musicTitle: "Party Playlist",
              playButtonLabel: "Play party mix",
              shortNote: "Upbeat tracks curated for the birthday celebration.",
            }
          : { musicLink: "", musicTitle: "", playButtonLabel: "", shortNote: "" },
      principal_sponsors: { introLine: "", names: "" },
      story_message:
        eventType === "birthday"
          ? {
              sectionIntro: "",
              storyBody:
                "We are thrilled to celebrate this special milestone together with family and friends.",
              storyTitle: options.storyTitle,
            }
          : { sectionIntro: "", storyBody: "", storyTitle: options.storyTitle },
      timeline_program:
        eventType === "birthday"
          ? {
              items: [
                {
                  description: "Guests arrive and enjoy welcome refreshments.",
                  id: "timeline-guest-arrival",
                  time: "18:00",
                  title: "Guest Arrival & Welcome Drinks",
                },
                {
                  description: "Fun games, presentations, and dinner.",
                  id: "timeline-party-program",
                  time: "19:00",
                  title: "Dinner & Party Program",
                },
                {
                  description: "Birthday toast, cake cutting, and wishes.",
                  id: "timeline-cake-cutting",
                  time: "20:30",
                  title: "Birthday Toast & Cake Cutting",
                },
              ],
            }
          : { items: [] },
      entourage: { groups: [], introLine: "" },
      eighteen_roses_candles: { groups: [] },
      debut_court: { groups: [] },
      godparents: { groups: [] },
    },
  };
}

function buildClientWeddingTitle(clientName?: string | null) {
  const name = normalizeText(clientName);

  if (!name) {
    return "";
  }

  return `${name} Wedding RSVP`;
}

function buildDefaultRsvpDeadline(eventDate: string, offsetDays: number) {
  const [year, month, day] = eventDate.split("-").map(Number);
  const date = new Date(Date.UTC(year ?? 0, (month ?? 1) - 1, day ?? 1));

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  date.setUTCDate(date.getUTCDate() - offsetDays);

  const yyyy = date.getUTCFullYear();
  const mm = `${date.getUTCMonth() + 1}`.padStart(2, "0");
  const dd = `${date.getUTCDate()}`.padStart(2, "0");

  return `${yyyy}-${mm}-${dd}T${DEFAULT_RSVP_DEADLINE_TIME}`;
}

function buildWeddingInvitationMessage(groomName: string, brideName: string) {
  return `Together with their families, ${groomName} and ${brideName} invite you to celebrate their wedding day.`;
}

function deriveWeddingNames(rawValue?: string | null) {
  const normalized = normalizeText(rawValue);

  if (!normalized) {
    return {
      brideName: "Maria",
      displayAs: "Juan & Maria",
      groomName: "Juan",
    };
  }

  const ampersandMatch = normalized
    .split(/\s*&\s*|\s+and\s+/i)
    .map((item) => item.trim())
    .filter(Boolean);

  if (ampersandMatch.length >= 2) {
    return {
      brideName: ampersandMatch[1] ?? "Maria",
      displayAs: normalized,
      groomName: ampersandMatch[0] ?? "Juan",
    };
  }

  return {
    brideName: "Maria",
    displayAs: normalized,
    groomName: ampersandMatch[0] ?? normalized,
  };
}

function extractApplicationLocation(application?: { [key: string]: unknown } | null) {
  if (!application || typeof application !== "object") {
    return "";
  }

  const eventLocation = application.eventLocation;
  return typeof eventLocation === "string" ? normalizeText(eventLocation) : "";
}

function firstNonEmpty(...values: Array<string | null | undefined>) {
  for (const value of values) {
    const normalized = normalizeText(value);

    if (normalized) {
      return normalized;
    }
  }

  return "";
}

function normalizeText(value?: string | null) {
  return typeof value === "string" ? value.trim() : "";
}

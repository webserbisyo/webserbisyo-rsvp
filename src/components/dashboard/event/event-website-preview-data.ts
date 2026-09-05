import type {
  EventWebsiteSectionDefinition,
  EventWebsiteSectionKey,
} from "@/config/event-website-sections";
import { resolveEventWebsiteSectionOrder } from "@/lib/event-website/defaults";
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
  eventType?: string | null;
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

const defaultWeddingPreviewDraft: EventWebsitePreviewDraft = {
  eighteenRosesCandles: { groups: [] },
  debutCourt: { groups: [] },
  godparents: { groups: [] },
  hostInfo: {
    kind: "wedding",
    brideName: "Maria",
    displayAs: "Juan & Maria",
    groomName: "Juan",
    hostLine: "Alexander Morales Wedding RSVP",
    shortHostMessage:
      "Together with their families, Juan and Maria invite you to celebrate their wedding day.",
  },
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
  gallery: {
    sectionIntro: "Photo highlights and visual memories.",
    sectionTitle: "Gallery",
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

export function getPreviewDefaultDraft(eventType?: string | null): EventWebsitePreviewDraft {
  const normalizedType = typeof eventType === "string" ? eventType.toLowerCase() : "wedding";

  if (normalizedType === "debut") {
    return {
      eighteenRosesCandles: {
        groups: [
          {
            entries: [
              { id: "rose-1", message: "First dance with dad", name: "Alexander Morales (Father)" },
              { id: "rose-2", message: "Brother's dance", name: "Mateo Morales (Brother)" },
            ],
            id: "group-roses",
            kind: "roses",
            title: "18 Roses",
          },
          {
            entries: [
              { id: "candle-1", message: "Wishing you joy and grace on your journey", name: "Elena Santos" },
              { id: "candle-2", message: "May all your dreams take flight", name: "Maria Dela Cruz" },
            ],
            id: "group-candles",
            kind: "candles",
            title: "18 Candles",
          },
          {
            entries: [
              { id: "treasure-1", message: "A keepsake to remember this special milestone", name: "Tita Carmen" },
            ],
            id: "group-treasures",
            kind: "treasures",
            title: "18 Treasures",
          },
        ],
      },
      debutCourt: {
        groups: [
          {
            id: "group-escort",
            names: [{ id: "escort-1", name: "Mateo Morales" }],
            title: "Debut Escort",
          },
          {
            id: "group-cotillion",
            names: [
              { id: "court-1", name: "Paolo Santos & Bea Reyes" },
              { id: "court-2", name: "Marco Garcia & Ana Lim" },
            ],
            title: "Cotillion de Honor",
          },
        ],
      },
      godparents: { groups: [] },
      hostInfo: {
        kind: "debut",
        debutantName: "Sofia",
        displayAs: "Sofia's 18th Birthday",
        hostLine: "Sofia Morales Debut RSVP",
        milestone: "18th Birthday",
        shortHostMessage:
          "Together with her family, Sofia invites you to celebrate her 18th birthday celebration.",
      },
      attireDressCode: {
        colorMotifNote: "Please wear shades that complement our debut color palette.",
        dressCodeNote: "Semi-formal or formal attire is encouraged.",
        sectionIntro: "We would love to see you in our celebration motif.",
      },
      ceremony: {
        endTime: "21:00",
        eventDate: "2026-06-06",
        eventLabel: "Debut Celebration",
        eventTime: "16:00",
        rsvpDeadline: "2026-06-01T18:00",
        scheduleNote: "Please arrive at least 15 minutes before the program begins.",
      },
      contactSocials: {
        contactNumber: "+63 917 123 4567",
        contactPerson: "Anna Santos",
        email: "hello@example.com",
        facebookUrl: "https://facebook.com",
        instagramUrl: "https://instagram.com",
        tikTokUrl: "https://tiktok.com",
      },
      countdown: {
        shortNote: "We can't wait to celebrate with you.",
        title: "Counting down to Sofia's 18th Birthday",
      },
      coupleInfo: {
        brideName: "",
        displayAs: "Sofia's Debut",
        groomName: "",
        hostLine: "Sofia Morales Debut RSVP",
        shortHostMessage: "Sofia invites you to celebrate her 18th birthday.",
      },
      entourage: {
        groups: [],
        introLine: "",
      },
      extraInfo: {
        items: [
          {
            details: "Parking is available near the venue entrance.",
            id: "extra-info-parking",
            title: "Parking",
          },
          {
            details: "Program starts promptly at 4:00 PM.",
            id: "extra-info-reminder",
            title: "Prompt Arrival",
          },
        ],
        sectionIntro: "Here are a few helpful notes for our guests.",
        sectionTitle: "Celebration Notes",
      },
      giftDetails: {
        giftNote:
          "Your presence is our greatest joy. If you wish to bless Sofia with a gift, monetary gifts are warmly appreciated.",
        options: [
          { file: null, id: "gift-option-1", image: null, title: "GCash" },
          { file: null, id: "gift-option-2", image: null, title: "Bank Transfer" },
        ],
        sectionIntro: "Your presence is the greatest gift.",
      },
      gallery: {
        sectionIntro: "Photo highlights and visual memories.",
        sectionTitle: "Gallery",
      },
      loveStory: {
        sectionIntro: "A milestone reflection on turning eighteen.",
        storyBody:
          "Eighteen years of love, cherished memories, and beautiful lessons. Thank you to everyone who has been a part of my journey as I step into adulthood.",
        storyTitle: "My Journey to 18",
      },
      guestbook: {
        emptyStateMessage: DEFAULT_EVENT_WEBSITE_GUESTBOOK_EMPTY_STATE,
        sectionIntro: "Leave your warm wishes and blessings for Sofia.",
        sectionTitle: "Debut Wishes",
      },
      musicEffects: {
        musicLink: "",
        musicTitle: "Debut Playlist",
        playButtonLabel: "Play music",
        shortNote: "Music curated for Sofia's special celebration.",
      },
      principalSponsors: {
        introLine: "",
        names: "",
      },
      reception: {
        address: "Talisay City, Negros Occidental, Philippines",
        endTime: "21:00",
        mapsLink: "#",
        note: "Dinner and celebration program.",
        startTime: "18:00",
        title: "Celebration Reception",
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
      venue: {
        address: "Talisay City, Negros Occidental, Philippines",
        arrivalNote: "Please proceed directly to the Grand Ballroom entrance.",
        mapsLink: "#",
        venueName: "The Ruins Garden Hall",
      },
      timelineProgram: {
        items: [
          {
            description: "Guests arrive and are escorted to their tables.",
            id: "timeline-guest-arrival",
            time: "15:00",
            title: "Guest Arrival",
          },
          {
            description: "Welcome the debutant and family.",
            id: "timeline-entrance",
            time: "16:00",
            title: "Grand Entrance",
          },
          {
            description: "18 Roses dance, 18 Candles wishes, and 18 Treasures gifts.",
            id: "timeline-traditions",
            time: "17:00",
            title: "18 Traditions",
          },
          {
            description: "Dinner buffet opens followed by birthday cake and celebrations.",
            id: "timeline-dinner",
            time: "18:30",
            title: "Dinner & Program",
          },
        ],
      },
    };
  }

  if (normalizedType === "birthday") {
    return defaultBirthdayPreviewDraft;
  }

  if (normalizedType === "baptism") {
    return defaultBaptismPreviewDraft;
  }

  return defaultWeddingPreviewDraft;
}

export const defaultBaptismPreviewDraft: EventWebsitePreviewDraft = {
  ...defaultWeddingPreviewDraft,
  hostInfo: {
    kind: "baptism",
    childName: "Liam",
    displayAs: "Liam's Christening",
    hostLine: "Liam Santos Holy Baptism",
    parentNames: "Juan & Maria Santos",
    shortHostMessage:
      "With joyful hearts, Juan and Maria invite you to witness and celebrate the Holy Baptism of their beloved child, Liam.",
  },
  attireDressCode: {
    colorMotifNote: "All-white, pastels, or soft cream colors.",
    dressCodeNote: "Modest church attire / Sunday best.",
    sectionIntro: "We request guests to wear light and modest attire for the church ceremony.",
  },
  ceremony: {
    endTime: "11:30",
    eventDate: "2026-08-15",
    eventLabel: "Christening Ceremony",
    eventTime: "10:00",
    rsvpDeadline: "2026-08-01T18:00",
    scheduleNote: "Please arrive at the church 15 minutes before the baptismal rites begin.",
  },
  contactSocials: {
    contactNumber: "+63 917 123 4567",
    contactPerson: "Juan Santos (Father)",
    email: "juan.santos@example.com",
    facebookUrl: "https://facebook.com",
    instagramUrl: "https://instagram.com",
    tikTokUrl: "",
  },
  countdown: {
    shortNote: "We look forward to welcoming Liam into the Christian faith.",
    title: "Counting down to Liam's Christening",
  },
  coupleInfo: {
    brideName: "",
    displayAs: "Liam's Christening",
    groomName: "",
    hostLine: "Liam Santos Holy Baptism",
    shortHostMessage: "Witness the Holy Baptism of Liam Santos.",
  },
  debutCourt: { groups: [] },
  eighteenRosesCandles: { groups: [] },
  entourage: { groups: [], introLine: "" },
  extraInfo: {
    items: [
      {
        details: "Designated parking is available beside the church plaza.",
        id: "extra-info-1",
        title: "Church Parking",
      },
      {
        details: "Lunch banquet will follow immediately at the reception venue.",
        id: "extra-info-2",
        title: "Reception Banquet",
      },
    ],
    sectionIntro: "Helpful reminders for our guests and godparents.",
    sectionTitle: "Ceremony & Reception Notes",
  },
  giftDetails: {
    giftNote:
      "Your presence and prayers are our greatest blessings. If you wish to give a gift, monetary gifts for Liam's future are warmly appreciated.",
    options: [
      { file: null, id: "gift-option-1", image: null, title: "GCash" },
      { file: null, id: "gift-option-2", image: null, title: "Bank Transfer" },
    ],
    sectionIntro: "Your prayers and blessings are our greatest gift.",
  },
  godparents: {
    groups: [
      {
        id: "group-ninongs",
        names: [
          { id: "ninong-1", name: "Alexander Morales" },
          { id: "ninong-2", name: "Mateo Garcia" },
          { id: "ninong-3", name: "Roberto Reyes" },
        ],
        title: "Ninongs (Godfathers)",
      },
      {
        id: "group-ninangs",
        names: [
          { id: "ninang-1", name: "Elena Santos" },
          { id: "ninang-2", name: "Maria Dela Cruz" },
          { id: "ninang-3", name: "Carmen Lim" },
        ],
        title: "Ninangs (Godmothers)",
      },
    ],
  },
  guestbook: {
    emptyStateMessage: "Be the first to leave a prayer or blessing for Liam.",
    sectionIntro: "Leave your warm blessings and prayers for Liam.",
    sectionTitle: "Prayers & Blessings",
  },
  loveStory: {
    sectionIntro: "A prayer and thanksgiving from Liam's parents.",
    storyBody:
      "A precious blessing from God, Liam has brought immense joy and love into our lives. We dedicate his life to the Lord and pray for his continuous guidance, health, and grace.",
    storyTitle: "Welcoming Liam into Faith",
  },
  musicEffects: {
    musicLink: "",
    musicTitle: "Baptismal Hymns & Songs",
    playButtonLabel: "Play music",
    shortNote: "Gentle instrumental hymns curated for this holy milestone.",
  },
  principalSponsors: { introLine: "", names: "" },
  reception: {
    address: "Intramuros, Manila, Metro Manila",
    endTime: "15:00",
    mapsLink: "#",
    note: "Lunch banquet and fellowship following the church ceremony.",
    startTime: "12:00",
    title: "Reception Banquet",
    venueName: "La Cocina de San Agustin",
  },
  rsvpForm: {
    companionAgeEnabled: false,
    companionLimit: "2",
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
        description: "Guests and godparents assemble at the church.",
        id: "timeline-1",
        time: "09:45",
        title: "Assembly & Welcome",
      },
      {
        description: "The official sacrament of Holy Baptism.",
        id: "timeline-2",
        time: "10:00",
        title: "Baptismal Ceremony",
      },
      {
        description: "Commemorative photos with family and godparents.",
        id: "timeline-3",
        time: "11:00",
        title: "Blessings & Photo Session",
      },
      {
        description: "Celebration banquet, lunch, and fellowship.",
        id: "timeline-4",
        time: "12:00",
        title: "Reception & Fellowship",
      },
    ],
  },
  venue: {
    address: "General Luna St, Intramuros, Manila, Metro Manila",
    arrivalNote: "Please proceed to the main baptismal font area.",
    mapsLink: "#",
    venueName: "San Agustin Church, Intramuros",
  },
};

export const defaultBirthdayPreviewDraft: EventWebsitePreviewDraft = {
  ...defaultWeddingPreviewDraft,
  hostInfo: {
    kind: "birthday",
    celebrantName: "Marco",
    milestone: "30th Birthday",
    displayAs: "Marco's 30th Birthday",
    hostLine: "Marco Santos Birthday RSVP",
    shortHostMessage:
      "Join us as we celebrate Marco's 30th birthday milestone with good food, drinks, and great company.",
  },
  attireDressCode: {
    colorMotifNote: "Casual chic / celebratory colors.",
    dressCodeNote: "Smart casual or party attire.",
    sectionIntro: "Wear something comfortable and celebratory!",
  },
  ceremony: {
    endTime: "23:00",
    eventDate: "2026-07-18",
    eventLabel: "Birthday Celebration",
    eventTime: "18:00",
    rsvpDeadline: "2026-07-10T18:00",
    scheduleNote: "Please arrive promptly for welcome drinks and mingling.",
  },
  contactSocials: {
    contactNumber: "+63 917 123 4567",
    contactPerson: "Marco Santos",
    email: "marco@example.com",
    facebookUrl: "https://facebook.com",
    instagramUrl: "https://instagram.com",
    tikTokUrl: "",
  },
  countdown: {
    shortNote: "Can't wait to celebrate together!",
    title: "Counting down to Marco's 30th Birthday",
  },
  coupleInfo: {
    brideName: "",
    displayAs: "Marco's 30th Birthday",
    groomName: "",
    hostLine: "Marco Santos Birthday RSVP",
    shortHostMessage: "Marco invites you to celebrate his 30th birthday.",
  },
  debutCourt: { groups: [] },
  eighteenRosesCandles: { groups: [] },
  entourage: { groups: [], introLine: "" },
  extraInfo: {
    items: [
      {
        details: "Valet and free self-parking available on-site.",
        id: "extra-info-1",
        title: "Parking & Access",
      },
      {
        details: "Drinks and appetizers will be served upon arrival.",
        id: "extra-info-2",
        title: "Welcome Drinks",
      },
    ],
    sectionIntro: "A few helpful notes for our party guests.",
    sectionTitle: "Celebration Notes",
  },
  giftDetails: {
    giftNote:
      "Your presence and celebration with Marco are the greatest gifts. If you wish to send a monetary gift, details are provided below.",
    options: [
      { file: null, id: "gift-option-1", image: null, title: "GCash" },
      { file: null, id: "gift-option-2", image: null, title: "Bank Transfer" },
    ],
    sectionIntro: "Your presence is our greatest joy.",
  },
  godparents: { groups: [] },
  guestbook: {
    emptyStateMessage: "Be the first to leave a birthday message for Marco.",
    sectionIntro: "Leave your warm wishes and birthday messages for Marco.",
    sectionTitle: "Birthday Wishes",
  },
  loveStory: {
    sectionIntro: "A little milestone reflection about this celebration.",
    storyBody:
      "Thirty years of cherished moments, laughter, and growth. Grateful to celebrate this special milestone with family and friends.",
    storyTitle: "A Journey to 30",
  },
  musicEffects: {
    musicLink: "",
    musicTitle: "Party Playlist",
    playButtonLabel: "Play party mix",
    shortNote: "Upbeat tracks curated for Marco's birthday celebration.",
  },
  principalSponsors: {
    introLine: "We are blessed with the guidance and love of our honored sponsors and mentors.",
    names: "Ninong Alexander Morales\nNinang Elena Santos\nTito Roberto Reyes",
  },
  reception: {
    address: "Bonifacio Global City, Taguig City, Metro Manila",
    endTime: "23:00",
    mapsLink: "#",
    note: "Drinks, social hours, and celebration to continue after dinner.",
    startTime: "20:00",
    title: "After-Party & Socials",
    venueName: "The Penthouse Lounge",
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
        description: "Grab a welcome drink and mingle.",
        id: "timeline-1",
        time: "18:00",
        title: "Guest Arrival & Drinks",
      },
      {
        description: "Enjoy a hearty buffet and drinks with friends.",
        id: "timeline-2",
        time: "19:00",
        title: "Dinner Buffet Opens",
      },
      {
        description: "Blow out the candles and cheers to 30!",
        id: "timeline-3",
        time: "20:30",
        title: "Birthday Toast & Cake Cutting",
      },
      {
        description: "Music, games, and celebration into the night.",
        id: "timeline-4",
        time: "21:00",
        title: "Party & Socials",
      },
    ],
  },
  venue: {
    address: "Bonifacio Global City, Taguig City, Metro Manila",
    arrivalNote: "Please proceed directly to the 7th floor lounge.",
    mapsLink: "#",
    venueName: "The Penthouse Lounge",
  },
};

export const previewDefaultDraft: EventWebsitePreviewDraft = getPreviewDefaultDraft("wedding");

export function buildInitialPreviewDraft(
  eventData: EventWebsitePreviewEventData,
): EventWebsitePreviewDraft {
  if (eventData.eventWebsiteContent) {
    return buildEventWebsiteRenderModel(eventData.eventWebsiteContent);
  }

  const baseDraft = getPreviewDefaultDraft(eventData.eventType);

  return {
    ...baseDraft,
    attireDressCode: { ...baseDraft.attireDressCode },
    ceremony: {
      ...baseDraft.ceremony,
      eventDate: eventData.eventDate || baseDraft.ceremony.eventDate,
      eventTime: formatInputTime(eventData.eventTime) || baseDraft.ceremony.eventTime,
      rsvpDeadline:
        formatDateTimeLocal(eventData.rsvpCloseAt) || baseDraft.ceremony.rsvpDeadline,
      scheduleNote:
        eventData.eventContent?.scheduleNote || baseDraft.ceremony.scheduleNote,
    },
    contactSocials: { ...baseDraft.contactSocials },
    countdown: { ...baseDraft.countdown },
    coupleInfo: {
      ...baseDraft.coupleInfo,
      hostLine: eventData.eventContent?.heroTitle || baseDraft.coupleInfo.hostLine,
      shortHostMessage:
        eventData.eventContent?.heroSubtitle || baseDraft.coupleInfo.shortHostMessage,
    },
    entourage: {
      ...baseDraft.entourage,
      groups: baseDraft.entourage.groups.map((group) => ({ ...group })),
    },
    extraInfo: {
      ...baseDraft.extraInfo,
      items: baseDraft.extraInfo.items.map((item) => ({ ...item })),
    },
    giftDetails: {
      ...baseDraft.giftDetails,
      options: baseDraft.giftDetails.options.map((option) => ({ ...option })),
    },
    gallery: { ...baseDraft.gallery },
    loveStory: { ...baseDraft.loveStory },
    guestbook: { ...baseDraft.guestbook },
    musicEffects: { ...baseDraft.musicEffects },
    principalSponsors: { ...baseDraft.principalSponsors },
    reception: {
      ...baseDraft.reception,
      address: eventData.venueAddress || baseDraft.reception.address,
    },
    rsvpForm: {
      ...baseDraft.rsvpForm,
      plusOneEnabled: Boolean(eventData.maxGuestCount),
    },
    timelineProgram: {
      items: baseDraft.timelineProgram.items.map((item) => ({ ...item })),
    },
    venue: {
      ...baseDraft.venue,
      address: eventData.venueAddress || baseDraft.venue.address,
      arrivalNote: eventData.eventContent?.venueNote || baseDraft.venue.arrivalNote,
      venueName: eventData.venueName || baseDraft.venue.venueName,
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
  const resolvedSectionOrder = resolveEventWebsiteSectionOrder({
    eventType: savedContent.eventType,
    storedSectionOrder: mapSectionOrder(sectionOrder),
  });

  return {
    ...savedContent,
    layout: {
      enabledSections: {
        ...savedContent.layout.enabledSections,
        ...pickSavedSectionEnabledState(enabledSections),
      },
      sectionOrder: resolvedSectionOrder,
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
        sectionIntro: previewDraft.gallery?.sectionIntro ?? "",
        sectionTitle: previewDraft.gallery?.sectionTitle ?? "",
      },
      gift_details: {
        giftNote: previewDraft.giftDetails.giftNote,
        options: previewDraft.giftDetails.options.map((option, index) => ({
          id:
            option.id ||
            savedContent.sections.gift_details.options[index]?.id ||
            createEventWebsiteDraftItemId("gift-option"),
          image:
            option.image !== undefined
              ? option.image
              : (savedContent.sections.gift_details.options.find(
                  (savedOption) => savedOption.id === option.id,
                )?.image ??
                savedContent.sections.gift_details.options[index]?.image ??
                null),
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
        ...previewDraft.hostInfo,
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
      eighteen_roses_candles: previewDraft.eighteenRosesCandles,
      debut_court: previewDraft.debutCourt,
      godparents: previewDraft.godparents,
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

import type { EventWebsiteSectionKey } from "@/config/event-website-sections";
import {
  buildManilaOffsetDateTime,
  formatManilaLocalDateTimeInputToIso,
  normalizeCanonicalDateInput,
  normalizeCanonicalText,
  normalizeCanonicalTimeInput,
} from "@/lib/event-website/canonical";
import {
  eventWebsiteContentSectionKeys,
  type EventWebsiteContent,
  type EventWebsiteContentSectionKey,
} from "@/lib/event-website/types";

const requiredSectionKeys = new Set<EventWebsiteContentSectionKey>([
  "host_info",
  "main_event",
  "venue",
  "rsvp_form",
]);

const choiceQuestionFieldTypes = new Set(["Single choice", "Multiple choice"]);

const sampleHostNames = new Set(["Juan", "Maria", "Juan & Maria"]);
const sampleCanonicalVenueNames = new Set(["The Ruins, Bacolod"]);
const sampleOptionalVenueNames = new Set(["The Ruins Garden Hall"]);
const sampleContactPeople = new Set(["Anna Santos"]);
const sampleEmails = new Set(["hello@example.com"]);
const sampleSocialTokens = ["juanandmaria"];

const defaultCountdownTitle = "Counting down to our special day";
const defaultCountdownShortNote = "We can't wait to celebrate with you.";
const defaultHostMessageTemplate =
  "Together with their families, %GROOM% and %BRIDE% invite you to celebrate their wedding day.";
const defaultScheduleNote = "Please arrive at least 15 minutes before the ceremony starts.";
const defaultArrivalNote =
  "Parking is available near the entrance. Please follow the event signage upon arrival.";
const defaultMusicTitle = "Our Wedding Song";
const defaultMusicButtonLabel = "Play our song";
const defaultMusicShortNote = "A song that reminds us of our journey together.";
const defaultReceptionTitle = "Wedding Reception";
const defaultReceptionNote = "Dinner and program will follow after the ceremony.";
const defaultStoryIntro = "A little story about how our journey began.";
const defaultStoryTitle = "Our Story";
const defaultStoryBody =
  "From the first hello to this special day, our journey has been filled with simple moments, answered prayers, and love that continued to grow. We are grateful to celebrate this chapter with the people who matter most to us.";
const defaultGuestbookTitle = "A Note from Us";
const defaultGuestbookMessage =
  "Your presence means the world to us. Thank you for celebrating this special day with us.";
const defaultGiftIntro = "Your presence is the greatest gift.";
const defaultGiftNote =
  "If you wish to give a gift, a monetary gift would be greatly appreciated as we begin this new chapter together.";
const defaultAttireIntro = "We would love to see you in our wedding motif.";
const defaultAttireDressCode = "Formal or semi-formal attire is encouraged.";
const defaultAttireMotif = "Please wear shades that complement our wedding colors.";
const defaultExtraInfoTitle = "Additional Details";
const defaultExtraInfoIntro = "Here are a few helpful notes for our guests.";
const defaultExtraInfoItems = [
  { title: "Parking", details: "Parking is available near the venue entrance." },
  { title: "Reminder", details: "Please arrive at least 30 minutes before the ceremony." },
];
const defaultSponsorsIntro =
  "We are grateful for the love and guidance of our principal sponsors.";
const defaultSponsorsNames =
  "Mr. Juan Dela Cruz\nMrs. Maria Dela Cruz\nMr. Pedro Santos\nMrs. Ana Santos\nMr. Roberto Reyes\nMrs. Elena Reyes";
const defaultEntourageIntro =
  "Meet the family and friends standing with us on our wedding day.";
const defaultEntourageGroups = [
  { groupTitle: "Maid of Honor", names: "Maria Santos" },
  { groupTitle: "Best Man", names: "Juan Dela Cruz" },
  { groupTitle: "Bridesmaids", names: "Ana Cruz, Bella Reyes, Carla Lim" },
  { groupTitle: "Groomsmen", names: "Marco Reyes, Paolo Santos, Luis Garcia" },
];
const defaultTimelineItems = [
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
];

export type EventWebsiteReadinessLevel = "blocker" | "warning";

export type EventWebsiteReadinessIssue = {
  description?: string;
  id: string;
  level: EventWebsiteReadinessLevel;
  sectionKey: EventWebsiteSectionKey;
  title: string;
};

export type EventWebsiteReadinessSectionStatus = {
  blockerCount: number;
  included: boolean;
  ready: boolean;
  warningCount: number;
};

export type EventWebsiteReadinessResult = {
  activeSectionCount: number;
  blockerCount: number;
  blockers: EventWebsiteReadinessIssue[];
  isReady: boolean;
  issuesBySection: Record<EventWebsiteContentSectionKey, EventWebsiteReadinessIssue[]>;
  progressPercent: number;
  readySectionCount: number;
  sectionStatus: Record<EventWebsiteContentSectionKey, EventWebsiteReadinessSectionStatus>;
  state: "not_ready" | "ready" | "ready_with_warnings";
  totalSectionCount: number;
  warningCount: number;
  warnings: EventWebsiteReadinessIssue[];
};

export type EventWebsiteReadinessOptions = {
  enabledSections?: Partial<Record<EventWebsiteContentSectionKey, boolean>>;
};

export function evaluateEventWebsiteReadiness(
  content: EventWebsiteContent,
  options: EventWebsiteReadinessOptions = {},
): EventWebsiteReadinessResult {
  const issuesBySection = buildEmptySectionIssues();
  const enabledSections = {
    ...content.layout.enabledSections,
    ...(options.enabledSections ?? {}),
  };

  evaluateHostInfo(content, issuesBySection);
  evaluateMainEvent(content, issuesBySection);
  evaluateVenue(content, issuesBySection);
  evaluateRsvpForm(content, issuesBySection);

  if (enabledSections.countdown) {
    evaluateCountdown(content, issuesBySection);
  }
  if (enabledSections.music_effects) {
    evaluateMusicEffects(content, issuesBySection);
  }
  if (enabledSections.secondary_event) {
    evaluateSecondaryEvent(content, issuesBySection);
  }
  if (enabledSections.timeline_program) {
    evaluateTimelineProgram(content, issuesBySection);
  }
  if (enabledSections.entourage) {
    evaluateEntourage(content, issuesBySection);
  }
  if (enabledSections.principal_sponsors) {
    evaluatePrincipalSponsors(content, issuesBySection);
  }
  if (enabledSections.attire_motif) {
    evaluateAttireMotif(content, issuesBySection);
  }
  if (enabledSections.extra_info) {
    evaluateExtraInfo(content, issuesBySection);
  }
  if (enabledSections.gift_details) {
    evaluateGiftDetails(content, issuesBySection);
  }
  if (enabledSections.guestbook) {
    evaluateGuestbook(content, issuesBySection);
  }
  if (enabledSections.story_message) {
    evaluateStoryMessage(content, issuesBySection);
  }
  if (enabledSections.contact_socials) {
    evaluateContactSocials(content, issuesBySection);
  }

  const blockers: EventWebsiteReadinessIssue[] = [];
  const warnings: EventWebsiteReadinessIssue[] = [];
  const sectionStatus = {} as Record<
    EventWebsiteContentSectionKey,
    EventWebsiteReadinessSectionStatus
  >;
  let totalSectionCount = 0;
  let readySectionCount = 0;

  for (const sectionKey of eventWebsiteContentSectionKeys) {
    const issues = issuesBySection[sectionKey];
    const included = requiredSectionKeys.has(sectionKey) || Boolean(enabledSections[sectionKey]);
    const blockerCount = issues.filter((issue) => issue.level === "blocker").length;
    const warningCount = issues.filter((issue) => issue.level === "warning").length;
    const ready = included && blockerCount === 0;

    if (included) {
      totalSectionCount += 1;
      if (ready) {
        readySectionCount += 1;
      }
      blockers.push(...issues.filter((issue) => issue.level === "blocker"));
      warnings.push(...issues.filter((issue) => issue.level === "warning"));
    }

    sectionStatus[sectionKey] = {
      blockerCount,
      included,
      ready,
      warningCount,
    };
  }

  const blockerCount = blockers.length;
  const warningCount = warnings.length;

  return {
    activeSectionCount: totalSectionCount,
    blockerCount,
    blockers,
    isReady: blockerCount === 0,
    issuesBySection,
    progressPercent:
      totalSectionCount > 0 ? Math.round((readySectionCount / totalSectionCount) * 100) : 0,
    readySectionCount,
    sectionStatus,
    state:
      blockerCount > 0 ? "not_ready" : warningCount > 0 ? "ready_with_warnings" : "ready",
    totalSectionCount,
    warningCount,
    warnings,
  };
}

function evaluateHostInfo(
  content: EventWebsiteContent,
  issuesBySection: Record<EventWebsiteContentSectionKey, EventWebsiteReadinessIssue[]>,
) {
  const section = content.sections.host_info;
  const groomName = normalizeText(section.groomName);
  const brideName = normalizeText(section.brideName);
  const displayAs = normalizeText(section.displayAs);

  if (!groomName) {
    addIssue(issuesBySection, {
      id: "host-info-groom-name",
      level: "blocker",
      sectionKey: "host_info",
      title: "Add the groom's name.",
    });
  }

  if (!brideName) {
    addIssue(issuesBySection, {
      id: "host-info-bride-name",
      level: "blocker",
      sectionKey: "host_info",
      title: "Add the bride's name.",
    });
  }

  if (!displayAs) {
    addIssue(issuesBySection, {
      id: "host-info-display-as",
      level: "blocker",
      sectionKey: "host_info",
      title: "Add the main couple display name.",
    });
  }

  if (
    sampleHostNames.has(groomName) ||
    sampleHostNames.has(brideName) ||
    sampleHostNames.has(displayAs)
  ) {
    addIssue(issuesBySection, {
      id: "host-info-sample-names",
      level: "blocker",
      sectionKey: "host_info",
      title: "Replace the sample couple names.",
      description: "Publish readiness requires real couple names instead of Juan and Maria placeholders.",
    });
  }

  if (isDefaultHostMessage(section.shortHostMessage, groomName, brideName)) {
    addIssue(issuesBySection, {
      id: "host-info-default-message",
      level: "warning",
      sectionKey: "host_info",
      title: "Review the host message.",
      description: "The invitation copy still matches the default wedding message.",
    });
  }
}

function evaluateMainEvent(
  content: EventWebsiteContent,
  issuesBySection: Record<EventWebsiteContentSectionKey, EventWebsiteReadinessIssue[]>,
) {
  const section = content.sections.main_event;
  const eventDate = normalizeCanonicalDateInput(section.eventDate);
  const eventTime = normalizeCanonicalTimeInput(section.eventTime);
  const rsvpDeadline = formatManilaLocalDateTimeInputToIso(section.rsvpDeadline);

  if (!eventDate) {
    addIssue(issuesBySection, {
      id: "main-event-date",
      level: "blocker",
      sectionKey: "main_event",
      title: "Add the ceremony date.",
    });
  }

  if (!eventTime) {
    addIssue(issuesBySection, {
      id: "main-event-time",
      level: "blocker",
      sectionKey: "main_event",
      title: "Add the ceremony start time.",
    });
  }

  if (!rsvpDeadline) {
    addIssue(issuesBySection, {
      id: "main-event-rsvp-deadline",
      level: "blocker",
      sectionKey: "main_event",
      title: "Add a valid RSVP deadline.",
    });
  }

  if (eventDate && eventTime && rsvpDeadline) {
    const ceremonyStart = buildManilaOffsetDateTime(eventDate, eventTime);

    if (ceremonyStart) {
      const rsvpDeadlineTimestamp = new Date(rsvpDeadline).getTime();
      const ceremonyStartTimestamp = new Date(ceremonyStart).getTime();

      if (
        !Number.isNaN(rsvpDeadlineTimestamp) &&
        !Number.isNaN(ceremonyStartTimestamp) &&
        rsvpDeadlineTimestamp > ceremonyStartTimestamp
      ) {
        addIssue(issuesBySection, {
          id: "main-event-rsvp-after-ceremony",
          level: "blocker",
          sectionKey: "main_event",
          title: "Move the RSVP deadline before the ceremony starts.",
        });
      }
    }
  }

  if (normalizeText(section.scheduleNote) === defaultScheduleNote) {
    addIssue(issuesBySection, {
      id: "main-event-default-schedule-note",
      level: "warning",
      sectionKey: "main_event",
      title: "Review the ceremony note.",
      description: "The ceremony note still matches the default sample copy.",
    });
  }
}

function evaluateVenue(
  content: EventWebsiteContent,
  issuesBySection: Record<EventWebsiteContentSectionKey, EventWebsiteReadinessIssue[]>,
) {
  const section = content.sections.venue;
  const venueName = normalizeCanonicalText(section.venueName);
  const address = normalizeCanonicalText(section.address);

  if (!venueName) {
    addIssue(issuesBySection, {
      id: "venue-name",
      level: "blocker",
      sectionKey: "venue",
      title: "Add the venue name.",
    });
  }

  if (!address) {
    addIssue(issuesBySection, {
      id: "venue-address",
      level: "blocker",
      sectionKey: "venue",
      title: "Add the venue address.",
    });
  }

  if (venueName && sampleCanonicalVenueNames.has(venueName)) {
    addIssue(issuesBySection, {
      id: "venue-sample-name",
      level: "blocker",
      sectionKey: "venue",
      title: "Replace the sample venue name.",
    });
  }

  if (!normalizeText(section.mapsLink)) {
    addIssue(issuesBySection, {
      id: "venue-maps-link",
      level: "warning",
      sectionKey: "venue",
      title: "Add a venue map link.",
    });
  }

  if (normalizeText(section.arrivalNote) === defaultArrivalNote) {
    addIssue(issuesBySection, {
      id: "venue-default-arrival-note",
      level: "warning",
      sectionKey: "venue",
      title: "Review the venue arrival note.",
      description: "The arrival note still matches the default sample copy.",
    });
  }
}

function evaluateRsvpForm(
  content: EventWebsiteContent,
  issuesBySection: Record<EventWebsiteContentSectionKey, EventWebsiteReadinessIssue[]>,
) {
  const section = content.sections.rsvp_form;

  if (
    section.plusOneEnabled &&
    (!Number.isInteger(section.companionLimit) ||
      section.companionLimit < 1 ||
      section.companionLimit > 10)
  ) {
    addIssue(issuesBySection, {
      id: "rsvp-form-companion-limit",
      level: "blocker",
      sectionKey: "rsvp_form",
      title: "Set a valid companion limit when companions are enabled.",
    });
  }

  const invalidCustomQuestion = section.customQuestions.find(
    (question) =>
      choiceQuestionFieldTypes.has(question.fieldType) &&
      question.options.map(normalizeText).filter(Boolean).length === 0,
  );

  if (invalidCustomQuestion) {
    addIssue(issuesBySection, {
      id: `rsvp-form-custom-question-${invalidCustomQuestion.id}`,
      level: "blocker",
      sectionKey: "rsvp_form",
      title: "Add options to every choice-based custom RSVP question.",
    });
  }
}

function evaluateCountdown(
  content: EventWebsiteContent,
  issuesBySection: Record<EventWebsiteContentSectionKey, EventWebsiteReadinessIssue[]>,
) {
  const section = content.sections.countdown;

  if (
    normalizeText(section.title) === defaultCountdownTitle ||
    normalizeText(section.shortNote) === defaultCountdownShortNote
  ) {
    addIssue(issuesBySection, {
      id: "countdown-default-copy",
      level: "warning",
      sectionKey: "countdown",
      title: "Review the countdown copy.",
    });
  }
}

function evaluateMusicEffects(
  content: EventWebsiteContent,
  issuesBySection: Record<EventWebsiteContentSectionKey, EventWebsiteReadinessIssue[]>,
) {
  const section = content.sections.music_effects;
  const musicTitle = normalizeText(section.musicTitle);
  const musicLink = normalizeText(section.musicLink);

  if ((musicTitle && !musicLink) || (!musicTitle && musicLink)) {
    addIssue(issuesBySection, {
      id: "music-effects-link-mismatch",
      level: "warning",
      sectionKey: "music_effects",
      title: "Complete the music title and link together.",
    });
    return;
  }

  if (
    musicTitle === defaultMusicTitle ||
    normalizeText(section.playButtonLabel) === defaultMusicButtonLabel ||
    normalizeText(section.shortNote) === defaultMusicShortNote
  ) {
    addIssue(issuesBySection, {
      id: "music-effects-default-copy",
      level: "warning",
      sectionKey: "music_effects",
      title: "Review the music section copy.",
    });
  }
}

function evaluateSecondaryEvent(
  content: EventWebsiteContent,
  issuesBySection: Record<EventWebsiteContentSectionKey, EventWebsiteReadinessIssue[]>,
) {
  const section = content.sections.secondary_event;

  if (
    !normalizeText(section.title) ||
    !normalizeText(section.startTime) ||
    !normalizeText(section.venueName)
  ) {
    addIssue(issuesBySection, {
      id: "secondary-event-missing-fields",
      level: "warning",
      sectionKey: "secondary_event",
      title: "Complete the reception title, start time, and venue details.",
    });
    return;
  }

  if (
    sampleCanonicalVenueNames.has(normalizeText(section.venueName)) ||
    sampleOptionalVenueNames.has(normalizeText(section.venueName)) ||
    normalizeText(section.title) === defaultReceptionTitle ||
    normalizeText(section.note) === defaultReceptionNote
  ) {
    addIssue(issuesBySection, {
      id: "secondary-event-default-copy",
      level: "warning",
      sectionKey: "secondary_event",
      title: "Review the reception details.",
    });
  }
}

function evaluateTimelineProgram(
  content: EventWebsiteContent,
  issuesBySection: Record<EventWebsiteContentSectionKey, EventWebsiteReadinessIssue[]>,
) {
  const items = content.sections.timeline_program.items;

  if (items.length === 0 || isDefaultTimeline(items)) {
    addIssue(issuesBySection, {
      id: "timeline-default-program",
      level: "warning",
      sectionKey: "timeline_program",
      title: "Review the timeline or replace the sample program items.",
    });
  }
}

function evaluateEntourage(
  content: EventWebsiteContent,
  issuesBySection: Record<EventWebsiteContentSectionKey, EventWebsiteReadinessIssue[]>,
) {
  const section = content.sections.entourage;

  if (section.groups.length === 0 || isDefaultEntourage(section.groups, section.introLine)) {
    addIssue(issuesBySection, {
      id: "entourage-default-groups",
      level: "warning",
      sectionKey: "entourage",
      title: "Review the entourage list and replace sample names.",
    });
  }
}

function evaluatePrincipalSponsors(
  content: EventWebsiteContent,
  issuesBySection: Record<EventWebsiteContentSectionKey, EventWebsiteReadinessIssue[]>,
) {
  const section = content.sections.principal_sponsors;

  if (
    normalizeText(section.introLine) === defaultSponsorsIntro ||
    normalizeMultiline(section.names) === normalizeMultiline(defaultSponsorsNames)
  ) {
    addIssue(issuesBySection, {
      id: "principal-sponsors-default-copy",
      level: "warning",
      sectionKey: "principal_sponsors",
      title: "Review the principal sponsors section.",
    });
  }
}

function evaluateAttireMotif(
  content: EventWebsiteContent,
  issuesBySection: Record<EventWebsiteContentSectionKey, EventWebsiteReadinessIssue[]>,
) {
  const section = content.sections.attire_motif;

  if (
    normalizeText(section.sectionIntro) === defaultAttireIntro ||
    normalizeText(section.dressCodeNote) === defaultAttireDressCode ||
    normalizeText(section.colorMotifNote) === defaultAttireMotif
  ) {
    addIssue(issuesBySection, {
      id: "attire-default-copy",
      level: "warning",
      sectionKey: "attire_motif",
      title: "Review the attire and motif section.",
    });
  }
}

function evaluateExtraInfo(
  content: EventWebsiteContent,
  issuesBySection: Record<EventWebsiteContentSectionKey, EventWebsiteReadinessIssue[]>,
) {
  const section = content.sections.extra_info;

  if (section.items.length === 0 || isDefaultExtraInfo(section)) {
    addIssue(issuesBySection, {
      id: "extra-info-default-copy",
      level: "warning",
      sectionKey: "extra_info",
      title: "Review the extra guest notes.",
    });
  }
}

function evaluateGiftDetails(
  content: EventWebsiteContent,
  issuesBySection: Record<EventWebsiteContentSectionKey, EventWebsiteReadinessIssue[]>,
) {
  const section = content.sections.gift_details;
  const optionTitles = section.options.map((option) => normalizeText(option.title)).filter(Boolean);

  if (
    optionTitles.length === 0 ||
    isSameStringArray(optionTitles, ["GCash", "Bank Transfer"]) ||
    normalizeText(section.sectionIntro) === defaultGiftIntro ||
    normalizeText(section.giftNote) === defaultGiftNote
  ) {
    addIssue(issuesBySection, {
      id: "gift-details-default-copy",
      level: "warning",
      sectionKey: "gift_details",
      title: "Review the gift details section.",
    });
  }
}

function evaluateGuestbook(
  content: EventWebsiteContent,
  issuesBySection: Record<EventWebsiteContentSectionKey, EventWebsiteReadinessIssue[]>,
) {
  const section = content.sections.guestbook;

  if (
    normalizeText(section.sectionTitle) === defaultGuestbookTitle ||
    normalizeText(section.messageBody) === defaultGuestbookMessage
  ) {
    addIssue(issuesBySection, {
      id: "guestbook-default-copy",
      level: "warning",
      sectionKey: "guestbook",
      title: "Review the messages section.",
    });
  }
}

function evaluateStoryMessage(
  content: EventWebsiteContent,
  issuesBySection: Record<EventWebsiteContentSectionKey, EventWebsiteReadinessIssue[]>,
) {
  const section = content.sections.story_message;

  if (
    normalizeText(section.sectionIntro) === defaultStoryIntro ||
    normalizeText(section.storyTitle) === defaultStoryTitle ||
    normalizeText(section.storyBody) === defaultStoryBody
  ) {
    addIssue(issuesBySection, {
      id: "story-message-default-copy",
      level: "warning",
      sectionKey: "story_message",
      title: "Review the love story section.",
    });
  }
}

function evaluateContactSocials(
  content: EventWebsiteContent,
  issuesBySection: Record<EventWebsiteContentSectionKey, EventWebsiteReadinessIssue[]>,
) {
  const section = content.sections.contact_socials;
  const hasSampleUrl =
    sampleSocialTokens.some((token) => normalizeText(section.facebookUrl).includes(token)) ||
    sampleSocialTokens.some((token) => normalizeText(section.instagramUrl).includes(token)) ||
    sampleSocialTokens.some((token) => normalizeText(section.tikTokUrl).includes(token));

  if (
    sampleContactPeople.has(normalizeText(section.contactPerson)) ||
    sampleEmails.has(normalizeText(section.email)) ||
    hasSampleUrl
  ) {
    addIssue(issuesBySection, {
      id: "contact-socials-default-copy",
      level: "warning",
      sectionKey: "contact_socials",
      title: "Replace the sample contact or social details.",
    });
  }
}

function buildEmptySectionIssues() {
  const issuesBySection = {} as Record<EventWebsiteContentSectionKey, EventWebsiteReadinessIssue[]>;

  for (const sectionKey of eventWebsiteContentSectionKeys) {
    issuesBySection[sectionKey] = [];
  }

  return issuesBySection;
}

function addIssue(
  issuesBySection: Record<EventWebsiteContentSectionKey, EventWebsiteReadinessIssue[]>,
  issue: EventWebsiteReadinessIssue,
) {
  const sectionKey = issue.sectionKey as EventWebsiteContentSectionKey;
  issuesBySection[sectionKey].push(issue);
}

function buildDefaultHostMessage(groomName: string, brideName: string) {
  return defaultHostMessageTemplate
    .replace("%GROOM%", groomName || "Juan")
    .replace("%BRIDE%", brideName || "Maria");
}

function isDefaultHostMessage(message: string, groomName: string, brideName: string) {
  return normalizeText(message) === normalizeText(buildDefaultHostMessage(groomName, brideName));
}

function isDefaultTimeline(items: EventWebsiteContent["sections"]["timeline_program"]["items"]) {
  if (items.length !== defaultTimelineItems.length) {
    return false;
  }

  return items.every((item, index) => {
    const sample = defaultTimelineItems[index];

    return (
      sample &&
      normalizeText(item.title) === normalizeText(sample.title) &&
      normalizeText(item.time) === normalizeText(sample.time) &&
      normalizeText(item.description) === normalizeText(sample.description)
    );
  });
}

function isDefaultEntourage(
  groups: EventWebsiteContent["sections"]["entourage"]["groups"],
  introLine: string,
) {
  if (normalizeText(introLine) === defaultEntourageIntro) {
    return true;
  }

  if (groups.length !== defaultEntourageGroups.length) {
    return false;
  }

  return groups.every((group, index) => {
    const sample = defaultEntourageGroups[index];

    return (
      sample &&
      normalizeText(group.groupTitle) === normalizeText(sample.groupTitle) &&
      normalizeText(group.names) === normalizeText(sample.names)
    );
  });
}

function isDefaultExtraInfo(section: EventWebsiteContent["sections"]["extra_info"]) {
  if (
    normalizeText(section.sectionTitle) === defaultExtraInfoTitle ||
    normalizeText(section.sectionIntro) === defaultExtraInfoIntro
  ) {
    return true;
  }

  if (section.items.length !== defaultExtraInfoItems.length) {
    return false;
  }

  return section.items.every((item, index) => {
    const sample = defaultExtraInfoItems[index];

    return (
      sample &&
      normalizeText(item.title) === normalizeText(sample.title) &&
      normalizeText(item.details) === normalizeText(sample.details)
    );
  });
}

function isSameStringArray(values: string[], sampleValues: string[]) {
  if (values.length !== sampleValues.length) {
    return false;
  }

  return values.every((value, index) => normalizeText(value) === normalizeText(sampleValues[index]));
}

function normalizeMultiline(value: string) {
  return value
    .split(/\r?\n/)
    .map((item) => normalizeText(item))
    .filter(Boolean)
    .join("\n");
}

function normalizeText(value?: string | null) {
  return typeof value === "string" ? value.trim() : "";
}

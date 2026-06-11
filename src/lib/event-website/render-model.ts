import type { EventWebsiteSectionKey } from "@/config/event-website-sections";
import {
  eventWebsiteContentSectionKeys,
  type EventWebsiteContent,
  type EventWebsiteGuestbookMessage,
  type EventWebsiteCustomQuestionFieldType,
  type EventWebsiteImageAsset,
} from "@/lib/event-website/types";

// This file defines the default public renderer contract.
// Dashboard preview behavior must stay opt-in and layered on top of this shared view model.

export type EventWebsiteCustomQuestionRenderModel = {
  fieldType: EventWebsiteCustomQuestionFieldType;
  id: string;
  label: string;
  options: string[];
  required: boolean;
};

export type EventWebsiteTimelineItemRenderModel = {
  description: string;
  id: string;
  time: string;
  title: string;
};

export type EventWebsiteEntourageGroupRenderModel = {
  groupTitle: string;
  id: string;
  names: string;
};

export type EventWebsiteExtraInfoItemRenderModel = {
  details: string;
  id: string;
  title: string;
};

export type EventWebsiteGiftOptionRenderModel = {
  file: File | null;
  image: EventWebsiteImageAsset | null;
  id: string;
  title: string;
};

export type EventWebsiteRenderModel = {
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
    groups: EventWebsiteEntourageGroupRenderModel[];
    introLine: string;
  };
  extraInfo: {
    items: EventWebsiteExtraInfoItemRenderModel[];
    sectionIntro: string;
    sectionTitle: string;
  };
  giftDetails: {
    giftNote: string;
    options: EventWebsiteGiftOptionRenderModel[];
    sectionIntro: string;
  };
  loveStory: {
    sectionIntro: string;
    storyBody: string;
    storyTitle: string;
  };
  guestbook: {
    emptyStateMessage: string;
    sectionIntro: string;
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
    customQuestions: EventWebsiteCustomQuestionRenderModel[];
    emailEnabled: boolean;
    emailRequired: boolean;
    foodAllergiesEnabled: boolean;
    messageToHostEnabled: boolean;
    phoneEnabled: boolean;
    phoneRequired: boolean;
    plusOneEnabled: boolean;
  };
  timelineProgram: {
    items: EventWebsiteTimelineItemRenderModel[];
  };
  venue: {
    address: string;
    arrivalNote: string;
    mapsLink: string;
    venueName: string;
  };
};

export const eventWebsiteRenderModelSectionKeys =
  eventWebsiteContentSectionKeys as readonly EventWebsiteSectionKey[];

export function buildEventWebsiteRenderModel(content: EventWebsiteContent): EventWebsiteRenderModel {
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
        id: group.id,
        names: group.names,
      })),
      introLine: content.sections.entourage.introLine,
    },
    extraInfo: {
      items: content.sections.extra_info.items.map((item) => ({
        details: item.details,
        id: item.id,
        title: item.title,
      })),
      sectionIntro: content.sections.extra_info.sectionIntro,
      sectionTitle: content.sections.extra_info.sectionTitle,
    },
    giftDetails: {
      giftNote: content.sections.gift_details.giftNote,
      options: content.sections.gift_details.options.map((option) => ({
        file: null,
        image: option.image,
        id: option.id,
        title: option.title,
      })),
      sectionIntro: content.sections.gift_details.sectionIntro,
    },
    loveStory: {
      sectionIntro: content.sections.story_message.sectionIntro,
      storyBody: content.sections.story_message.storyBody,
      storyTitle: content.sections.story_message.storyTitle,
    },
    guestbook: {
      emptyStateMessage: content.sections.guestbook.emptyStateMessage,
      sectionIntro: content.sections.guestbook.sectionIntro,
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
        id: question.id,
        label: question.label,
        options: [...question.options],
        required: question.required,
      })),
      emailEnabled: content.sections.rsvp_form.emailEnabled,
      emailRequired: content.sections.rsvp_form.emailRequired,
      foodAllergiesEnabled: content.sections.rsvp_form.foodAllergiesEnabled,
      messageToHostEnabled: content.sections.rsvp_form.messageToHostEnabled,
      phoneEnabled: content.sections.rsvp_form.phoneEnabled,
      phoneRequired: content.sections.rsvp_form.phoneRequired,
      plusOneEnabled: content.sections.rsvp_form.plusOneEnabled,
    },
    timelineProgram: {
      items: content.sections.timeline_program.items.map((item) => ({
        description: item.description,
        id: item.id,
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

export type EventWebsiteRendererGuestbookProps = {
  guestbookMessages: EventWebsiteGuestbookMessage[];
};

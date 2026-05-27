"use client";

import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { EventWebsiteGiftUploadCard } from "@/components/dashboard/event/event-website-gift-upload-card";
import type {
  EventWebsiteEntourageGroupDraft,
  EventWebsiteExtraInfoItemDraft,
  EventWebsiteGiftOptionDraft,
  EventWebsitePreviewDraft,
  EventWebsiteTimelineItemDraft,
} from "@/components/dashboard/event/event-website-preview-data";
import { createEventWebsiteDraftItemId } from "@/components/dashboard/event/event-website-preview-data";
import {
  EditorGroup,
  EditorSaveButton,
  EditorShell,
  type EventWebsiteSaveButtonProps,
  FieldGrid,
  ListBuilder,
  ListBuilderRow,
  TextAreaField,
  TextField,
  TimeField,
} from "@/components/dashboard/event/event-website-optional-fields";
import type { EventWebsiteGuestbookMessage } from "@/lib/event-website/types";

type SharedOptionalPanelProps = {
  guestbookMessages?: EventWebsiteGuestbookMessage[];
  onPreviewDraftChange: (draft: EventWebsitePreviewDraft) => void;
  previewDraft: EventWebsitePreviewDraft;
  saveButtonProps: EventWebsiteSaveButtonProps;
};

export function OptionalCountdownPanel({
  onPreviewDraftChange,
  previewDraft,
  saveButtonProps,
}: SharedOptionalPanelProps) {
  const values = previewDraft.countdown;

  function updateCountdownValue(fieldId: keyof EventWebsitePreviewDraft["countdown"], value: string) {
    onPreviewDraftChange({
      ...previewDraft,
      countdown: { ...previewDraft.countdown, [fieldId]: value },
    });
  }

  return (
    <EditorShell
      title="Countdown"
      description="Toggle this section on to show a countdown on the event website. The date and time come automatically from the required Ceremony details."
    >
      <EditorGroup title="Countdown Copy">
        <TextField
          field={{ id: "countdownTitle", label: "Section Title", maxLength: 90 }}
          value={values.title}
          onChange={(value) => updateCountdownValue("title", value)}
        />
        <TextAreaField
          field={{ id: "countdownShortNote", label: "Short Note", maxLength: 160 }}
          value={values.shortNote}
          onChange={(value) => updateCountdownValue("shortNote", value)}
        />
      </EditorGroup>
      <EditorSaveButton {...saveButtonProps} />
    </EditorShell>
  );
}

export function OptionalReceptionPanel({
  onPreviewDraftChange,
  previewDraft,
  saveButtonProps,
}: SharedOptionalPanelProps) {
  const values = previewDraft.reception;

  function updateReceptionValue(fieldId: keyof EventWebsitePreviewDraft["reception"], value: string) {
    onPreviewDraftChange({
      ...previewDraft,
      reception: { ...previewDraft.reception, [fieldId]: value },
    });
  }

  return (
    <EditorShell
      title="Reception"
      description="Add a separate reception block for the event website without changing the required venue section."
    >
      <EditorGroup title="Reception Details" layout="two-column">
        <TextField
          field={{ colSpan: "full", id: "receptionTitle", label: "Reception Label", maxLength: 80 }}
          value={values.title}
          onChange={(value) => updateReceptionValue("title", value)}
        />
        <TimeField
          field={{ colSpan: "half", id: "receptionStartTime", label: "Start Time", maxLength: 8, showCounter: false }}
          value={values.startTime}
          onChange={(value) => updateReceptionValue("startTime", value)}
        />
        <TimeField
          field={{ colSpan: "half", id: "receptionEndTime", label: "End Time", maxLength: 8, showCounter: false }}
          value={values.endTime}
          onChange={(value) => updateReceptionValue("endTime", value)}
        />
        <TextAreaField
          field={{ colSpan: "full", id: "receptionNote", label: "Reception Note", maxLength: 180 }}
          value={values.note}
          onChange={(value) => updateReceptionValue("note", value)}
        />
        <TextField
          field={{
            colSpan: "full",
            id: "receptionVenueName",
            label: "Venue Name",
            maxLength: 80,
            placeholder: "e.g. The Ruins Garden Hall",
          }}
          value={values.venueName}
          onChange={(value) => updateReceptionValue("venueName", value)}
        />
        <TextAreaField
          field={{
            colSpan: "full",
            id: "receptionAddress",
            label: "Full Address",
            maxLength: 180,
            placeholder: "Street, city, province...",
          }}
          value={values.address}
          onChange={(value) => updateReceptionValue("address", value)}
        />
        <TextField
          field={{
            colSpan: "full",
            id: "receptionMapsLink",
            label: "Google Maps Link",
            maxLength: 200,
            placeholder: "Paste map URL here",
          }}
          inputType="url"
          value={values.mapsLink}
          onChange={(value) => updateReceptionValue("mapsLink", value)}
        />
      </EditorGroup>
      <EditorSaveButton {...saveButtonProps} />
    </EditorShell>
  );
}

export function OptionalTimelinePanel({
  onPreviewDraftChange,
  previewDraft,
  saveButtonProps,
}: SharedOptionalPanelProps) {
  const items = previewDraft.timelineProgram.items;

  function updateItems(items: EventWebsiteTimelineItemDraft[]) {
    onPreviewDraftChange({
      ...previewDraft,
      timelineProgram: { items },
    });
  }

  function updateItem(index: number, nextItem: EventWebsiteTimelineItemDraft) {
    updateItems(items.map((item, itemIndex) => (itemIndex === index ? nextItem : item)));
  }

  function moveItem(index: number, direction: -1 | 1) {
    const nextIndex = index + direction;

    if (nextIndex < 0 || nextIndex >= items.length) {
      return;
    }

    const next = [...items];
    const moved = next[index];
    next[index] = next[nextIndex]!;
    next[nextIndex] = moved!;
    updateItems(next);
  }

  function addItem() {
    updateItems([...items, { description: "", id: createEventWebsiteDraftItemId("timeline-item"), time: "", title: "" }]);
  }

  function removeItem(index: number) {
    updateItems(items.filter((_, itemIndex) => itemIndex !== index));
  }

  return (
    <EditorShell
      title="Timeline / Program"
      description="Build a simple run-of-show for the wedding day. Reorder items as needed and keep the list guest-friendly."
    >
      <EditorGroup title="Program Items">
        <ListBuilder addLabel="Add program item" onAdd={addItem}>
          {items.map((item, index) => (
            <ListBuilderRow
              key={item.id}
              canMoveDown={index < items.length - 1}
              canMoveUp={index > 0}
              hideGripIcon
              onMoveDown={() => moveItem(index, 1)}
              onMoveUp={() => moveItem(index, -1)}
              onRemove={() => removeItem(index)}
              title={`Item ${index + 1}`}
            >
              <FieldGrid layout="two-column">
                <TimeField
                  field={{
                    colSpan: "half",
                    id: `timelineTime${index}`,
                    label: "Time",
                    maxLength: 8,
                    showCounter: false,
                  }}
                  value={item.time}
                  onChange={(value) => updateItem(index, { ...item, time: value })}
                />
                <TextField
                  field={{
                    colSpan: "half",
                    id: `timelineTitle${index}`,
                    label: "Title",
                    maxLength: 80,
                  }}
                  value={item.title}
                  onChange={(value) => updateItem(index, { ...item, title: value })}
                />
                <TextAreaField
                  field={{
                    colSpan: "full",
                    id: `timelineDescription${index}`,
                    label: "Description",
                    maxLength: 180,
                  }}
                  value={item.description}
                  onChange={(value) => updateItem(index, { ...item, description: value })}
                />
              </FieldGrid>
            </ListBuilderRow>
          ))}
        </ListBuilder>
      </EditorGroup>
      <EditorSaveButton {...saveButtonProps} />
    </EditorShell>
  );
}

export function OptionalEntouragePanel({
  onPreviewDraftChange,
  previewDraft,
  saveButtonProps,
}: SharedOptionalPanelProps) {
  const values = previewDraft.entourage;
  const groups = values.groups;

  function updateGroups(groups: EventWebsiteEntourageGroupDraft[]) {
    onPreviewDraftChange({
      ...previewDraft,
      entourage: { ...values, groups },
    });
  }

  function updateGroup(index: number, nextGroup: EventWebsiteEntourageGroupDraft) {
    updateGroups(groups.map((group, groupIndex) => (groupIndex === index ? nextGroup : group)));
  }

  function moveGroup(index: number, direction: -1 | 1) {
    const nextIndex = index + direction;

    if (nextIndex < 0 || nextIndex >= groups.length) {
      return;
    }

    const next = [...groups];
    const moved = next[index];
    next[index] = next[nextIndex]!;
    next[nextIndex] = moved!;
    updateGroups(next);
  }

  function addGroup() {
    updateGroups([...groups, { groupTitle: "", id: createEventWebsiteDraftItemId("entourage-group"), names: "" }]);
  }

  function removeGroup(index: number) {
    updateGroups(groups.filter((_, groupIndex) => groupIndex !== index));
  }

  return (
    <EditorShell
      title="Entourage"
      description="List the wedding party and ceremony participants, grouped by role."
    >
      <EditorGroup title="Section Intro">
        <TextAreaField
          field={{ colSpan: "full", id: "entourageIntroLine", label: "Intro Line", maxLength: 220 }}
          value={values.introLine}
          onChange={(value) =>
            onPreviewDraftChange({
              ...previewDraft,
              entourage: { ...values, introLine: value },
            })
          }
        />
      </EditorGroup>

      <EditorGroup title="Wedding Party Groups">
        <ListBuilder addLabel="Add entourage group" onAdd={addGroup}>
          {groups.map((group, index) => (
            <ListBuilderRow
              key={group.id}
              canMoveDown={index < groups.length - 1}
              canMoveUp={index > 0}
              hideGripIcon
              onMoveDown={() => moveGroup(index, 1)}
              onMoveUp={() => moveGroup(index, -1)}
              onRemove={() => removeGroup(index)}
              title={`Group ${index + 1}`}
            >
              <FieldGrid layout="two-column">
                <TextField
                  field={{
                    colSpan: "full",
                    id: `entourageGroupTitle${index}`,
                    label: "Group Title",
                    maxLength: 80,
                    placeholder: "e.g. Maid of Honor, Bridesmaids",
                  }}
                  value={group.groupTitle}
                  onChange={(value) => updateGroup(index, { ...group, groupTitle: value })}
                />
                <TextAreaField
                  field={{
                    colSpan: "full",
                    id: `entourageNames${index}`,
                    label: "Names",
                    maxLength: 220,
                    placeholder: "Maria Santos or Ana Cruz, Bella Reyes, Carla Lim",
                  }}
                  value={group.names}
                  onChange={(value) => updateGroup(index, { ...group, names: value })}
                />
              </FieldGrid>
            </ListBuilderRow>
          ))}
        </ListBuilder>
      </EditorGroup>
      <EditorSaveButton {...saveButtonProps} />
    </EditorShell>
  );
}

export function OptionalPrincipalSponsorsPanel({
  onPreviewDraftChange,
  previewDraft,
  saveButtonProps,
}: SharedOptionalPanelProps) {
  const values = previewDraft.principalSponsors;

  function updateValues(fieldId: keyof EventWebsitePreviewDraft["principalSponsors"], value: string) {
    onPreviewDraftChange({
      ...previewDraft,
      principalSponsors: { ...values, [fieldId]: value },
    });
  }

  return (
    <EditorShell
      title="Principal Sponsors"
      description="List the principal sponsors who should appear on the wedding website."
    >
      <EditorGroup title="Sponsor Intro">
        <TextAreaField
          field={{ colSpan: "full", id: "principalSponsorsIntroLine", label: "Section Intro", maxLength: 220 }}
          value={values.introLine}
          onChange={(value) => updateValues("introLine", value)}
        />
      </EditorGroup>
      <EditorGroup title="Principal Sponsor Names">
        <TextAreaField
          field={{
            id: "principalSponsorsNames",
            label: "Names",
            maxLength: 420,
            placeholder: "One name per line",
          }}
          value={values.names}
          onChange={(value) => updateValues("names", value)}
        />
      </EditorGroup>
      <EditorSaveButton {...saveButtonProps} />
    </EditorShell>
  );
}

export function OptionalLoveStoryPanel({
  onPreviewDraftChange,
  previewDraft,
  saveButtonProps,
}: SharedOptionalPanelProps) {
  const values = previewDraft.loveStory;

  function updateValues(fieldId: keyof EventWebsitePreviewDraft["loveStory"], value: string) {
    onPreviewDraftChange({
      ...previewDraft,
      loveStory: { ...values, [fieldId]: value },
    });
  }

  return (
    <EditorShell
      title="Love Story"
      description="Share a short story guests can read on the wedding website."
    >
      <EditorGroup title="Story Intro">
        <TextAreaField
          field={{ id: "loveStorySectionIntro", label: "Section Intro", maxLength: 180 }}
          value={values.sectionIntro}
          onChange={(value) => updateValues("sectionIntro", value)}
        />
      </EditorGroup>
      <EditorGroup title="Story Content">
        <TextField
          field={{ id: "loveStoryTitle", label: "Story Title", maxLength: 80 }}
          value={values.storyTitle}
          onChange={(value) => updateValues("storyTitle", value)}
        />
        <TextAreaField
          field={{ id: "loveStoryBody", label: "Story Body", maxLength: 420 }}
          value={values.storyBody}
          onChange={(value) => updateValues("storyBody", value)}
        />
      </EditorGroup>
      <EditorSaveButton {...saveButtonProps} />
    </EditorShell>
  );
}

export function OptionalAttirePanel({
  onPreviewDraftChange,
  previewDraft,
  saveButtonProps,
}: SharedOptionalPanelProps) {
  const values = previewDraft.attireDressCode;

  function updateValues(fieldId: keyof EventWebsitePreviewDraft["attireDressCode"], value: string) {
    onPreviewDraftChange({
      ...previewDraft,
      attireDressCode: { ...values, [fieldId]: value },
    });
  }

  return (
    <EditorShell
      title="Attire / Dress Code"
      description="Give guests clear guidance on what to wear."
    >
      <EditorGroup title="Dress Code">
        <TextAreaField
          field={{ id: "attireSectionIntro", label: "Section Intro", maxLength: 180 }}
          value={values.sectionIntro}
          onChange={(value) => updateValues("sectionIntro", value)}
        />
        <TextAreaField
          field={{ id: "attireDressCodeNote", label: "Dress Code Note", maxLength: 180 }}
          value={values.dressCodeNote}
          onChange={(value) => updateValues("dressCodeNote", value)}
        />
        <TextAreaField
          field={{ id: "attireColorMotifNote", label: "Color / Motif Note", maxLength: 180 }}
          value={values.colorMotifNote}
          onChange={(value) => updateValues("colorMotifNote", value)}
        />
      </EditorGroup>
      <EditorSaveButton {...saveButtonProps} />
    </EditorShell>
  );
}

export function OptionalGuestbookPanel({
  guestbookMessages = [],
  onPreviewDraftChange,
  previewDraft,
  saveButtonProps,
}: SharedOptionalPanelProps) {
  const values = previewDraft.guestbook;

  function updateValues(fieldId: keyof EventWebsitePreviewDraft["guestbook"], value: string) {
    onPreviewDraftChange({
      ...previewDraft,
      guestbook: { ...values, [fieldId]: value },
    });
  }

  return (
    <EditorShell
      title="Guestbook"
      description="Managed from RSVP Responses."
    >
      <EditorGroup title="Guestbook Copy">
        <TextField
          field={{ id: "guestbookSectionTitle", label: "Section Title", maxLength: 80 }}
          value={values.sectionTitle}
          onChange={(value) => updateValues("sectionTitle", value)}
        />
        <TextAreaField
          field={{ id: "guestbookSectionIntro", label: "Section Intro", maxLength: 320 }}
          value={values.sectionIntro}
          onChange={(value) => updateValues("sectionIntro", value)}
        />
        <TextAreaField
          field={{ id: "guestbookEmptyState", label: "Empty State Message", maxLength: 320 }}
          value={values.emptyStateMessage}
          onChange={(value) => updateValues("emptyStateMessage", value)}
        />
      </EditorGroup>

      <EditorGroup title="Approved Messages">
        <div className="rounded-[1.2rem] border border-[#eadbd0] bg-white/80 px-4 py-4">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-[#2b2521]">
              {guestbookMessages.length} approved
            </p>
            <p className="mt-1 text-xs leading-5 text-[#8a7c72]">
              Managed from{" "}
              <Link
                href="/dashboard/responses?tab=needs-review"
                className="inline-flex items-center gap-1 font-medium text-[#8d5f48] underline-offset-4 transition hover:text-[#b85a39] hover:underline"
              >
                RSVP Responses
                <ArrowUpRight className="size-3.5" aria-hidden="true" />
              </Link>
            </p>
          </div>
        </div>

        {guestbookMessages.length > 0 ? (
          <ul className="space-y-2">
            {guestbookMessages.map((message) => (
              <li
                key={message.id}
                className="rounded-[1.2rem] border border-[#eadbd0] bg-[#fffaf6] px-4 py-3"
              >
                <p className="text-sm font-semibold leading-6 text-[#2b2521] [overflow-wrap:anywhere]">
                  {message.guestName}
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <div className="rounded-[1.2rem] border border-dashed border-[#e5d6ca] bg-[#fffdfb] px-4 py-4">
            <p className="text-sm font-medium text-[#65584f]">No approved messages yet.</p>
            <p className="mt-1 text-sm leading-6 text-[#8a7c72]">
              Approve guest messages from{" "}
              <Link
                href="/dashboard/responses?tab=needs-review"
                className="inline-flex items-center gap-1 font-medium text-[#8d5f48] underline-offset-4 transition hover:text-[#b85a39] hover:underline"
              >
                RSVP Responses
                <ArrowUpRight className="size-3.5" aria-hidden="true" />
              </Link>
              .
            </p>
          </div>
        )}
      </EditorGroup>
      <EditorSaveButton {...saveButtonProps} />
    </EditorShell>
  );
}

export function OptionalGiftDetailsPanel({
  onPreviewDraftChange,
  previewDraft,
  saveButtonProps,
}: SharedOptionalPanelProps) {
  const values = previewDraft.giftDetails;
  const giftOptionOne = values.options[0] ?? {
    file: null,
    id: createEventWebsiteDraftItemId("gift-option"),
    title: "",
  };
  const giftOptionTwo = values.options[1] ?? null;

  function updateValues(nextValues: EventWebsitePreviewDraft["giftDetails"]) {
    onPreviewDraftChange({
      ...previewDraft,
      giftDetails: nextValues,
    });
  }

  function updateOption(index: number, nextOption: EventWebsiteGiftOptionDraft) {
    const options = [...values.options];
    options[index] = nextOption;
    updateValues({ ...values, options });
  }

  return (
    <EditorShell
      title="Gift Details"
      description="Add a gift note and up to two display-only gift options for the wedding website."
    >
      <EditorGroup title="Gift Message">
        <TextAreaField
          field={{ id: "giftSectionIntro", label: "Section Intro", maxLength: 200 }}
          value={values.sectionIntro}
          onChange={(value) => updateValues({ ...values, sectionIntro: value })}
        />
        <TextAreaField
          field={{ id: "giftNote", label: "Gift Note", maxLength: 360 }}
          value={values.giftNote}
          onChange={(value) => updateValues({ ...values, giftNote: value })}
        />
      </EditorGroup>

      <EditorGroup title="Gift Options">
        <div className="event-editor-list-stack">
          <div className="event-editor-list-row">
            <div className="event-editor-list-row-header">
              <div className="event-editor-list-row-title">
                <strong>Gift Option 1</strong>
              </div>
            </div>
            <FieldGrid>
              <TextField
                field={{
                  id: "giftOptionOneTitle",
                  label: "Title",
                  maxLength: 80,
                  placeholder: "e.g. GCash, Maya, Bank Transfer, Gift Registry",
                }}
                value={giftOptionOne.title}
                onChange={(value) => updateOption(0, { ...giftOptionOne, title: value })}
              />
              <div className="event-editor-field event-editor-field--full">
                <div className="event-editor-label-row">
                  <span>QR Code / Gift Image</span>
                </div>
                <EventWebsiteGiftUploadCard
                  file={giftOptionOne.file}
                  fileInputId="event-editor-gift-option-one-upload"
                  onFileChange={(file) => updateOption(0, { ...giftOptionOne, file })}
                />
              </div>
            </FieldGrid>
          </div>

          {giftOptionTwo ? (
            <div className="event-editor-list-row">
              <div className="event-editor-list-row-header">
                <div className="event-editor-list-row-title">
                  <strong>Gift Option 2</strong>
                </div>
                <div className="event-editor-list-row-actions">
                  <button
                    type="button"
                    className="event-editor-inline-remove-button"
                    onClick={() => updateValues({ ...values, options: [giftOptionOne] })}
                  >
                    Remove option
                  </button>
                </div>
              </div>
              <FieldGrid>
                <TextField
                  field={{
                    id: "giftOptionTwoTitle",
                    label: "Title",
                    maxLength: 80,
                    placeholder: "e.g. GCash, Maya, Bank Transfer, Gift Registry",
                  }}
                  value={giftOptionTwo.title}
                  onChange={(value) => updateOption(1, { ...giftOptionTwo, title: value })}
                />
                <div className="event-editor-field event-editor-field--full">
                  <div className="event-editor-label-row">
                    <span>QR Code / Gift Image</span>
                  </div>
                  <EventWebsiteGiftUploadCard
                    file={giftOptionTwo.file}
                    fileInputId="event-editor-gift-option-two-upload"
                    onFileChange={(file) => updateOption(1, { ...giftOptionTwo, file })}
                  />
                </div>
              </FieldGrid>
            </div>
          ) : (
            <button
              type="button"
              className="event-editor-list-add-button event-editor-list-add-button--inline"
              onClick={() =>
                updateValues({
                  ...values,
                  options: [...values.options, { file: null, id: createEventWebsiteDraftItemId("gift-option"), title: "" }],
                })
              }
            >
              + Add another gift option
            </button>
          )}
        </div>
      </EditorGroup>
      <EditorSaveButton {...saveButtonProps} />
    </EditorShell>
  );
}

export function OptionalContactSocialsPanel({
  onPreviewDraftChange,
  previewDraft,
  saveButtonProps,
}: SharedOptionalPanelProps) {
  const values = previewDraft.contactSocials;

  function updateValues(fieldId: keyof EventWebsitePreviewDraft["contactSocials"], value: string) {
    onPreviewDraftChange({
      ...previewDraft,
      contactSocials: { ...values, [fieldId]: value },
    });
  }

  return (
    <EditorShell
      title="Contact & Socials"
      description="Add one guest-facing contact and optional social links."
    >
      <EditorGroup title="Contact Details" layout="two-column">
        <TextField
          field={{
            colSpan: "half",
            id: "contactSocialsPerson",
            label: "Contact Person",
            maxLength: 80,
            placeholder: "e.g. Anna Santos",
          }}
          value={values.contactPerson}
          onChange={(value) => updateValues("contactPerson", value)}
        />
        <TextField
          field={{
            colSpan: "half",
            id: "contactSocialsNumber",
            label: "Contact Number",
            maxLength: 40,
            placeholder: "e.g. +63 917 123 4567",
          }}
          value={values.contactNumber}
          onChange={(value) => updateValues("contactNumber", value)}
        />
        <TextField
          field={{
            colSpan: "full",
            id: "contactSocialsEmail",
            label: "Email",
            maxLength: 120,
            placeholder: "e.g. hello@example.com",
          }}
          inputType="email"
          value={values.email}
          onChange={(value) => updateValues("email", value)}
        />
      </EditorGroup>

      <EditorGroup title="Social Links">
        <TextField
          field={{
            id: "contactSocialsFacebook",
            label: "Facebook URL",
            maxLength: 200,
            placeholder: "https://facebook.com/...",
          }}
          inputType="url"
          value={values.facebookUrl}
          onChange={(value) => updateValues("facebookUrl", value)}
        />
        <TextField
          field={{
            id: "contactSocialsInstagram",
            label: "Instagram URL",
            maxLength: 200,
            placeholder: "https://instagram.com/...",
          }}
          inputType="url"
          value={values.instagramUrl}
          onChange={(value) => updateValues("instagramUrl", value)}
        />
        <TextField
          field={{
            id: "contactSocialsTikTok",
            label: "TikTok URL",
            maxLength: 200,
            placeholder: "https://tiktok.com/@...",
          }}
          inputType="url"
          value={values.tikTokUrl}
          onChange={(value) => updateValues("tikTokUrl", value)}
        />
      </EditorGroup>
      <EditorSaveButton {...saveButtonProps} />
    </EditorShell>
  );
}

export function OptionalMusicEffectsPanel({
  onPreviewDraftChange,
  previewDraft,
  saveButtonProps,
}: SharedOptionalPanelProps) {
  const values = previewDraft.musicEffects;

  function updateValues(fieldId: keyof EventWebsitePreviewDraft["musicEffects"], value: string) {
    onPreviewDraftChange({
      ...previewDraft,
      musicEffects: { ...values, [fieldId]: value },
    });
  }

  return (
    <EditorShell
      title="Music & Effects"
      description="Add a music link for the wedding website."
    >
      <EditorGroup title="Background Music">
        <TextField
          field={{ id: "musicEffectsTitle", label: "Music Title", maxLength: 80 }}
          value={values.musicTitle}
          onChange={(value) => updateValues("musicTitle", value)}
        />
        <TextField
          field={{
            id: "musicEffectsLink",
            label: "Music Link / Audio URL",
            maxLength: 240,
            placeholder: "Paste YouTube, Spotify, SoundCloud, or audio link",
          }}
          inputType="url"
          value={values.musicLink}
          onChange={(value) => updateValues("musicLink", value)}
        />
        <TextField
          field={{ id: "musicEffectsButtonLabel", label: "Play Button Label", maxLength: 80 }}
          value={values.playButtonLabel}
          onChange={(value) => updateValues("playButtonLabel", value)}
        />
        <TextAreaField
          field={{ id: "musicEffectsShortNote", label: "Short Note", maxLength: 180 }}
          value={values.shortNote}
          onChange={(value) => updateValues("shortNote", value)}
        />
      </EditorGroup>
      <EditorSaveButton {...saveButtonProps} />
    </EditorShell>
  );
}

export function OptionalExtraInfoPanel({
  onPreviewDraftChange,
  previewDraft,
  saveButtonProps,
}: SharedOptionalPanelProps) {
  const values = previewDraft.extraInfo;
  const items = values.items;

  function updateItems(items: EventWebsiteExtraInfoItemDraft[]) {
    onPreviewDraftChange({
      ...previewDraft,
      extraInfo: { ...values, items },
    });
  }

  function updateItem(index: number, nextItem: EventWebsiteExtraInfoItemDraft) {
    updateItems(items.map((item, itemIndex) => (itemIndex === index ? nextItem : item)));
  }

  function moveItem(index: number, direction: -1 | 1) {
    const nextIndex = index + direction;

    if (nextIndex < 0 || nextIndex >= items.length) {
      return;
    }

    const next = [...items];
    const moved = next[index];
    next[index] = next[nextIndex]!;
    next[nextIndex] = moved!;
    updateItems(next);
  }

  function addItem() {
    updateItems([...items, { details: "", id: createEventWebsiteDraftItemId("extra-info"), title: "" }]);
  }

  function removeItem(index: number) {
    updateItems(items.filter((_, itemIndex) => itemIndex !== index));
  }

  return (
    <EditorShell
      title="Extra Info"
      description="Add practical guest information that does not fit in the other sections."
    >
      <EditorGroup title="Additional Information">
        <TextField
          field={{ id: "extraInfoSectionTitle", label: "Section Title", maxLength: 80 }}
          value={values.sectionTitle}
          onChange={(value) =>
            onPreviewDraftChange({
              ...previewDraft,
              extraInfo: { ...values, sectionTitle: value },
            })
          }
        />
        <TextAreaField
          field={{ id: "extraInfoSectionIntro", label: "Section Intro", maxLength: 180 }}
          value={values.sectionIntro}
          onChange={(value) =>
            onPreviewDraftChange({
              ...previewDraft,
              extraInfo: { ...values, sectionIntro: value },
            })
          }
        />
      </EditorGroup>

      <EditorGroup title="Info Items">
        <ListBuilder addLabel="Add info item" onAdd={addItem}>
          {items.map((item, index) => (
            <ListBuilderRow
              key={item.id}
              canMoveDown={index < items.length - 1}
              canMoveUp={index > 0}
              hideGripIcon
              onMoveDown={() => moveItem(index, 1)}
              onMoveUp={() => moveItem(index, -1)}
              onRemove={() => removeItem(index)}
              title={`Info ${index + 1}`}
            >
              <FieldGrid>
                <TextField
                  field={{
                    id: `extraInfoItemTitle${index}`,
                    label: "Item Title",
                    maxLength: 80,
                  }}
                  value={item.title}
                  onChange={(value) => updateItem(index, { ...item, title: value })}
                />
                <TextAreaField
                  field={{
                    id: `extraInfoItemDetails${index}`,
                    label: "Details",
                    maxLength: 220,
                  }}
                  value={item.details}
                  onChange={(value) => updateItem(index, { ...item, details: value })}
                />
              </FieldGrid>
            </ListBuilderRow>
          ))}
        </ListBuilder>
      </EditorGroup>
      <EditorSaveButton {...saveButtonProps} />
    </EditorShell>
  );
}

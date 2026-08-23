"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowUpRight, MessageCircle, Sparkles } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { resolveMessengerUrl } from "@/lib/apply/messenger";
import { useDashboardSettingsQuery } from "@/lib/dashboard/dashboard-queries";
import { Button } from "@/components/ui/button";
import { EventWebsiteGiftUploadCard } from "@/components/dashboard/event/event-website-gift-upload-card";
import type {
  EventWebsiteEntourageGroupDraft,
  EventWebsiteExtraInfoItemDraft,
  EventWebsiteGiftOptionDraft,
  EventWebsitePreviewDraft,
  EventWebsiteTimelineItemDraft,
} from "@/components/dashboard/event/event-website-preview-data";
import { createEventWebsiteDraftItemId } from "@/components/dashboard/event/event-website-preview-data";
import { uploadEventWebsiteGiftImageAction } from "@/server/actions/event-website";
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
import {
  EVENT_WEBSITE_GIFT_MEDIA_ALLOWED_TYPES,
  EVENT_WEBSITE_GIFT_MEDIA_MAX_SIZE,
  EVENT_WEBSITE_GIFT_MEDIA_MAX_SIZE_LABEL,
} from "@/lib/event-website/gift-media";
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

  function updateCountdownValue(
    fieldId: keyof EventWebsitePreviewDraft["countdown"],
    value: string,
  ) {
    onPreviewDraftChange({
      ...previewDraft,
      countdown: { ...previewDraft.countdown, [fieldId]: value },
    });
  }

  return (
    <EditorShell
      title="Countdown"
      description="Toggle this section on to show a countdown on the event website. The date and time come automatically from the required Main Event / Program details."
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
  const isBirthday = previewDraft.hostInfo.kind === "birthday";
  const values = previewDraft.reception;

  function updateReceptionValue(
    fieldId: keyof EventWebsitePreviewDraft["reception"],
    value: string,
  ) {
    onPreviewDraftChange({
      ...previewDraft,
      reception: { ...previewDraft.reception, [fieldId]: value },
    });
  }

  return (
    <EditorShell
      title={isBirthday ? "Reception / After-Party" : "Reception"}
      description={
        isBirthday
          ? "Add a separate reception or after-party block for the event website without changing the required venue section."
          : "Add a separate reception block for the event website without changing the required venue section."
      }
    >
      <EditorGroup title="Reception Details" layout="two-column">
        <TextField
          field={{ colSpan: "full", id: "receptionTitle", label: "Reception Label", maxLength: 80 }}
          value={values.title}
          onChange={(value) => updateReceptionValue("title", value)}
        />
        <TimeField
          field={{
            colSpan: "half",
            id: "receptionStartTime",
            label: "Start Time",
            maxLength: 8,
            showCounter: false,
          }}
          value={values.startTime}
          onChange={(value) => updateReceptionValue("startTime", value)}
        />
        <TimeField
          field={{
            colSpan: "half",
            id: "receptionEndTime",
            label: "End Time",
            maxLength: 8,
            showCounter: false,
          }}
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
    updateItems([
      ...items,
      { description: "", id: createEventWebsiteDraftItemId("timeline-item"), time: "", title: "" },
    ]);
  }

  function removeItem(index: number) {
    updateItems(items.filter((_, itemIndex) => itemIndex !== index));
  }

  return (
    <EditorShell
      title="Timeline / Program"
      description="Build a simple run-of-show for your celebration. Reorder items as needed and keep the list guest-friendly."
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
    updateGroups([
      ...groups,
      { groupTitle: "", id: createEventWebsiteDraftItemId("entourage-group"), names: "" },
    ]);
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
  const isDebut = previewDraft.hostInfo.kind === "debut";
  const isBirthday = previewDraft.hostInfo.kind === "birthday";
  const isSpecialSponsors = isDebut || isBirthday;
  const values = previewDraft.principalSponsors;

  function updateValues(
    fieldId: keyof EventWebsitePreviewDraft["principalSponsors"],
    value: string,
  ) {
    onPreviewDraftChange({
      ...previewDraft,
      principalSponsors: { ...values, [fieldId]: value },
    });
  }

  return (
    <EditorShell
      title={isSpecialSponsors ? "Special Sponsors" : "Principal Sponsors"}
      description={
        isDebut
          ? "List godparents, mentors, and honored guests supporting the debutant."
          : isBirthday
            ? "List godparents, mentors, and honored guests supporting the celebrant."
            : "List the principal sponsors who should appear on the wedding website."
      }
    >
      <EditorGroup title="Sponsor Intro">
        <TextAreaField
          field={{
            colSpan: "full",
            id: "principalSponsorsIntroLine",
            label: "Section Intro",
            maxLength: 220,
            placeholder: isSpecialSponsors
              ? "e.g. We are blessed with the guidance and love of our special sponsors."
              : "e.g. We are grateful for the guidance of our principal sponsors.",
          }}
          value={values.introLine}
          onChange={(value) => updateValues("introLine", value)}
        />
      </EditorGroup>
      <EditorGroup title={isSpecialSponsors ? "Special Sponsor Names" : "Principal Sponsor Names"}>
        <TextAreaField
          field={{
            id: "principalSponsorsNames",
            label: "Names",
            maxLength: 420,
            placeholder: isSpecialSponsors
              ? "Ninong Alexander Morales\nNinang Elena Santos\nTito Roberto Reyes"
              : "Mr. Juan Dela Cruz\nMrs. Maria Dela Cruz",
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
  const isBirthday = previewDraft.hostInfo.kind === "birthday";
  const isDebut = previewDraft.hostInfo.kind === "debut";
  const isBaptism = previewDraft.hostInfo.kind === "baptism";
  const values = previewDraft.loveStory;

  function updateValues(fieldId: keyof EventWebsitePreviewDraft["loveStory"], value: string) {
    onPreviewDraftChange({
      ...previewDraft,
      loveStory: { ...values, [fieldId]: value },
    });
  }

  return (
    <EditorShell
      title={
        isBirthday
          ? "Celebrant Story"
          : isDebut
            ? "Debutant Story"
            : isBaptism
              ? "Parents' Dedication"
              : "Love Story"
      }
      description={
        isBirthday
          ? "Share a short milestone story or message guests can read on the website."
          : isDebut
            ? "Share a milestone journey or reflection guests can read on the website."
            : isBaptism
              ? "Share a dedication message, thanksgiving prayer, or milestone reflection for the child."
              : "Share a short story guests can read on the wedding website."
      }
    >
      <EditorGroup title="Story Intro">
        <TextAreaField
          field={{
            id: "loveStorySectionIntro",
            label: "Section Intro",
            maxLength: 180,
            placeholder: isBirthday
              ? "e.g. A special milestone reflection..."
              : isDebut
                ? "e.g. A milestone reflection on turning 18..."
                : isBaptism
                  ? "e.g. A prayer and blessing for our beloved child..."
                  : undefined,
          }}
          value={values.sectionIntro}
          onChange={(value) => updateValues("sectionIntro", value)}
        />
      </EditorGroup>
      <EditorGroup title="Story Content">
        <TextField
          field={{
            id: "loveStoryTitle",
            label: "Story Title",
            maxLength: 80,
            placeholder: isBirthday
              ? "e.g. A Journey to 30"
              : isDebut
                ? "e.g. My Journey to 18"
                : isBaptism
                  ? "e.g. Welcoming Liam into Faith"
                  : undefined,
          }}
          value={values.storyTitle}
          onChange={(value) => updateValues("storyTitle", value)}
        />
        <TextAreaField
          field={{
            id: "loveStoryBody",
            label: "Story Body",
            maxLength: 420,
            placeholder: isBirthday
              ? "e.g. Grateful for 30 years of blessings, growth, and wonderful memories with family and friends..."
              : isDebut
                ? "e.g. Eighteen years of cherished memories, love, and lessons as I step into adulthood..."
                : isBaptism
                  ? "e.g. A precious blessing from God, Liam has brought immense joy and love into our lives..."
                  : undefined,
          }}
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
    <EditorShell title="Guestbook" description="Managed from RSVP Responses.">
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
                <p className="text-sm leading-6 font-semibold [overflow-wrap:anywhere] text-[#2b2521]">
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
    image: null,
    id: createEventWebsiteDraftItemId("gift-option"),
    title: "",
  };
  const giftOptionTwo = values.options[1] ?? null;
  const [giftUploadErrors, setGiftUploadErrors] = useState<Record<string, string | null>>({});
  const [uploadingOptionIds, setUploadingOptionIds] = useState<Record<string, boolean>>({});
  const latestDraftRef = useRef(previewDraft);

  useEffect(() => {
    latestDraftRef.current = previewDraft;
  }, [previewDraft]);

  function updateValues(nextValues: EventWebsitePreviewDraft["giftDetails"]) {
    onPreviewDraftChange({
      ...previewDraft,
      giftDetails: nextValues,
    });
  }

  function updateOption(index: number, nextOption: EventWebsiteGiftOptionDraft) {
    const options = [...latestDraftRef.current.giftDetails.options];
    options[index] = nextOption;
    updateValues({ ...latestDraftRef.current.giftDetails, options });
  }

  function setGiftUploadError(optionId: string, message: string | null) {
    setGiftUploadErrors((current) => ({ ...current, [optionId]: message }));
  }

  function validateGiftFile(file: File) {
    if (
      !EVENT_WEBSITE_GIFT_MEDIA_ALLOWED_TYPES.includes(
        file.type as (typeof EVENT_WEBSITE_GIFT_MEDIA_ALLOWED_TYPES)[number],
      )
    ) {
      return "Upload a PNG, JPG, or WEBP image.";
    }

    if (file.size > EVENT_WEBSITE_GIFT_MEDIA_MAX_SIZE) {
      return `Image must be ${EVENT_WEBSITE_GIFT_MEDIA_MAX_SIZE_LABEL} or smaller.`;
    }

    return null;
  }

  async function handleGiftFileChange(index: number, file: File | null) {
    const currentOption =
      latestDraftRef.current.giftDetails.options[index] ??
      (index === 0 ? giftOptionOne : giftOptionTwo);

    if (!currentOption) {
      return;
    }

    if (!file) {
      setGiftUploadError(currentOption.id, null);
      updateOption(index, {
        ...currentOption,
        file: null,
        image: null,
      });
      return;
    }

    const validationMessage = validateGiftFile(file);

    if (validationMessage) {
      setGiftUploadError(currentOption.id, validationMessage);
      return;
    }

    setGiftUploadError(currentOption.id, null);
    updateOption(index, {
      ...currentOption,
      file,
    });
    setUploadingOptionIds((current) => ({ ...current, [currentOption.id]: true }));

    try {
      const result = await uploadEventWebsiteGiftImageAction({
        file,
        optionId: currentOption.id,
        title: currentOption.title,
      });

      if (!result.ok) {
        const message = result.error || "Gift image could not be uploaded.";
        const isValidationError =
          message === "Upload a PNG, JPG, or WEBP image." ||
          message === `Image must be ${EVENT_WEBSITE_GIFT_MEDIA_MAX_SIZE_LABEL} or smaller.`;

        if (isValidationError) {
          setGiftUploadError(currentOption.id, message);
          updateOption(index, {
            ...currentOption,
            file: null,
          });
          return;
        }

        throw new Error(message);
      }

      const latestOption = latestDraftRef.current.giftDetails.options[index] ?? currentOption;

      updateOption(index, {
        ...latestOption,
        file,
        image: result.data.image,
      });
    } catch (error) {
      setGiftUploadError(currentOption.id, null);
      updateOption(index, {
        ...currentOption,
        file: null,
      });
      toast.error(error instanceof Error ? error.message : "Gift image could not be uploaded.");
    } finally {
      setUploadingOptionIds((current) => ({ ...current, [currentOption.id]: false }));
    }
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
                  errorMessage={giftUploadErrors[giftOptionOne.id] ?? null}
                  file={giftOptionOne.file}
                  fileInputId="event-editor-gift-option-one-upload"
                  image={giftOptionOne.image}
                  isUploading={Boolean(uploadingOptionIds[giftOptionOne.id])}
                  onFileChange={(file) => void handleGiftFileChange(0, file)}
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
                    errorMessage={giftUploadErrors[giftOptionTwo.id] ?? null}
                    file={giftOptionTwo.file}
                    fileInputId="event-editor-gift-option-two-upload"
                    image={giftOptionTwo.image}
                    isUploading={Boolean(uploadingOptionIds[giftOptionTwo.id])}
                    onFileChange={(file) => void handleGiftFileChange(1, file)}
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
                  options: [
                    ...values.options,
                    {
                      file: null,
                      id: createEventWebsiteDraftItemId("gift-option"),
                      image: null,
                      title: "",
                    },
                  ],
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
    <EditorShell title="Music & Effects" description="Add a music link for the wedding website.">
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
    updateItems([
      ...items,
      { details: "", id: createEventWebsiteDraftItemId("extra-info"), title: "" },
    ]);
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

export function OptionalEighteenRosesCandlesPanel({
  onPreviewDraftChange,
  previewDraft,
  saveButtonProps,
}: SharedOptionalPanelProps) {
  const values = previewDraft.eighteenRosesCandles || { groups: [] };
  const groups = values.groups || [];

  function updateGroups(nextGroups: typeof groups) {
    onPreviewDraftChange({
      ...previewDraft,
      eighteenRosesCandles: { groups: nextGroups },
    });
  }

  function addGroup(kind: "roses" | "candles" | "treasures" | "custom" = "roses") {
    const titleMap = {
      roses: "18 Roses",
      candles: "18 Candles",
      treasures: "18 Treasures",
      custom: "Custom Tradition",
    };
    updateGroups([
      ...groups,
      {
        entries: [],
        id: createEventWebsiteDraftItemId("tradition-group"),
        kind,
        title: titleMap[kind],
      },
    ]);
  }

  function removeGroup(index: number) {
    updateGroups(groups.filter((_, i) => i !== index));
  }

  function updateGroupTitle(index: number, title: string) {
    updateGroups(groups.map((g, i) => (i === index ? { ...g, title } : g)));
  }

  function addEntry(groupIndex: number) {
    const group = groups[groupIndex];
    if (!group || group.entries.length >= 18) return;
    const nextEntries = [
      ...group.entries,
      {
        id: createEventWebsiteDraftItemId("tradition-entry"),
        message: "",
        name: "",
      },
    ];
    updateGroups(
      groups.map((g, i) => (i === groupIndex ? { ...g, entries: nextEntries } : g)),
    );
  }

  function updateEntry(
    groupIndex: number,
    entryIndex: number,
    field: "name" | "message",
    value: string,
  ) {
    const group = groups[groupIndex];
    if (!group) return;
    const nextEntries = group.entries.map((entry, i) =>
      i === entryIndex ? { ...entry, [field]: value } : entry,
    );
    updateGroups(
      groups.map((g, i) => (i === groupIndex ? { ...g, entries: nextEntries } : g)),
    );
  }

  function removeEntry(groupIndex: number, entryIndex: number) {
    const group = groups[groupIndex];
    if (!group) return;
    const nextEntries = group.entries.filter((_, i) => i !== entryIndex);
    updateGroups(
      groups.map((g, i) => (i === groupIndex ? { ...g, entries: nextEntries } : g)),
    );
  }

  function moveEntry(groupIndex: number, entryIndex: number, direction: -1 | 1) {
    const group = groups[groupIndex];
    if (!group) return;
    const nextIndex = entryIndex + direction;
    if (nextIndex < 0 || nextIndex >= group.entries.length) return;
    const nextEntries = [...group.entries];
    const moved = nextEntries[entryIndex];
    nextEntries[entryIndex] = nextEntries[nextIndex]!;
    nextEntries[nextIndex] = moved!;
    updateGroups(
      groups.map((g, i) => (i === groupIndex ? { ...g, entries: nextEntries } : g)),
    );
  }

  return (
    <EditorShell
      title="18 Roses & Candles"
      description="Manage the honored participants for 18 Roses, 18 Candles, 18 Treasures, and other debut traditions."
    >
      {groups.length === 0 ? (
        <EditorGroup title="Quick Start Traditions">
          <p className="mb-3 text-sm text-slate-500">
            Add standard debut traditions with one click:
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => addGroup("roses")}
              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              + Add 18 Roses
            </button>
            <button
              type="button"
              onClick={() => addGroup("candles")}
              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              + Add 18 Candles
            </button>
            <button
              type="button"
              onClick={() => addGroup("treasures")}
              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              + Add 18 Treasures
            </button>
            <button
              type="button"
              onClick={() => addGroup("custom")}
              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              + Add Custom Tradition
            </button>
          </div>
        </EditorGroup>
      ) : null}

      {groups.map((group, groupIndex) => (
        <EditorGroup
          key={group.id}
          title={`${group.title || "Tradition Group"} (${group.entries.length}/18)`}
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex-1">
                <TextField
                  field={{
                    id: `traditionTitle${groupIndex}`,
                    label: "Tradition Title",
                    maxLength: 80,
                  }}
                  value={group.title}
                  onChange={(val) => updateGroupTitle(groupIndex, val)}
                />
              </div>
              <button
                type="button"
                onClick={() => removeGroup(groupIndex)}
                className="mt-5 rounded-md px-2.5 py-1.5 text-xs font-medium text-rose-600 hover:bg-rose-50"
              >
                Delete Group
              </button>
            </div>

            <ListBuilder
              addLabel={`Add ${group.title || "participant"} (${group.entries.length}/18)`}
              onAdd={() => addEntry(groupIndex)}
            >
              {group.entries.map((entry, entryIndex) => (
                <ListBuilderRow
                  key={entry.id}
                  canMoveDown={entryIndex < group.entries.length - 1}
                  canMoveUp={entryIndex > 0}
                  hideGripIcon
                  onMoveDown={() => moveEntry(groupIndex, entryIndex, 1)}
                  onMoveUp={() => moveEntry(groupIndex, entryIndex, -1)}
                  onRemove={() => removeEntry(groupIndex, entryIndex)}
                  title={`${entry.name || `Participant ${entryIndex + 1}`}`}
                >
                  <FieldGrid layout="two-column">
                    <TextField
                      field={{
                        colSpan: "half",
                        id: `entryName${groupIndex}_${entryIndex}`,
                        label: "Participant Name",
                        maxLength: 80,
                        placeholder: "e.g. Juan Dela Cruz",
                      }}
                      value={entry.name}
                      onChange={(val) => updateEntry(groupIndex, entryIndex, "name", val)}
                    />
                    <TextField
                      field={{
                        colSpan: "half",
                        id: `entryMessage${groupIndex}_${entryIndex}`,
                        label: "Dedication / Message",
                        maxLength: 220,
                        placeholder: "e.g. First dance with dad",
                      }}
                      value={entry.message}
                      onChange={(val) => updateEntry(groupIndex, entryIndex, "message", val)}
                    />
                  </FieldGrid>
                </ListBuilderRow>
              ))}
            </ListBuilder>
          </div>
        </EditorGroup>
      ))}

      {groups.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-2">
          <button
            type="button"
            onClick={() => addGroup("roses")}
            className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100"
          >
            + Add 18 Roses
          </button>
          <button
            type="button"
            onClick={() => addGroup("candles")}
            className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100"
          >
            + Add 18 Candles
          </button>
          <button
            type="button"
            onClick={() => addGroup("treasures")}
            className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100"
          >
            + Add 18 Treasures
          </button>
          <button
            type="button"
            onClick={() => addGroup("custom")}
            className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100"
          >
            + Add Custom Group
          </button>
        </div>
      )}

      <EditorSaveButton {...saveButtonProps} />
    </EditorShell>
  );
}

export function OptionalDebutCourtPanel({
  onPreviewDraftChange,
  previewDraft,
  saveButtonProps,
}: SharedOptionalPanelProps) {
  const values = previewDraft.debutCourt || { groups: [] };
  const groups = values.groups || [];

  function updateGroups(nextGroups: typeof groups) {
    onPreviewDraftChange({
      ...previewDraft,
      debutCourt: { groups: nextGroups },
    });
  }

  function addGroup(defaultTitle = "Cotillion de Honor") {
    updateGroups([
      ...groups,
      {
        id: createEventWebsiteDraftItemId("court-group"),
        names: [],
        title: defaultTitle,
      },
    ]);
  }

  function removeGroup(index: number) {
    updateGroups(groups.filter((_, i) => i !== index));
  }

  function updateGroupTitle(index: number, title: string) {
    updateGroups(groups.map((g, i) => (i === index ? { ...g, title } : g)));
  }

  function addName(groupIndex: number) {
    const group = groups[groupIndex];
    if (!group) return;
    const nextNames = [
      ...group.names,
      {
        id: createEventWebsiteDraftItemId("court-name"),
        name: "",
      },
    ];
    updateGroups(
      groups.map((g, i) => (i === groupIndex ? { ...g, names: nextNames } : g)),
    );
  }

  function updateName(groupIndex: number, nameIndex: number, value: string) {
    const group = groups[groupIndex];
    if (!group) return;
    const nextNames = group.names.map((n, i) =>
      i === nameIndex ? { ...n, name: value } : n,
    );
    updateGroups(
      groups.map((g, i) => (i === groupIndex ? { ...g, names: nextNames } : g)),
    );
  }

  function removeName(groupIndex: number, nameIndex: number) {
    const group = groups[groupIndex];
    if (!group) return;
    const nextNames = group.names.filter((_, i) => i !== nameIndex);
    updateGroups(
      groups.map((g, i) => (i === groupIndex ? { ...g, names: nextNames } : g)),
    );
  }

  function moveName(groupIndex: number, nameIndex: number, direction: -1 | 1) {
    const group = groups[groupIndex];
    if (!group) return;
    const nextIndex = nameIndex + direction;
    if (nextIndex < 0 || nextIndex >= group.names.length) return;
    const nextNames = [...group.names];
    const moved = nextNames[nameIndex];
    nextNames[nameIndex] = nextNames[nextIndex]!;
    nextNames[nextIndex] = moved!;
    updateGroups(
      groups.map((g, i) => (i === groupIndex ? { ...g, names: nextNames } : g)),
    );
  }

  return (
    <EditorShell
      title="Debut Court"
      description="List your Debut Escort, Cotillion de Honor pairs, and court members."
    >
      {groups.length === 0 ? (
        <EditorGroup title="Debut Court Setup">
          <p className="mb-3 text-sm text-slate-500">
            Add court groups for your debut program:
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => addGroup("Debut Escort")}
              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              + Add Debut Escort
            </button>
            <button
              type="button"
              onClick={() => addGroup("Cotillion de Honor")}
              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              + Add Cotillion de Honor
            </button>
            <button
              type="button"
              onClick={() => addGroup("Debut Court")}
              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              + Add Court Group
            </button>
          </div>
        </EditorGroup>
      ) : null}

      {groups.map((group, groupIndex) => (
        <EditorGroup
          key={group.id}
          title={`${group.title || "Court Group"} (${group.names.length})`}
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex-1">
                <TextField
                  field={{
                    id: `courtTitle${groupIndex}`,
                    label: "Group Title",
                    maxLength: 80,
                  }}
                  value={group.title}
                  onChange={(val) => updateGroupTitle(groupIndex, val)}
                />
              </div>
              <button
                type="button"
                onClick={() => removeGroup(groupIndex)}
                className="mt-5 rounded-md px-2.5 py-1.5 text-xs font-medium text-rose-600 hover:bg-rose-50"
              >
                Delete Group
              </button>
            </div>

            <ListBuilder
              addLabel={`Add member to ${group.title || "court"}`}
              onAdd={() => addName(groupIndex)}
            >
              {group.names.map((entry, nameIndex) => (
                <ListBuilderRow
                  key={entry.id}
                  canMoveDown={nameIndex < group.names.length - 1}
                  canMoveUp={nameIndex > 0}
                  hideGripIcon
                  onMoveDown={() => moveName(groupIndex, nameIndex, 1)}
                  onMoveUp={() => moveName(groupIndex, nameIndex, -1)}
                  onRemove={() => removeName(groupIndex, nameIndex)}
                  title={`${entry.name || `Member ${nameIndex + 1}`}`}
                >
                  <TextField
                    field={{
                      id: `courtName${groupIndex}_${nameIndex}`,
                      label: "Member / Pair Name",
                      maxLength: 80,
                      placeholder: "e.g. Mateo Morales & Bea Reyes",
                    }}
                    value={entry.name}
                    onChange={(val) => updateName(groupIndex, nameIndex, val)}
                  />
                </ListBuilderRow>
              ))}
            </ListBuilder>
          </div>
        </EditorGroup>
      ))}

      {groups.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-2">
          <button
            type="button"
            onClick={() => addGroup("Debut Escort")}
            className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100"
          >
            + Add Debut Escort
          </button>
          <button
            type="button"
            onClick={() => addGroup("Cotillion de Honor")}
            className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100"
          >
            + Add Cotillion Group
          </button>
        </div>
      )}

      <EditorSaveButton {...saveButtonProps} />
    </EditorShell>
  );
}

export function OptionalGodparentsPanel({
  onPreviewDraftChange,
  previewDraft,
  saveButtonProps,
}: SharedOptionalPanelProps) {
  const values = previewDraft.godparents || { groups: [] };
  const groups = values.groups || [];

  function updateGroups(nextGroups: typeof groups) {
    onPreviewDraftChange({
      ...previewDraft,
      godparents: { groups: nextGroups },
    });
  }

  function addGroup(defaultTitle = "Ninongs (Godfathers)") {
    updateGroups([
      ...groups,
      {
        id: createEventWebsiteDraftItemId("godparent-group"),
        names: [],
        title: defaultTitle,
      },
    ]);
  }

  function removeGroup(index: number) {
    updateGroups(groups.filter((_, i) => i !== index));
  }

  function updateGroupTitle(index: number, title: string) {
    updateGroups(groups.map((g, i) => (i === index ? { ...g, title } : g)));
  }

  function addName(groupIndex: number) {
    const group = groups[groupIndex];
    if (!group) return;
    const nextNames = [
      ...group.names,
      {
        id: createEventWebsiteDraftItemId("godparent-name"),
        name: "",
      },
    ];
    updateGroups(
      groups.map((g, i) => (i === groupIndex ? { ...g, names: nextNames } : g)),
    );
  }

  function updateName(groupIndex: number, nameIndex: number, value: string) {
    const group = groups[groupIndex];
    if (!group) return;
    const nextNames = group.names.map((n, i) =>
      i === nameIndex ? { ...n, name: value } : n,
    );
    updateGroups(
      groups.map((g, i) => (i === groupIndex ? { ...g, names: nextNames } : g)),
    );
  }

  function removeName(groupIndex: number, nameIndex: number) {
    const group = groups[groupIndex];
    if (!group) return;
    const nextNames = group.names.filter((_, i) => i !== nameIndex);
    updateGroups(
      groups.map((g, i) => (i === groupIndex ? { ...g, names: nextNames } : g)),
    );
  }

  function moveName(groupIndex: number, nameIndex: number, direction: -1 | 1) {
    const group = groups[groupIndex];
    if (!group) return;
    const target = nameIndex + direction;
    if (target < 0 || target >= group.names.length) return;
    const nextNames = [...group.names];
    const [moved] = nextNames.splice(nameIndex, 1);
    if (!moved) return;
    nextNames.splice(target, 0, moved);
    updateGroups(
      groups.map((g, i) => (i === groupIndex ? { ...g, names: nextNames } : g)),
    );
  }

  return (
    <EditorShell
      title="Godparents"
      description="List the godparents, sponsors, and mentors blessed to guide the child."
    >
      {groups.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center">
          <p className="text-sm font-medium text-slate-700">No godparent groups yet</p>
          <p className="mt-1 text-xs text-slate-500">
            Add Ninongs and Ninangs to display on the christening website.
          </p>
          <div className="mt-4 flex justify-center gap-2">
            <button
              type="button"
              onClick={() => addGroup("Ninongs (Godfathers)")}
              className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100"
            >
              + Add Ninongs
            </button>
            <button
              type="button"
              onClick={() => addGroup("Ninangs (Godmothers)")}
              className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100"
            >
              + Add Ninangs
            </button>
          </div>
        </div>
      ) : null}

      {groups.map((group, groupIndex) => (
        <EditorGroup
          key={group.id}
          title={group.title || `Group ${groupIndex + 1}`}
        >
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <TextField
                  field={{
                    id: `godparentGroupTitle_${groupIndex}`,
                    label: "Group Title",
                    maxLength: 60,
                    placeholder: "e.g. Ninongs (Godfathers)",
                  }}
                  value={group.title}
                  onChange={(val) => updateGroupTitle(groupIndex, val)}
                />
              </div>
              <button
                type="button"
                onClick={() => removeGroup(groupIndex)}
                className="mt-5 rounded-md px-2.5 py-1.5 text-xs font-medium text-rose-600 hover:bg-rose-50"
              >
                Delete Group
              </button>
            </div>

            <ListBuilder
              addLabel={`Add member to ${group.title || "group"}`}
              onAdd={() => addName(groupIndex)}
            >
              {group.names.map((entry, nameIndex) => (
                <ListBuilderRow
                  key={entry.id}
                  canMoveDown={nameIndex < group.names.length - 1}
                  canMoveUp={nameIndex > 0}
                  hideGripIcon
                  onMoveDown={() => moveName(groupIndex, nameIndex, 1)}
                  onMoveUp={() => moveName(groupIndex, nameIndex, -1)}
                  onRemove={() => removeName(groupIndex, nameIndex)}
                  title={`${entry.name || `Member ${nameIndex + 1}`}`}
                >
                  <TextField
                    field={{
                      id: `godparentName${groupIndex}_${nameIndex}`,
                      label: "Godparent Name",
                      maxLength: 80,
                      placeholder: "e.g. Alexander Morales",
                    }}
                    value={entry.name}
                    onChange={(val) => updateName(groupIndex, nameIndex, val)}
                  />
                </ListBuilderRow>
              ))}
            </ListBuilder>
          </div>
        </EditorGroup>
      ))}

      {groups.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-2">
          <button
            type="button"
            onClick={() => addGroup("Ninongs (Godfathers)")}
            className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100"
          >
            + Add Ninongs Group
          </button>
          <button
            type="button"
            onClick={() => addGroup("Ninangs (Godmothers)")}
            className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100"
          >
            + Add Ninangs Group
          </button>
        </div>
      )}

      <EditorSaveButton {...saveButtonProps} />
    </EditorShell>
  );
}

export function OptionalGalleryPanel({
  onPreviewDraftChange,
  previewDraft,
  saveButtonProps,
}: SharedOptionalPanelProps) {
  const settingsQuery = useDashboardSettingsQuery();
  const messengerUrl = resolveMessengerUrl(settingsQuery.data?.support?.messengerUrl);
  const values = previewDraft.gallery || { sectionIntro: "", sectionTitle: "" };

  function updateValues(fieldId: keyof EventWebsitePreviewDraft["gallery"], value: string) {
    onPreviewDraftChange({
      ...previewDraft,
      gallery: { ...values, [fieldId]: value },
    });
  }

  return (
    <EditorShell
      title="Photo Gallery"
      description="Customize your gallery headings and send your photos to our concierge team for professional formatting and mobile optimization."
    >
      <EditorGroup title="Gallery Header">
        <TextField
          field={{
            id: "galleryTitle",
            label: "Section Title",
            maxLength: 80,
            placeholder: "e.g. Gallery / Photo Highlights",
          }}
          value={values.sectionTitle}
          onChange={(val) => updateValues("sectionTitle", val)}
        />
        <TextAreaField
          field={{
            id: "galleryIntro",
            label: "Section Intro",
            maxLength: 240,
            placeholder: "e.g. A collection of our favorite moments and cherished memories...",
          }}
          value={values.sectionIntro}
          onChange={(val) => updateValues("sectionIntro", val)}
        />
      </EditorGroup>

      <EditorGroup title="Photo Upload & Concierge Setup">
        <div className="rounded-2xl border border-amber-200/80 bg-gradient-to-br from-amber-50/90 via-orange-50/40 to-amber-50/80 p-5 shadow-sm">
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 text-white shadow-sm">
              <Sparkles className="size-4" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-slate-900">Concierge Photo Optimization</h4>
              <span className="inline-flex items-center rounded-md border border-amber-300 bg-amber-100/70 px-2 py-0.5 text-[10px] font-semibold text-amber-800">
                Included in Your Package
              </span>
            </div>
          </div>

          <p className="mt-3 text-xs leading-relaxed text-slate-600">
            To ensure your RSVP website loads blazing fast on mobile phones with zero layout shift, our design team formats, crops, and converts your photos into next-gen WebP formats.
          </p>

          <div className="mt-4 rounded-xl border border-amber-200/70 bg-white/80 p-3.5 space-y-2">
            <p className="text-xs font-semibold text-slate-800">📸 Recommended Photo Guidelines:</p>
            <ul className="text-[11px] text-slate-600 space-y-1 list-disc list-inside">
              <li>Send <strong>6 to 12 high-resolution photos</strong> (prenup, portraits, or memories).</li>
              <li>A mix of portrait (vertical) and landscape (horizontal) orientations works best.</li>
              <li>We will crop, color-balance, and upload them directly to your live website.</li>
            </ul>
          </div>

          <div className="mt-4 pt-1">
            <Button
              asChild
              className="bg-[#0084FF] hover:bg-[#0074E4] text-white font-medium text-xs shadow-sm"
            >
              <a href={messengerUrl} target="_blank" rel="noreferrer">
                <MessageCircle className="size-3.5 mr-1.5" />
                Send Photos via Messenger
                <ArrowUpRight className="size-3.5 ml-1" />
              </a>
            </Button>
          </div>
        </div>
      </EditorGroup>

      <EditorSaveButton {...saveButtonProps} />
    </EditorShell>
  );
}

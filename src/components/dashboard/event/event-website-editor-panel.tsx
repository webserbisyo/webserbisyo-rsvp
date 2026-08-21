"use client";

import { useMemo, useState } from "react";
import {
  EditorSaveButton,
  type EventWebsiteSaveButtonProps,
} from "@/components/dashboard/event/event-website-optional-fields";
import {
  OptionalAttirePanel,
  OptionalContactSocialsPanel,
  OptionalCountdownPanel,
  OptionalDebutCourtPanel,
  OptionalEighteenRosesCandlesPanel,
  OptionalEntouragePanel,
  OptionalExtraInfoPanel,
  OptionalGiftDetailsPanel,
  OptionalGuestbookPanel,
  OptionalLoveStoryPanel,
  OptionalMusicEffectsPanel,
  OptionalPrincipalSponsorsPanel,
  OptionalReceptionPanel,
  OptionalTimelinePanel,
} from "@/components/dashboard/event/event-website-optional-panels";
import {
  createEventWebsiteDraftItemId,
  type EventWebsitePreviewDraft,
} from "@/components/dashboard/event/event-website-preview-data";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  normalizeEventWebsiteEventType,
  type EventWebsiteEventType,
  type EventWebsiteRequiredSectionKey,
  type EventWebsiteSectionDefinition,
  type EventWebsiteSectionKey,
  type ResolvedEventWebsiteSections,
} from "@/config/event-website-sections";
import {
  RSVP_EMAIL_LABEL,
  RSVP_MESSAGE_HELPER,
  RSVP_MESSAGE_LABEL,
  RSVP_MESSAGE_PRIVACY_COPY,
  RSVP_PHONE_LABEL,
} from "@/lib/event-website/rsvp-form-copy";
import type { EventWebsiteGuestbookMessage } from "@/lib/event-website/types";

export type EventWebsiteEditorData = {
  eventContent: {
    contentJson: unknown;
    coupleOrCelebrantNames: string | null;
    heroSubtitle: string | null;
    heroTitle: string | null;
    rsvpNote: string | null;
    scheduleNote: string | null;
    venueNote: string | null;
  } | null;
  eventDate: string | null;
  eventTime: string | null;
  eventType: string | null;
  guestbookMessages: EventWebsiteGuestbookMessage[];
  maxGuestCount: number | null;
  rsvpCloseAt: string | null;
  title: string | null;
  venueAddress: string | null;
  venueName: string | null;
};

type EventWebsiteEditorPanelProps = {
  eventData: EventWebsiteEditorData;
  onPreviewDraftChange: (draft: EventWebsitePreviewDraft) => void;
  previewDraft: EventWebsitePreviewDraft;
  resolvedSections: ResolvedEventWebsiteSections;
  saveButtonProps: EventWebsiteSaveButtonProps;
  selectedSectionId: EventWebsiteSectionKey;
};

type HostInfoModel = {
  description: string;
  displayOptions?: string[];
  fields: FieldConfig[];
  groups: HostGroup[];
  title: string;
};

type HostGroup = {
  fields: string[];
  layout?: "two-column";
  title: string;
};

type FieldConfig = {
  colSpan?: "full" | "half";
  id: string;
  label: string;
  maxLength: number;
  optional?: boolean;
  placeholder?: string;
  showCounter?: boolean;
  showOptionalBadge?: boolean;
  type?: "input" | "select" | "textarea";
};

type TextFieldProps = {
  field: FieldConfig;
  helper?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  inputType?: React.HTMLInputTypeAttribute;
  max?: number;
  min?: number;
  onChange: (value: string) => void;
  value: string;
};

const requiredSectionKeys = new Set<EventWebsiteSectionKey>([
  "host_info",
  "main_event",
  "venue",
  "rsvp_form",
]);

const implementedWeddingOptionalSectionKeys = new Set<EventWebsiteSectionKey>([
  "countdown",
  "secondary_event",
  "timeline_program",
  "entourage",
  "principal_sponsors",
  "story_message",
  "attire_motif",
  "guestbook",
  "gift_details",
  "contact_socials",
  "music_effects",
  "extra_info",
]);

export function EventWebsiteEditorPanel({
  eventData,
  onPreviewDraftChange,
  previewDraft,
  resolvedSections,
  saveButtonProps,
  selectedSectionId,
}: EventWebsiteEditorPanelProps) {
  const selectedSection = useMemo(
    () =>
      [
        ...resolvedSections.requiredSections,
        ...resolvedSections.optionalSections,
        ...resolvedSections.futureDevelopmentSections,
      ].find((section) => section.key === selectedSectionId),
    [resolvedSections, selectedSectionId],
  );

  if (!selectedSection) {
    return (
      <section className="event-website-editor" aria-label="Event Website editor">
        <PlaceholderPanel
          title="Section unavailable"
          description="Select a section from the left pane to continue."
        />
      </section>
    );
  }

  if (selectedSection.comingSoon) {
    return (
      <section className="event-website-editor" aria-label="Event Website editor">
        <PlaceholderPanel
          title={selectedSection.label}
          description="Coming soon. This section will be generated or editable in a later release."
        />
      </section>
    );
  }

  if (!requiredSectionKeys.has(selectedSectionId)) {
    if (["eighteen_roses_candles", "debut_court", "godparents"].includes(selectedSectionId)) {
      return (
        <section className="event-website-editor" aria-label={`${selectedSection.label} editor`}>
          <TargetSpecialSectionForm
            previewDraft={previewDraft}
            sectionId={selectedSectionId as "eighteen_roses_candles" | "debut_court" | "godparents"}
            onPreviewDraftChange={onPreviewDraftChange}
            saveButtonProps={saveButtonProps}
          />
        </section>
      );
    }
    if (
      resolvedSections.eventType === "wedding" &&
      implementedWeddingOptionalSectionKeys.has(selectedSectionId)
    ) {
      return (
        <section className="event-website-editor" aria-label={`${selectedSection.label} editor`}>
          <WeddingOptionalSectionForm
            guestbookMessages={eventData.guestbookMessages}
            previewDraft={previewDraft}
            sectionId={selectedSectionId}
            onPreviewDraftChange={onPreviewDraftChange}
            saveButtonProps={saveButtonProps}
          />
        </section>
      );
    }

    return (
      <section className="event-website-editor" aria-label="Event Website editor">
        <PlaceholderPanel
          title={selectedSection.label}
          description="Optional section editor will be added after required setup."
        />
      </section>
    );
  }

  return (
    <section className="event-website-editor" aria-label={`${selectedSection.label} editor`}>
      <RequiredSectionForm
        key={`${resolvedSections.eventType}-${selectedSectionId}`}
        eventData={eventData}
        eventType={resolvedSections.eventType}
        previewDraft={previewDraft}
        section={selectedSection}
        sectionId={selectedSectionId as EventWebsiteRequiredSectionKey}
        onPreviewDraftChange={onPreviewDraftChange}
        saveButtonProps={saveButtonProps}
      />
    </section>
  );
}

function TargetSpecialSectionForm({
  previewDraft,
  sectionId,
  onPreviewDraftChange,
  saveButtonProps,
}: {
  previewDraft: EventWebsitePreviewDraft;
  sectionId: "eighteen_roses_candles" | "debut_court" | "godparents";
  onPreviewDraftChange: (draft: EventWebsitePreviewDraft) => void;
  saveButtonProps: EventWebsiteSaveButtonProps;
}) {
  const isTraditions = sectionId === "eighteen_roses_candles";
  const section = isTraditions
    ? previewDraft.eighteenRosesCandles
    : sectionId === "debut_court"
      ? previewDraft.debutCourt
      : previewDraft.godparents;
  const title = isTraditions
    ? "18 Traditions"
    : sectionId === "debut_court"
      ? "Debut Court"
      : "Godparents";
  const setSection = (next: typeof section) =>
    onPreviewDraftChange({
      ...previewDraft,
      ...(isTraditions
        ? { eighteenRosesCandles: next }
        : sectionId === "debut_court"
          ? { debutCourt: next }
          : { godparents: next }),
    } as EventWebsitePreviewDraft);
  const addGroup = () =>
    setSection({
      ...section,
      groups: [
        ...section.groups,
        isTraditions
          ? {
              id: createEventWebsiteDraftItemId("tradition"),
              title: "",
              kind: "roses" as const,
              entries: [],
            }
          : { id: createEventWebsiteDraftItemId("group"), title: "", names: [] },
      ],
    } as typeof section);

  return (
    <EditorShell
      title={title}
      description="Add only the groups and people that belong in your celebration."
    >
      <div className="space-y-4">
        {section.groups.map((group, groupIndex) => (
          <div key={group.id} className="space-y-3 rounded-lg border p-3">
            <div className="flex gap-2">
              <Input
                value={group.title}
                placeholder={isTraditions ? "Tradition title" : "Group label"}
                onChange={(event) => {
                  const groups = section.groups.map((item, index) =>
                    index === groupIndex ? { ...item, title: event.target.value } : item,
                  );
                  setSection({ ...section, groups } as typeof section);
                }}
              />
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  setSection({
                    ...section,
                    groups: section.groups.filter((_, index) => index !== groupIndex),
                  } as typeof section)
                }
              >
                Remove
              </Button>
            </div>
            {isTraditions ? (
              <Select
                value={(group as (typeof previewDraft.eighteenRosesCandles.groups)[number]).kind}
                onValueChange={(kind) => {
                  const groups = section.groups.map((item, index) =>
                    index === groupIndex ? { ...item, kind } : item,
                  );
                  setSection({ ...section, groups } as typeof section);
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["roses", "candles", "treasures", "custom"].map((kind) => (
                    <SelectItem key={kind} value={kind}>
                      {kind}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : null}
            {(isTraditions
              ? (group as (typeof previewDraft.eighteenRosesCandles.groups)[number]).entries
              : (group as (typeof previewDraft.debutCourt.groups)[number]).names
            ).map((entry, entryIndex) => (
              <div key={entry.id} className="flex gap-2">
                <Input
                  value={entry.name}
                  placeholder="Name"
                  onChange={(event) => {
                    const groups = section.groups.map((item, index) => {
                      if (index !== groupIndex) return item;
                      if (isTraditions) {
                        const tradition =
                          item as (typeof previewDraft.eighteenRosesCandles.groups)[number];
                        return {
                          ...tradition,
                          entries: tradition.entries.map((value, i) =>
                            i === entryIndex ? { ...value, name: event.target.value } : value,
                          ),
                        };
                      }
                      const namedGroup = item as (typeof previewDraft.debutCourt.groups)[number];
                      return {
                        ...namedGroup,
                        names: namedGroup.names.map((value, i) =>
                          i === entryIndex ? { ...value, name: event.target.value } : value,
                        ),
                      };
                    });
                    setSection({ ...section, groups } as typeof section);
                  }}
                />
                {isTraditions ? (
                  <Input
                    value={
                      (
                        entry as (typeof previewDraft.eighteenRosesCandles.groups)[number]["entries"][number]
                      ).message
                    }
                    placeholder="Optional message"
                    onChange={(event) => {
                      const groups = section.groups.map((item, index) =>
                        index === groupIndex
                          ? {
                              ...item,
                              entries: (
                                item as (typeof previewDraft.eighteenRosesCandles.groups)[number]
                              ).entries.map((value, i) =>
                                i === entryIndex
                                  ? { ...value, message: event.target.value }
                                  : value,
                              ),
                            }
                          : item,
                      );
                      setSection({ ...section, groups } as typeof section);
                    }}
                  />
                ) : null}
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    const groups = section.groups.map((item, index) =>
                      index === groupIndex
                        ? isTraditions
                          ? {
                              ...item,
                              entries: (
                                item as (typeof previewDraft.eighteenRosesCandles.groups)[number]
                              ).entries.filter((_, i) => i !== entryIndex),
                            }
                          : {
                              ...item,
                              names: (
                                item as (typeof previewDraft.debutCourt.groups)[number]
                              ).names.filter((_, i) => i !== entryIndex),
                            }
                        : item,
                    );
                    setSection({ ...section, groups } as typeof section);
                  }}
                >
                  ×
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                const groups = section.groups.map((item, index) =>
                  index === groupIndex
                    ? isTraditions
                      ? {
                          ...item,
                          entries: [
                            ...(item as (typeof previewDraft.eighteenRosesCandles.groups)[number])
                              .entries,
                            {
                              id: createEventWebsiteDraftItemId("tradition-entry"),
                              name: "",
                              message: "",
                            },
                          ],
                        }
                      : {
                          ...item,
                          names: [
                            ...(item as (typeof previewDraft.debutCourt.groups)[number]).names,
                            { id: createEventWebsiteDraftItemId("named-entry"), name: "" },
                          ],
                        }
                    : item,
                );
                setSection({ ...section, groups } as typeof section);
              }}
            >
              Add person
            </Button>
          </div>
        ))}
        <Button type="button" variant="outline" onClick={addGroup}>
          Add group
        </Button>
      </div>
      <EditorSaveButton {...saveButtonProps} />
    </EditorShell>
  );
}

function RequiredSectionForm({
  eventData,
  eventType,
  onPreviewDraftChange,
  previewDraft,
  section,
  sectionId,
  saveButtonProps,
}: {
  eventData: EventWebsiteEditorData;
  eventType: EventWebsiteEventType | "generic";
  onPreviewDraftChange: (draft: EventWebsitePreviewDraft) => void;
  previewDraft: EventWebsitePreviewDraft;
  section: EventWebsiteSectionDefinition;
  sectionId: EventWebsiteRequiredSectionKey;
  saveButtonProps: EventWebsiteSaveButtonProps;
}) {
  if (sectionId === "host_info") {
    return (
      <HostInfoForm
        eventData={eventData}
        eventType={eventType}
        previewDraft={previewDraft}
        onPreviewDraftChange={onPreviewDraftChange}
        saveButtonProps={saveButtonProps}
      />
    );
  }

  if (sectionId === "main_event") {
    return (
      <MainEventForm
        eventData={eventData}
        eventType={eventType}
        previewDraft={previewDraft}
        section={section}
        onPreviewDraftChange={onPreviewDraftChange}
        saveButtonProps={saveButtonProps}
      />
    );
  }

  if (sectionId === "venue") {
    return (
      <VenueForm
        previewDraft={previewDraft}
        section={section}
        onPreviewDraftChange={onPreviewDraftChange}
        saveButtonProps={saveButtonProps}
      />
    );
  }

  return (
    <RsvpFormConfigPanel
      previewDraft={previewDraft}
      section={section}
      onPreviewDraftChange={onPreviewDraftChange}
      saveButtonProps={saveButtonProps}
    />
  );
}

function WeddingOptionalSectionForm({
  guestbookMessages,
  onPreviewDraftChange,
  previewDraft,
  saveButtonProps,
  sectionId,
}: {
  guestbookMessages: EventWebsiteGuestbookMessage[];
  onPreviewDraftChange: (draft: EventWebsitePreviewDraft) => void;
  previewDraft: EventWebsitePreviewDraft;
  saveButtonProps: EventWebsiteSaveButtonProps;
  sectionId: EventWebsiteSectionKey;
}) {
  if (sectionId === "countdown") {
    return (
      <OptionalCountdownPanel
        previewDraft={previewDraft}
        onPreviewDraftChange={onPreviewDraftChange}
        saveButtonProps={saveButtonProps}
      />
    );
  }

  if (sectionId === "secondary_event") {
    return (
      <OptionalReceptionPanel
        previewDraft={previewDraft}
        onPreviewDraftChange={onPreviewDraftChange}
        saveButtonProps={saveButtonProps}
      />
    );
  }

  if (sectionId === "timeline_program") {
    return (
      <OptionalTimelinePanel
        previewDraft={previewDraft}
        onPreviewDraftChange={onPreviewDraftChange}
        saveButtonProps={saveButtonProps}
      />
    );
  }

  if (sectionId === "entourage") {
    return (
      <OptionalEntouragePanel
        previewDraft={previewDraft}
        onPreviewDraftChange={onPreviewDraftChange}
        saveButtonProps={saveButtonProps}
      />
    );
  }

  if (sectionId === "principal_sponsors") {
    return (
      <OptionalPrincipalSponsorsPanel
        previewDraft={previewDraft}
        onPreviewDraftChange={onPreviewDraftChange}
        saveButtonProps={saveButtonProps}
      />
    );
  }

  if (sectionId === "story_message") {
    return (
      <OptionalLoveStoryPanel
        previewDraft={previewDraft}
        onPreviewDraftChange={onPreviewDraftChange}
        saveButtonProps={saveButtonProps}
      />
    );
  }

  if (sectionId === "attire_motif") {
    return (
      <OptionalAttirePanel
        previewDraft={previewDraft}
        onPreviewDraftChange={onPreviewDraftChange}
        saveButtonProps={saveButtonProps}
      />
    );
  }

  if (sectionId === "guestbook") {
    return (
      <OptionalGuestbookPanel
        guestbookMessages={guestbookMessages}
        previewDraft={previewDraft}
        onPreviewDraftChange={onPreviewDraftChange}
        saveButtonProps={saveButtonProps}
      />
    );
  }

  if (sectionId === "gift_details") {
    return (
      <OptionalGiftDetailsPanel
        previewDraft={previewDraft}
        onPreviewDraftChange={onPreviewDraftChange}
        saveButtonProps={saveButtonProps}
      />
    );
  }

  if (sectionId === "contact_socials") {
    return (
      <OptionalContactSocialsPanel
        previewDraft={previewDraft}
        onPreviewDraftChange={onPreviewDraftChange}
        saveButtonProps={saveButtonProps}
      />
    );
  }

  if (sectionId === "music_effects") {
    return (
      <OptionalMusicEffectsPanel
        previewDraft={previewDraft}
        onPreviewDraftChange={onPreviewDraftChange}
        saveButtonProps={saveButtonProps}
      />
    );
  }

  if (sectionId === "extra_info") {
    return (
      <OptionalExtraInfoPanel
        previewDraft={previewDraft}
        onPreviewDraftChange={onPreviewDraftChange}
        saveButtonProps={saveButtonProps}
      />
    );
  }

  if (sectionId === "eighteen_roses_candles") {
    return (
      <OptionalEighteenRosesCandlesPanel
        previewDraft={previewDraft}
        onPreviewDraftChange={onPreviewDraftChange}
        saveButtonProps={saveButtonProps}
      />
    );
  }

  if (sectionId === "debut_court") {
    return (
      <OptionalDebutCourtPanel
        previewDraft={previewDraft}
        onPreviewDraftChange={onPreviewDraftChange}
        saveButtonProps={saveButtonProps}
      />
    );
  }

  return (
    <PlaceholderPanel
      title="Section unavailable"
      description="Optional section editor will be added after required setup."
    />
  );
}

function HostInfoForm({
  eventData,
  eventType,
  onPreviewDraftChange,
  previewDraft,
  saveButtonProps,
}: {
  eventData: EventWebsiteEditorData;
  eventType: EventWebsiteEventType | "generic";
  onPreviewDraftChange: (draft: EventWebsitePreviewDraft) => void;
  previewDraft: EventWebsitePreviewDraft;
  saveButtonProps: EventWebsiteSaveButtonProps;
}) {
  const model = getHostInfoModel(eventType);
  const isWedding = normalizeEventWebsiteEventType(eventType) === "wedding";
  const values = previewDraft.hostInfo as unknown as Record<string, string>;
  const displayOptions = isWedding
    ? getWeddingDisplayOptions(values.groomName, values.brideName)
    : model.displayOptions;

  function updateHostValue(fieldId: string, value: string) {
    const updateValues = (current: Record<string, string>) => {
      const next = { ...current, [fieldId]: value };

      if (isWedding && (fieldId === "groomName" || fieldId === "brideName")) {
        const currentTemplate = getWeddingDisplayTemplate(
          current.displayAs,
          current.groomName,
          current.brideName,
        );
        const nextOptions = getWeddingDisplayOptions(next.groomName, next.brideName);

        next.displayAs =
          currentTemplate !== null
            ? (nextOptions[currentTemplate] ?? nextOptions[0] ?? "")
            : next.displayAs || nextOptions[0] || "";
      }

      return next;
    };

    const nextValues = updateValues(values);
    onPreviewDraftChange({
      ...previewDraft,
      hostInfo: { ...previewDraft.hostInfo, ...nextValues } as typeof previewDraft.hostInfo,
      ...(isWedding
        ? {
            coupleInfo: {
              brideName: nextValues.brideName ?? "",
              displayAs: nextValues.displayAs ?? "",
              groomName: nextValues.groomName ?? "",
              hostLine: nextValues.hostLine ?? "",
              shortHostMessage: nextValues.shortHostMessage ?? "",
            },
          }
        : {}),
    });
  }

  return (
    <EditorShell title={model.title} description={model.description}>
      {model.groups.map((group) => (
        <EditorGroup key={group.title} title={group.title} layout={group.layout}>
          {group.fields.map((fieldId) => {
            const field = model.fields.find((item) => item.id === fieldId);
            if (!field) {
              return null;
            }

            if (field.type === "select" && displayOptions) {
              return (
                <SelectField
                  key={field.id}
                  field={field}
                  options={displayOptions}
                  value={
                    displayOptions.includes(values[field.id] ?? "")
                      ? (values[field.id] ?? "")
                      : displayOptions[0] || ""
                  }
                  onChange={(value) => updateHostValue(field.id, value)}
                />
              );
            }

            if (field.type === "textarea") {
              return (
                <TextAreaField
                  key={field.id}
                  field={field}
                  value={values[field.id] ?? ""}
                  onChange={(value) => updateHostValue(field.id, value)}
                />
              );
            }

            return (
              <TextField
                key={field.id}
                field={field}
                value={values[field.id] ?? ""}
                onChange={(value) => updateHostValue(field.id, value)}
              />
            );
          })}
        </EditorGroup>
      ))}
      <EditorSaveButton {...saveButtonProps} />
    </EditorShell>
  );
}

function MainEventForm({
  eventData,
  eventType,
  onPreviewDraftChange,
  previewDraft,
  saveButtonProps,
  section,
}: {
  eventData: EventWebsiteEditorData;
  eventType: EventWebsiteEventType | "generic";
  onPreviewDraftChange: (draft: EventWebsitePreviewDraft) => void;
  previewDraft: EventWebsitePreviewDraft;
  saveButtonProps: EventWebsiteSaveButtonProps;
  section: EventWebsiteSectionDefinition;
}) {
  const model = getMainEventModel(eventType, section.label);
  const values = previewDraft.ceremony;

  function updateMainEventValue(
    fieldId: keyof EventWebsitePreviewDraft["ceremony"],
    value: string,
  ) {
    onPreviewDraftChange({
      ...previewDraft,
      ceremony: { ...previewDraft.ceremony, [fieldId]: value },
    });
  }

  return (
    <EditorShell title={model.title} description={model.description}>
      <EditorGroup title="Main Schedule" layout="two-column">
        <TextField
          field={{ colSpan: "full", id: "eventLabel", label: model.labelField, maxLength: 80 }}
          value={values.eventLabel}
          onChange={(value) => updateMainEventValue("eventLabel", value)}
        />
        <DateField
          field={{
            colSpan: "half",
            id: "eventDate",
            label: "Date",
            maxLength: 10,
            showCounter: false,
          }}
          value={values.eventDate}
          onChange={(value) => updateMainEventValue("eventDate", value)}
        />
        <TimeField
          field={{
            colSpan: "half",
            id: "eventTime",
            label: "Start Time",
            maxLength: 8,
            showCounter: false,
          }}
          value={values.eventTime}
          onChange={(value) => updateMainEventValue("eventTime", value)}
        />
        <TimeField
          field={{
            colSpan: "half",
            id: "endTime",
            label: "End Time",
            maxLength: 8,
            showCounter: false,
          }}
          value={values.endTime}
          onChange={(value) => updateMainEventValue("endTime", value)}
        />
        <TextField
          field={{
            colSpan: "half",
            id: "rsvpDeadline",
            label: "RSVP Deadline",
            maxLength: 16,
            showCounter: false,
          }}
          inputType="datetime-local"
          value={values.rsvpDeadline}
          onChange={(value) => updateMainEventValue("rsvpDeadline", value)}
        />
        <TextAreaField
          field={{ colSpan: "full", id: "scheduleNote", label: "Schedule Note", maxLength: 200 }}
          value={values.scheduleNote}
          onChange={(value) => updateMainEventValue("scheduleNote", value)}
        />
      </EditorGroup>
      <EditorSaveButton {...saveButtonProps} />
    </EditorShell>
  );
}

function VenueForm({
  onPreviewDraftChange,
  previewDraft,
  saveButtonProps,
  section,
}: {
  onPreviewDraftChange: (draft: EventWebsitePreviewDraft) => void;
  previewDraft: EventWebsitePreviewDraft;
  saveButtonProps: EventWebsiteSaveButtonProps;
  section: EventWebsiteSectionDefinition;
}) {
  const values = previewDraft.venue;

  function updateVenueValue(fieldId: keyof EventWebsitePreviewDraft["venue"], value: string) {
    onPreviewDraftChange({
      ...previewDraft,
      venue: { ...previewDraft.venue, [fieldId]: value },
    });
  }

  return (
    <EditorShell
      title={section.label}
      description="Set the main location guests need to find for your event."
    >
      <EditorGroup title="Location Details">
        <TextField
          field={{
            colSpan: "full",
            id: "venueName",
            label: "Venue Name",
            maxLength: 80,
            placeholder: "e.g. The Ruins, Bacolod",
          }}
          value={values.venueName}
          onChange={(value) => updateVenueValue("venueName", value)}
        />
        <TextAreaField
          field={{
            colSpan: "full",
            id: "address",
            label: "Full Address",
            maxLength: 180,
            placeholder: "Street, city, province...",
          }}
          value={values.address}
          onChange={(value) => updateVenueValue("address", value)}
        />
        <TextField
          field={{
            colSpan: "full",
            id: "mapsLink",
            label: "Google Maps Link",
            maxLength: 200,
            placeholder: "Paste map URL here",
          }}
          inputType="url"
          value={values.mapsLink}
          onChange={(value) => updateVenueValue("mapsLink", value)}
        />
        <TextAreaField
          field={{
            colSpan: "full",
            id: "arrivalNote",
            label: "Arrival / Landmark Note",
            maxLength: 160,
            placeholder: "e.g. Parking available near the entrance...",
          }}
          value={values.arrivalNote}
          onChange={(value) => updateVenueValue("arrivalNote", value)}
        />
      </EditorGroup>
      <EditorSaveButton {...saveButtonProps} />
    </EditorShell>
  );
}

function RsvpFormConfigPanel({
  onPreviewDraftChange,
  previewDraft,
  saveButtonProps,
  section,
}: {
  onPreviewDraftChange: (draft: EventWebsitePreviewDraft) => void;
  previewDraft: EventWebsitePreviewDraft;
  saveButtonProps: EventWebsiteSaveButtonProps;
  section: EventWebsiteSectionDefinition;
}) {
  const rsvpValues = previewDraft.rsvpForm;
  const savedCustomQuestionCount = rsvpValues.customQuestions.length;

  function updateRsvpValue(
    fieldId: keyof EventWebsitePreviewDraft["rsvpForm"],
    value: boolean | string | EventWebsitePreviewDraft["rsvpForm"]["customQuestions"],
  ) {
    onPreviewDraftChange({
      ...previewDraft,
      rsvpForm: { ...rsvpValues, [fieldId]: value },
    });
  }

  const plusOneEnabled = rsvpValues.plusOneEnabled;
  const companionNameEnabled = rsvpValues.companionNameEnabled;
  const companionAgeEnabled = rsvpValues.companionAgeEnabled;
  const foodAllergiesEnabled = rsvpValues.foodAllergiesEnabled;
  const phoneEnabled = rsvpValues.phoneEnabled;

  return (
    <EditorShell
      title={section.label}
      description="Choose the basic questions guests will answer when they RSVP."
    >
      <EditorGroup title="RSVP Fields">
        <AlwaysOnRow title="Guest Name" description="Required · always included" />
        <AlwaysOnRow title={RSVP_EMAIL_LABEL} description="Required · always included" />
        <AlwaysOnRow title="Attendance" description="Required · attending or not attending" />
        <ToggleRow
          title={RSVP_PHONE_LABEL}
          description="Optional contact field"
          checked={phoneEnabled}
          onCheckedChange={(checked) => updateRsvpValue("phoneEnabled", checked)}
        />
        <ToggleRow
          title="Plus-one / Guest Count"
          description="Lets guests add one companion; party size counts automatically"
          checked={plusOneEnabled}
          onCheckedChange={(checked) => updateRsvpValue("plusOneEnabled", checked)}
        />
        {plusOneEnabled ? (
          <div className="event-editor-nested-settings">
            <TextField
              field={{
                id: "companionLimit",
                label: "Maximum Companions Allowed",
                maxLength: 2,
                showCounter: false,
              }}
              inputMode="numeric"
              inputType="number"
              max={10}
              min={1}
              value={rsvpValues.companionLimit}
              helper="Guests can choose any number of companions up to this limit."
              onChange={(value) => updateRsvpValue("companionLimit", value)}
            />
            <ToggleRow
              title="Companion Name"
              description="Ask for the companion name when guest count is enabled"
              checked={companionNameEnabled}
              onCheckedChange={(checked) => updateRsvpValue("companionNameEnabled", checked)}
            />
            <ToggleRow
              title="Companion Age"
              description="Useful for children or age-based planning."
              checked={companionAgeEnabled}
              onCheckedChange={(checked) => updateRsvpValue("companionAgeEnabled", checked)}
            />
          </div>
        ) : null}
        <ToggleRow
          title="Food Allergies / Dietary Restrictions"
          description="Ask guests to mention allergies or dietary restrictions"
          checked={foodAllergiesEnabled}
          onCheckedChange={(checked) => updateRsvpValue("foodAllergiesEnabled", checked)}
        />
        <AlwaysOnRow
          title={RSVP_MESSAGE_LABEL}
          description="Optional for guests · always included"
        />
        <div className="rounded-2xl border border-dashed border-[#e3d4c9] bg-[#fffaf7] px-4 py-4 text-sm text-[#7c5f54]">
          <p className="font-medium text-[#4e342b]">{RSVP_MESSAGE_HELPER}</p>
          <p className="mt-1">{RSVP_MESSAGE_PRIVACY_COPY}</p>
        </div>
        <div className="rounded-2xl border border-dashed border-[#e3d4c9] bg-[#fffaf7] px-4 py-4 text-sm text-[#7c5f54]">
          <p className="font-medium text-[#4e342b]">Custom questions are coming soon.</p>
          <p className="mt-1">
            Public RSVP submission does not support custom question answers for launch, so this
            section is hidden for guests.
          </p>
          {savedCustomQuestionCount > 0 ? (
            <p className="mt-2 text-xs text-[#946d5e]">
              {savedCustomQuestionCount} saved custom{" "}
              {savedCustomQuestionCount === 1 ? "question remains" : "questions remain"} hidden from
              guests until full submission support is added.
            </p>
          ) : null}
        </div>
      </EditorGroup>
      <EditorSaveButton {...saveButtonProps} />
    </EditorShell>
  );
}

function EditorShell({
  children,
  description,
  title,
}: {
  children: React.ReactNode;
  description: string;
  title: string;
}) {
  return (
    <div className="event-editor-card">
      <header className="event-editor-header">
        <h1>{title}</h1>
        <p>{description}</p>
      </header>
      <div className="event-editor-body">{children}</div>
    </div>
  );
}

function EditorGroup({
  children,
  layout,
  title,
}: {
  children: React.ReactNode;
  layout?: HostGroup["layout"];
  title: string;
}) {
  return (
    <section className="event-editor-group-card">
      <h2>{title}</h2>
      <FieldGrid layout={layout}>{children}</FieldGrid>
    </section>
  );
}

function FieldGrid({
  children,
  layout,
}: {
  children: React.ReactNode;
  layout?: HostGroup["layout"];
}) {
  return (
    <div className={`event-editor-fields${layout ? ` event-editor-fields--${layout}` : ""}`}>
      {children}
    </div>
  );
}

function FieldShell({
  children,
  field,
  helper,
  value,
}: {
  children: React.ReactNode;
  field: FieldConfig;
  helper?: string;
  value: string;
}) {
  const id = `event-editor-${field.id}`;

  return (
    <div className={`event-editor-field event-editor-field--${field.colSpan ?? "full"}`}>
      <div className="event-editor-label-row">
        <Label htmlFor={id}>{field.label}</Label>
        {field.optional && field.showOptionalBadge ? (
          <span className="event-editor-optional-badge">Optional</span>
        ) : null}
      </div>
      {children}
      <div className="event-editor-meta-row">
        {helper ? <p className="event-editor-helper">{helper}</p> : <span />}
        {field.showCounter === false ? null : (
          <span className="event-editor-counter">
            {value.length}/{field.maxLength}
          </span>
        )}
      </div>
    </div>
  );
}

function TextField({
  field,
  helper,
  inputMode,
  inputType = "text",
  max,
  min,
  onChange,
  value,
}: TextFieldProps) {
  const id = `event-editor-${field.id}`;

  return (
    <FieldShell field={field} helper={helper} value={value}>
      <Input
        id={id}
        className="event-editor-input"
        inputMode={inputMode}
        max={max}
        maxLength={field.maxLength}
        min={min}
        placeholder={field.placeholder}
        type={inputType}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </FieldShell>
  );
}

function DateField(props: Omit<TextFieldProps, "inputType">) {
  return <TextField {...props} inputType="date" />;
}

function TimeField(props: Omit<TextFieldProps, "inputType">) {
  return <TextField {...props} inputType="time" />;
}

function TextAreaField({
  field,
  onChange,
  value,
}: {
  field: FieldConfig;
  onChange: (value: string) => void;
  value: string;
}) {
  const id = `event-editor-${field.id}`;

  return (
    <FieldShell field={field} value={value}>
      <Textarea
        id={id}
        className="event-editor-textarea"
        maxLength={field.maxLength}
        placeholder={field.placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </FieldShell>
  );
}

function SelectField({
  field,
  onChange,
  options,
  value,
}: {
  field: FieldConfig;
  onChange: (value: string) => void;
  options: string[];
  value: string;
}) {
  const id = `event-editor-${field.id}`;

  return (
    <FieldShell field={field} value={value}>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger id={id} className="event-editor-select-trigger">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option} value={option}>
              {option}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </FieldShell>
  );
}

function AlwaysOnRow({ description, title }: { description: string; title: string }) {
  return (
    <div className="event-editor-rsvp-row">
      <span>
        <strong>{title}</strong>
        <small>{description}</small>
      </span>
      <Badge variant="outline" className="event-editor-on-badge">
        On
      </Badge>
    </div>
  );
}

function ToggleRow({
  checked,
  description,
  onCheckedChange,
  title,
}: {
  checked: boolean;
  description: string;
  onCheckedChange: (checked: boolean) => void;
  title: string;
}) {
  return (
    <div className="event-editor-rsvp-row">
      <span>
        <strong>{title}</strong>
        <small>{description}</small>
      </span>
      <Switch
        className="dashboard-toggle event-editor-switch"
        checked={checked}
        onCheckedChange={onCheckedChange}
        aria-label={`Toggle ${title}`}
      />
    </div>
  );
}

function PlaceholderPanel({ description, title }: { description: string; title: string }) {
  return (
    <div className="event-editor-card event-editor-card--placeholder">
      <header className="event-editor-header">
        <h1>{title}</h1>
        <p>{description}</p>
      </header>
    </div>
  );
}

function getHostInfoModel(eventType: EventWebsiteEventType | "generic"): HostInfoModel {
  const currentEventType = normalizeEventWebsiteEventType(eventType);
  const baseHostMessage: FieldConfig[] = [
    { id: "hostLine", label: "Host Line", maxLength: 120 },
    { id: "shortHostMessage", label: "Short Host Message", maxLength: 160, type: "textarea" },
  ];

  if (currentEventType === "wedding") {
    const groom = "Juan";
    const bride = "Maria";
    return {
      description: "Set the names and short host message shown on the RSVP website.",
      displayOptions: [
        `${groom} & ${bride}`,
        `${groom} and ${bride}`,
        `${groom} ❤️ ${bride}`,
        `🤵 ${groom} & 👰 ${bride}`,
        `${groom} + ${bride}`,
      ],
      fields: [
        {
          colSpan: "half",
          id: "groomName",
          label: "Groom's Name",
          maxLength: 40,
          placeholder: "Juan",
        },
        {
          colSpan: "half",
          id: "brideName",
          label: "Bride's Name",
          maxLength: 40,
          placeholder: "Maria",
        },
        { colSpan: "full", id: "displayAs", label: "Display As", maxLength: 80, type: "select" },
        ...baseHostMessage,
      ],
      groups: [
        { title: "Names", fields: ["groomName", "brideName", "displayAs"], layout: "two-column" },
        { title: "Host Message", fields: ["hostLine", "shortHostMessage"] },
      ],
      title: "Couple Info",
    };
  }

  if (currentEventType === "birthday") {
    return {
      description: "Set the celebrant name and short host message shown on the RSVP website.",
      fields: [
        {
          id: "celebrantName",
          label: "Celebrant Name",
          maxLength: 60,
          placeholder: "Celebrant name",
        },
        {
          id: "milestone",
          label: "Age / Milestone",
          maxLength: 40,
          optional: true,
          placeholder: "e.g. 7th Birthday",
        },
        { id: "displayAs", label: "Display As", maxLength: 80, placeholder: "e.g. Sofia turns 7" },
        ...baseHostMessage,
      ],
      groups: [
        { title: "Celebrant", fields: ["celebrantName", "milestone", "displayAs"] },
        { title: "Host Message", fields: ["hostLine", "shortHostMessage"] },
      ],
      title: "Celebrant Info",
    };
  }

  if (currentEventType === "debut") {
    return {
      description: "Set the debutant name and short host message shown on the RSVP website.",
      fields: [
        { id: "debutantName", label: "Debutant Name", maxLength: 60, placeholder: "Debutant name" },
        {
          id: "milestone",
          label: "Age / Milestone",
          maxLength: 40,
          optional: true,
          placeholder: "18th Birthday",
        },
        { id: "displayAs", label: "Display As", maxLength: 80, placeholder: "e.g. Sofia's Debut" },
        ...baseHostMessage,
      ],
      groups: [
        { title: "Debutant", fields: ["debutantName", "milestone", "displayAs"] },
        { title: "Host Message", fields: ["hostLine", "shortHostMessage"] },
      ],
      title: "Debutant Info",
    };
  }

  if (currentEventType === "baptism") {
    return {
      description: "Set the child and parent details shown on the RSVP website.",
      fields: [
        { id: "childName", label: "Child's Name", maxLength: 60, placeholder: "Child's name" },
        {
          id: "parentNames",
          label: "Parent / Guardian Names",
          maxLength: 120,
          optional: true,
          placeholder: "Parent or guardian names",
        },
        {
          id: "displayAs",
          label: "Display As",
          maxLength: 80,
          placeholder: "e.g. Sofia's Christening",
        },
        ...baseHostMessage,
      ],
      groups: [
        { title: "Child Details", fields: ["childName", "parentNames", "displayAs"] },
        { title: "Host Message", fields: ["hostLine", "shortHostMessage"] },
      ],
      title: "Child & Parents",
    };
  }

  if (currentEventType === "anniversary") {
    return {
      description: "Set the names and short host message shown on the RSVP website.",
      fields: [
        { id: "partnerOne", label: "Partner One", maxLength: 40 },
        { id: "partnerTwo", label: "Partner Two", maxLength: 40 },
        { id: "displayAs", label: "Display As", maxLength: 80 },
        ...baseHostMessage,
      ],
      groups: [
        { title: "Names", fields: ["partnerOne", "partnerTwo", "displayAs"] },
        { title: "Host Message", fields: ["hostLine", "shortHostMessage"] },
      ],
      title: "Couple Info",
    };
  }

  if (currentEventType === "corporate") {
    return {
      description: "Set the organizer details shown on the RSVP website.",
      fields: [
        { id: "organizerName", label: "Company / Organizer Name", maxLength: 80 },
        { id: "contactPerson", label: "Contact Person", maxLength: 60, optional: true },
        { id: "displayAs", label: "Display As", maxLength: 80 },
        ...baseHostMessage,
      ],
      groups: [
        { title: "Organizer", fields: ["organizerName", "contactPerson", "displayAs"] },
        { title: "Host Message", fields: ["hostLine", "shortHostMessage"] },
      ],
      title: "Organizer Info",
    };
  }

  return {
    description: "Set the host name and short host message shown on the RSVP website.",
    fields: [
      { id: "hostName", label: "Host / Celebrant Name", maxLength: 80 },
      { id: "displayAs", label: "Display As", maxLength: 80 },
      ...baseHostMessage,
    ],
    groups: [
      { title: "Host", fields: ["hostName", "displayAs"] },
      { title: "Host Message", fields: ["hostLine", "shortHostMessage"] },
    ],
    title: "Host Info",
  };
}

function buildInitialHostValues(model: HostInfoModel, eventData: EventWebsiteEditorData) {
  const names = eventData.eventContent?.coupleOrCelebrantNames ?? eventData.title ?? "";
  const initialValues: Record<string, string> = {};

  for (const field of model.fields) {
    if (field.id === "displayAs") {
      initialValues[field.id] = model.displayOptions?.[0] ?? names;
    } else if (field.id === "milestone" && model.title === "Debutant Info") {
      initialValues[field.id] = "18";
    } else if (field.id === "hostLine") {
      initialValues[field.id] = eventData.eventContent?.heroTitle ?? "";
    } else if (field.id === "shortHostMessage") {
      initialValues[field.id] = eventData.eventContent?.heroSubtitle ?? "";
    } else if (
      field.id === "celebrantName" ||
      field.id === "debutantName" ||
      field.id === "childName" ||
      field.id === "organizerName" ||
      field.id === "hostName"
    ) {
      initialValues[field.id] = names;
    } else {
      initialValues[field.id] = "";
    }
  }

  return initialValues;
}

function getWeddingDisplayNames(groomName: string | undefined, brideName: string | undefined) {
  const groom = groomName?.trim() || "Juan";
  const bride = brideName?.trim() || "Maria";

  return { bride, groom };
}

function getWeddingDisplayOptions(groomName: string | undefined, brideName: string | undefined) {
  const { bride, groom } = getWeddingDisplayNames(groomName, brideName);

  return [
    `${groom} & ${bride}`,
    `${groom} and ${bride}`,
    `${groom} ❤️ ${bride}`,
    `🤵 ${groom} & 👰 ${bride}`,
    `${groom} + ${bride}`,
  ];
}

function getWeddingDisplayTemplate(
  displayAs: string | undefined,
  groomName: string | undefined,
  brideName: string | undefined,
) {
  const options = getWeddingDisplayOptions(groomName, brideName);
  const index = options.indexOf(displayAs ?? "");

  return index >= 0 ? index : null;
}

function getMainEventModel(eventType: EventWebsiteEventType | "generic", title: string) {
  const currentEventType = normalizeEventWebsiteEventType(eventType);

  if (currentEventType === "wedding") {
    return {
      defaultEndTime: "18:00",
      defaultLabel: "Wedding Ceremony",
      defaultScheduleNote: "Please arrive at least 15 minutes before the ceremony starts.",
      defaultStartTime: "16:00",
      description: "Set the official date, time, and short schedule note for guests.",
      labelField: "Ceremony Label",
      title,
    };
  }

  if (currentEventType === "birthday") {
    return {
      defaultEndTime: "17:00",
      defaultLabel: "Birthday Celebration",
      defaultScheduleNote: "Please arrive at least 15 minutes before the celebration starts.",
      defaultStartTime: "15:00",
      description: "Set the official date, time, and short schedule note for guests.",
      labelField: "Celebration Label",
      title,
    };
  }

  if (currentEventType === "debut") {
    return {
      defaultEndTime: "18:00",
      defaultLabel: "Debut Program",
      defaultScheduleNote: "Please arrive at least 15 minutes before the program starts.",
      defaultStartTime: "16:00",
      description: "Set the official date, time, and short schedule note for guests.",
      labelField: "Program Label",
      title,
    };
  }

  if (currentEventType === "baptism") {
    return {
      defaultEndTime: "12:00",
      defaultLabel: "Baptism Ceremony",
      defaultScheduleNote: "Please arrive at least 15 minutes before the ceremony starts.",
      defaultStartTime: "10:00",
      description: "Set the official date, time, and short schedule note for guests.",
      labelField: "Ceremony Label",
      title,
    };
  }

  if (currentEventType === "corporate") {
    return {
      defaultEndTime: "11:00",
      defaultLabel: "Main Session",
      defaultScheduleNote: "Please arrive at least 15 minutes before the session starts.",
      defaultStartTime: "09:00",
      description: "Set the official session date, time, and schedule note for guests.",
      labelField: "Session Label",
      title,
    };
  }

  return {
    defaultEndTime: "17:00",
    defaultLabel: title,
    defaultScheduleNote: "Please arrive at least 15 minutes before the event starts.",
    defaultStartTime: "15:00",
    description: "Set the official date, time, and short schedule note for guests.",
    labelField: "Event Label",
    title,
  };
}

function formatTime(value: string | null) {
  return value ? value.slice(0, 5) : "";
}

function formatDateTimeLocal(value: string | null) {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const offsetMs = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16);
}

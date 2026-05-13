"use client";

import { Dialog as DialogPrimitive } from "radix-ui";
import { useMemo, useState } from "react";
import { Plus, Trash2, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils/index";
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

type EventWebsiteEditorData = {
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
  maxGuestCount: number | null;
  rsvpCloseAt: string | null;
  title: string | null;
  venueAddress: string | null;
  venueName: string | null;
};

type EventWebsiteEditorPanelProps = {
  eventData: EventWebsiteEditorData;
  resolvedSections: ResolvedEventWebsiteSections;
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

type CustomQuestion = {
  fieldType: string;
  label: string;
  options: string[];
  required: boolean;
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

const defaultCustomQuestionFieldType = "Short text";

const customQuestionFieldTypes = [
  "Short text",
  "Long text",
  "Number",
  "Yes / No",
  "Single choice",
  "Multiple choice",
];

const defaultCustomQuestionOptions = ["Option 1", "Option 2"];
const maxCustomQuestions = 10;
const maxCustomQuestionOptions = 12;

const requiredSectionKeys = new Set<EventWebsiteSectionKey>([
  "host_info",
  "main_event",
  "venue",
  "rsvp_form",
]);

export function EventWebsiteEditorPanel({
  eventData,
  resolvedSections,
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
        section={selectedSection}
        sectionId={selectedSectionId as EventWebsiteRequiredSectionKey}
      />
    </section>
  );
}

function RequiredSectionForm({
  eventData,
  eventType,
  section,
  sectionId,
}: {
  eventData: EventWebsiteEditorData;
  eventType: EventWebsiteEventType | "generic";
  section: EventWebsiteSectionDefinition;
  sectionId: EventWebsiteRequiredSectionKey;
}) {
  if (sectionId === "host_info") {
    return <HostInfoForm eventData={eventData} eventType={eventType} />;
  }

  if (sectionId === "main_event") {
    return <MainEventForm eventData={eventData} eventType={eventType} section={section} />;
  }

  if (sectionId === "venue") {
    return <VenueForm eventData={eventData} section={section} />;
  }

  return <RsvpFormConfigPanel eventData={eventData} section={section} />;
}

function HostInfoForm({
  eventData,
  eventType,
}: {
  eventData: EventWebsiteEditorData;
  eventType: EventWebsiteEventType | "generic";
}) {
  const model = getHostInfoModel(eventType);
  const [values, setValues] = useState(() => buildInitialHostValues(model, eventData));
  const isWedding = normalizeEventWebsiteEventType(eventType) === "wedding";
  const displayOptions = isWedding
    ? getWeddingDisplayOptions(values.groomName, values.brideName)
    : model.displayOptions;

  function updateHostValue(fieldId: string, value: string) {
    setValues((current) => {
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
      <EditorSaveButton />
    </EditorShell>
  );
}

function MainEventForm({
  eventData,
  eventType,
  section,
}: {
  eventData: EventWebsiteEditorData;
  eventType: EventWebsiteEventType | "generic";
  section: EventWebsiteSectionDefinition;
}) {
  const model = getMainEventModel(eventType, section.label);
  const [values, setValues] = useState(() => ({
    endTime: model.defaultEndTime,
    eventDate: eventData.eventDate ?? "2026-06-20",
    eventLabel: model.defaultLabel,
    eventTime: formatTime(eventData.eventTime) || model.defaultStartTime,
    rsvpDeadline: formatDateTimeLocal(eventData.rsvpCloseAt) || "2026-06-01T18:00",
    scheduleNote: eventData.eventContent?.scheduleNote ?? model.defaultScheduleNote,
  }));

  return (
    <EditorShell title={model.title} description={model.description}>
      <EditorGroup title="Main Schedule" layout="two-column">
        <TextField
          field={{ colSpan: "full", id: "eventLabel", label: model.labelField, maxLength: 80 }}
          value={values.eventLabel}
          onChange={(value) => setValues((current) => ({ ...current, eventLabel: value }))}
        />
        <DateField
          field={{ colSpan: "half", id: "eventDate", label: "Date", maxLength: 10, showCounter: false }}
          value={values.eventDate}
          onChange={(value) => setValues((current) => ({ ...current, eventDate: value }))}
        />
        <TimeField
          field={{ colSpan: "half", id: "eventTime", label: "Start Time", maxLength: 8, showCounter: false }}
          value={values.eventTime}
          onChange={(value) => setValues((current) => ({ ...current, eventTime: value }))}
        />
        <TimeField
          field={{ colSpan: "half", id: "endTime", label: "End Time", maxLength: 8, showCounter: false }}
          value={values.endTime}
          onChange={(value) => setValues((current) => ({ ...current, endTime: value }))}
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
          onChange={(value) => setValues((current) => ({ ...current, rsvpDeadline: value }))}
        />
        <TextAreaField
          field={{ colSpan: "full", id: "scheduleNote", label: "Schedule Note", maxLength: 200 }}
          value={values.scheduleNote}
          onChange={(value) => setValues((current) => ({ ...current, scheduleNote: value }))}
        />
      </EditorGroup>
      <EditorSaveButton />
    </EditorShell>
  );
}

function VenueForm({
  eventData,
  section,
}: {
  eventData: EventWebsiteEditorData;
  section: EventWebsiteSectionDefinition;
}) {
  const [values, setValues] = useState(() => ({
    address: eventData.venueAddress ?? "",
    arrivalNote: eventData.eventContent?.venueNote ?? "",
    mapsLink: "",
    venueName: eventData.venueName ?? "",
  }));

  return (
    <EditorShell title={section.label} description="Set the main location guests need to find for your event.">
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
          onChange={(value) => setValues((current) => ({ ...current, venueName: value }))}
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
          onChange={(value) => setValues((current) => ({ ...current, address: value }))}
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
          onChange={(value) => setValues((current) => ({ ...current, mapsLink: value }))}
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
          onChange={(value) => setValues((current) => ({ ...current, arrivalNote: value }))}
        />
      </EditorGroup>
      <EditorSaveButton />
    </EditorShell>
  );
}

function RsvpFormConfigPanel({
  eventData,
  section,
}: {
  eventData: EventWebsiteEditorData;
  section: EventWebsiteSectionDefinition;
}) {
  const [isCustomQuestionDialogOpen, setIsCustomQuestionDialogOpen] = useState(false);
  const [plusOneEnabled, setPlusOneEnabled] = useState(Boolean(eventData.maxGuestCount));
  const [companionLimit, setCompanionLimit] = useState("1");
  const [companionNameEnabled, setCompanionNameEnabled] = useState(true);
  const [companionAgeEnabled, setCompanionAgeEnabled] = useState(false);
  const [foodAllergiesEnabled, setFoodAllergiesEnabled] = useState(false);
  const [messageToHostEnabled, setMessageToHostEnabled] = useState(true);
  const [customQuestions, setCustomQuestions] = useState<CustomQuestion[]>([]);
  const [customQuestionLabel, setCustomQuestionLabel] = useState("");
  const [customQuestionType, setCustomQuestionType] = useState(defaultCustomQuestionFieldType);
  const [customQuestionRequired, setCustomQuestionRequired] = useState(false);
  const [customQuestionOptions, setCustomQuestionOptions] = useState(defaultCustomQuestionOptions);
  const customQuestionCount = customQuestions.length;
  const hasReachedCustomQuestionLimit = customQuestionCount >= maxCustomQuestions;
  const isChoiceQuestion =
    customQuestionType === "Single choice" || customQuestionType === "Multiple choice";
  const trimmedCustomQuestionLabel = customQuestionLabel.trim();
  const previewQuestionLabel = trimmedCustomQuestionLabel || "Untitled question";
  const previewChoiceOptions = customQuestionOptions.map((option) => option.trim()).filter(Boolean);
  const previewValue =
    customQuestionType === "Short text"
      ? "Short answer"
      : customQuestionType === "Long text"
        ? "Long answer"
        : customQuestionType === "Number"
          ? "Number input"
          : customQuestionType === "Yes / No"
            ? "Yes / No"
            : previewChoiceOptions.length > 0
              ? previewChoiceOptions.join(" • ")
              : "Add choices";

  function resetCustomQuestionDraft() {
    setCustomQuestionLabel("");
    setCustomQuestionType(defaultCustomQuestionFieldType);
    setCustomQuestionRequired(false);
    setCustomQuestionOptions(defaultCustomQuestionOptions);
  }

  function handleCustomQuestionDialogChange(open: boolean) {
    setIsCustomQuestionDialogOpen(open);

    if (!open) {
      resetCustomQuestionDraft();
    }
  }

  function updateCustomQuestionOption(index: number, value: string) {
    setCustomQuestionOptions((current) =>
      current.map((option, optionIndex) => (optionIndex === index ? value : option)),
    );
  }

  function addCustomQuestionOption() {
    setCustomQuestionOptions((current) =>
      current.length < maxCustomQuestionOptions ? [...current, `Option ${current.length + 1}`] : current,
    );
  }

  function removeCustomQuestionOption(index: number) {
    setCustomQuestionOptions((current) =>
      current.length > 2 ? current.filter((_, optionIndex) => optionIndex !== index) : current,
    );
  }

  function addCustomQuestion() {
    const label = trimmedCustomQuestionLabel;

    if (!label || hasReachedCustomQuestionLimit) {
      return;
    }

    setCustomQuestions((current) => [
      ...current,
      {
        fieldType: customQuestionType,
        label,
        options: isChoiceQuestion ? customQuestionOptions.map((option) => option.trim()).filter(Boolean) : [],
        required: customQuestionRequired,
      },
    ]);
    setIsCustomQuestionDialogOpen(false);
    resetCustomQuestionDraft();
  }

  return (
    <EditorShell
      title={section.label}
      description="Choose the basic questions guests will answer when they RSVP."
    >
      <EditorGroup title="RSVP Fields">
        <AlwaysOnRow
          title="Guest Name"
          description="Required · always included"
        />
        <AlwaysOnRow
          title="Attendance"
          description="Required · attending or not attending"
        />
        <ToggleRow
          title="Plus-one / Guest Count"
          description="Lets guests add one companion; party size counts automatically"
          checked={plusOneEnabled}
          onCheckedChange={setPlusOneEnabled}
        />
        {plusOneEnabled ? (
          <div className="event-editor-nested-settings">
            <TextField
              field={{ id: "companionLimit", label: "Companion Limit", maxLength: 2, showCounter: false }}
              inputMode="numeric"
              inputType="number"
              max={10}
              min={1}
              value={companionLimit}
              helper="Default is 1 companion; increase only when groups are allowed."
              onChange={setCompanionLimit}
            />
            <ToggleRow
              title="Companion Name"
              description="Ask for the companion name when guest count is enabled"
              checked={companionNameEnabled}
              onCheckedChange={setCompanionNameEnabled}
            />
            <ToggleRow
              title="Companion Age"
              description="Useful for children or age-based planning."
              checked={companionAgeEnabled}
              onCheckedChange={setCompanionAgeEnabled}
            />
          </div>
        ) : null}
        <ToggleRow
          title="Food Allergies / Dietary Restrictions"
          description="Ask guests to mention allergies or dietary restrictions"
          checked={foodAllergiesEnabled}
          onCheckedChange={setFoodAllergiesEnabled}
        />
        <ToggleRow
          title="Message to Host"
          description="Optional note or greeting"
          checked={messageToHostEnabled}
          onCheckedChange={setMessageToHostEnabled}
        />
        <Dialog open={isCustomQuestionDialogOpen} onOpenChange={handleCustomQuestionDialogChange}>
          <DialogTrigger asChild>
            <Button
              type="button"
              variant="outline"
              className="event-editor-add-question-button"
              disabled={hasReachedCustomQuestionLimit}
            >
              Add custom question
            </Button>
          </DialogTrigger>
          <DialogPortal>
            <DialogOverlay className="event-custom-question-overlay" />
            <DialogPrimitive.Content
              data-slot="dialog-content"
              data-dashboard-dialog="event-custom-question"
              className="event-custom-question-dialog"
            >
              <DialogHeader className="event-custom-question-header">
                <DialogTitle>Add custom question</DialogTitle>
                <DialogClose asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    className="event-custom-question-close"
                    aria-label="Close add custom question modal"
                  >
                    <X />
                  </Button>
                </DialogClose>
              </DialogHeader>
              <div className="event-custom-question-scroll">
                <div className="event-custom-question-section">
                  <FieldShell
                    field={{
                      id: "customQuestionLabel",
                      label: "Question label",
                      maxLength: 100,
                      placeholder: "e.g. Do you need parking assistance?",
                    }}
                    value={customQuestionLabel}
                  >
                    <Input
                      id="event-editor-customQuestionLabel"
                      className="event-editor-input"
                      maxLength={100}
                      placeholder="e.g. Do you need parking assistance?"
                      value={customQuestionLabel}
                      onChange={(event) => setCustomQuestionLabel(event.target.value)}
                    />
                  </FieldShell>
                </div>

                <div className="event-custom-question-section">
                  <div className="event-custom-question-block-header">
                    <div>
                      <Label>Field type</Label>
                      <p>Choose how guests will answer this question.</p>
                    </div>
                  </div>
                  <div className="event-custom-type-grid" role="radiogroup" aria-label="Field type">
                    {customQuestionFieldTypes.map((type) => {
                      const isSelected = customQuestionType === type;

                      return (
                        <button
                          key={type}
                          type="button"
                          role="radio"
                          aria-checked={isSelected}
                          className={cn(
                            "event-custom-type-choice",
                            isSelected && "event-custom-type-choice--active",
                          )}
                          onClick={() => {
                            setCustomQuestionType(type);
                            if (type === "Single choice" || type === "Multiple choice") {
                              setCustomQuestionOptions((current) =>
                                current.length >= 2 ? current : defaultCustomQuestionOptions,
                              );
                            }
                          }}
                        >
                          <span>{type}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="event-editor-rsvp-row event-custom-question-required-row">
                  <span>
                    <strong>Required</strong>
                    <small>Guests must answer this question.</small>
                  </span>
                  <Switch
                    className="dashboard-toggle event-editor-switch"
                    checked={customQuestionRequired}
                    onCheckedChange={setCustomQuestionRequired}
                    aria-label="Toggle required question"
                  />
                </div>

                {isChoiceQuestion ? (
                  <div className="event-custom-options-card">
                    <div className="event-custom-question-block-header">
                      <div>
                        <h3>Choices</h3>
                        <p>Shown only for single or multiple choice questions.</p>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="event-custom-option-add-button"
                        disabled={customQuestionOptions.length >= maxCustomQuestionOptions}
                        onClick={addCustomQuestionOption}
                      >
                        <Plus />
                        Add option
                      </Button>
                    </div>
                    <div className="event-custom-option-list">
                      {customQuestionOptions.map((option, index) => (
                        <div key={index} className="event-custom-option-row">
                          <div className="event-custom-option-field">
                            <div className="event-editor-label-row">
                              <Label htmlFor={`event-editor-customQuestionOption${index}`}>
                                {`Option ${index + 1}`}
                              </Label>
                            </div>
                            <Input
                              id={`event-editor-customQuestionOption${index}`}
                              className="event-editor-input"
                              maxLength={60}
                              value={option}
                              onChange={(event) => updateCustomQuestionOption(index, event.target.value)}
                            />
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            className="event-custom-option-remove-button"
                            aria-label={`Remove option ${index + 1}`}
                            disabled={customQuestionOptions.length <= 2}
                            onClick={() => removeCustomQuestionOption(index)}
                          >
                            <Trash2 />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}

                <div className="event-custom-preview-card">
                  <div className="event-custom-preview-kicker">Preview</div>
                  <div className="event-custom-preview-question-row">
                    <strong>{previewQuestionLabel}</strong>
                    <Badge variant="outline" className="event-custom-preview-badge">
                      {customQuestionRequired ? "Required" : "Optional"}
                    </Badge>
                  </div>
                  <p>{previewValue}</p>
                </div>
              </div>
              <DialogFooter className="event-custom-question-footer">
                <span className="event-custom-question-counter">
                  {customQuestionCount}/{maxCustomQuestions} custom questions
                </span>
                <div className="event-custom-question-actions">
                  <DialogClose asChild>
                    <Button type="button" variant="outline" className="event-custom-question-cancel">
                      Cancel
                    </Button>
                  </DialogClose>
                  <Button
                    type="button"
                    className="event-editor-save-button event-custom-question-submit"
                    disabled={!trimmedCustomQuestionLabel || hasReachedCustomQuestionLimit}
                    onClick={addCustomQuestion}
                  >
                    Add question
                  </Button>
                </div>
              </DialogFooter>
            </DialogPrimitive.Content>
          </DialogPortal>
        </Dialog>
        {customQuestions.map((question, index) => (
          <div key={`${question.label}-${index}`} className="event-custom-question-list-row">
            <div className="event-custom-question-list-copy">
              <strong>{question.label}</strong>
              <small>
                {question.fieldType} · {question.required ? "Required" : "Optional"}
              </small>
            </div>
            <Badge variant="outline" className="event-custom-question-prototype-badge">
              Prototype only
            </Badge>
          </div>
        ))}
      </EditorGroup>
      <EditorSaveButton />
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

function EditorSaveButton() {
  return (
    <div className="event-editor-actions">
      <Button type="button" className="event-editor-save-button">
        Save changes
      </Button>
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
        { colSpan: "half", id: "groomName", label: "Groom's Name", maxLength: 40, placeholder: "Juan" },
        { colSpan: "half", id: "brideName", label: "Bride's Name", maxLength: 40, placeholder: "Maria" },
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
      displayOptions: ["Juan Carlos", "Juan Carlos turns 7", "Juan Carlos Birthday"],
      fields: [
        { id: "celebrantName", label: "Celebrant Name", maxLength: 60 },
        { id: "milestone", label: "Age / Milestone", maxLength: 40, optional: true },
        { id: "displayAs", label: "Display As", maxLength: 80, type: "select" },
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
        { id: "debutantName", label: "Debutant Name", maxLength: 60 },
        { id: "milestone", label: "Age / Milestone", maxLength: 40, optional: true },
        { id: "displayAs", label: "Display As", maxLength: 80 },
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
        { id: "childName", label: "Child's Name", maxLength: 60 },
        { id: "parentNames", label: "Parent / Guardian Names", maxLength: 120, optional: true },
        { id: "displayAs", label: "Display As", maxLength: 80 },
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

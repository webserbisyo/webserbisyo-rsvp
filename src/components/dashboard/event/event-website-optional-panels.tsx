"use client";

import { useState } from "react";
import type { EventWebsiteEditorData } from "@/components/dashboard/event/event-website-editor-panel";
import { EventWebsiteGiftUploadCard } from "@/components/dashboard/event/event-website-gift-upload-card";
import {
  EditorGroup,
  EditorSaveButton,
  EditorShell,
  FieldGrid,
  ListBuilder,
  ListBuilderRow,
  SelectField,
  TextAreaField,
  TextField,
  TimeField,
} from "@/components/dashboard/event/event-website-optional-fields";

type OptionalPanelProps = {
  eventData: EventWebsiteEditorData;
};

type TimelineItem = {
  description: string;
  time: string;
  title: string;
};

type EntourageGroup = {
  groupTitle: string;
  names: string;
};

type SponsorItem = {
  groupTitle: string;
  names: string;
};

type GiftOptionDraft = {
  file: File | null;
  title: string;
};

export function OptionalCountdownPanel() {
  const [values, setValues] = useState({
    shortNote: "We can't wait to celebrate with you.",
    title: "Counting down to our special day",
  });

  return (
    <EditorShell
      title="Countdown"
      description="Toggle this section on to show a countdown on the event website. The date and time come automatically from the required Ceremony details."
    >
      <EditorGroup title="Countdown Copy">
        <TextField
          field={{ id: "countdownTitle", label: "Section Title", maxLength: 90 }}
          value={values.title}
          onChange={(value) => setValues((current) => ({ ...current, title: value }))}
        />
        <TextAreaField
          field={{ id: "countdownShortNote", label: "Short Note", maxLength: 160 }}
          value={values.shortNote}
          onChange={(value) => setValues((current) => ({ ...current, shortNote: value }))}
        />
      </EditorGroup>
      <EditorSaveButton />
    </EditorShell>
  );
}

export function OptionalReceptionPanel({ eventData }: OptionalPanelProps) {
  const [values, setValues] = useState(() => ({
    address: "",
    endTime: "21:00",
    mapsLink: "",
    note: "Dinner and program will follow after the ceremony.",
    startTime: "18:00",
    title: "Wedding Reception",
    venueName: eventData.venueName ?? "",
  }));

  return (
    <EditorShell
      title="Reception"
      description="Add a separate reception block for the event website without changing the required venue section."
    >
      <EditorGroup title="Reception Details" layout="two-column">
        <TextField
          field={{ colSpan: "full", id: "receptionTitle", label: "Reception Label", maxLength: 80 }}
          value={values.title}
          onChange={(value) => setValues((current) => ({ ...current, title: value }))}
        />
        <TimeField
          field={{ colSpan: "half", id: "receptionStartTime", label: "Start Time", maxLength: 8, showCounter: false }}
          value={values.startTime}
          onChange={(value) => setValues((current) => ({ ...current, startTime: value }))}
        />
        <TimeField
          field={{ colSpan: "half", id: "receptionEndTime", label: "End Time", maxLength: 8, showCounter: false }}
          value={values.endTime}
          onChange={(value) => setValues((current) => ({ ...current, endTime: value }))}
        />
        <TextAreaField
          field={{ colSpan: "full", id: "receptionNote", label: "Reception Note", maxLength: 180 }}
          value={values.note}
          onChange={(value) => setValues((current) => ({ ...current, note: value }))}
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
          onChange={(value) => setValues((current) => ({ ...current, venueName: value }))}
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
          onChange={(value) => setValues((current) => ({ ...current, address: value }))}
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
          onChange={(value) => setValues((current) => ({ ...current, mapsLink: value }))}
        />
      </EditorGroup>
      <EditorSaveButton />
    </EditorShell>
  );
}

export function OptionalTimelinePanel() {
  const [items, setItems] = useState<TimelineItem[]>([
    {
      description: "Guests may proceed to the entrance area.",
      time: "15:00",
      title: "Guest Arrival",
    },
    {
      description: "Main ceremony begins.",
      time: "16:00",
      title: "Ceremony",
    },
    {
      description: "Dinner and program follow.",
      time: "18:00",
      title: "Reception",
    },
  ]);

  function updateItem(index: number, nextItem: TimelineItem) {
    setItems((current) => current.map((item, itemIndex) => (itemIndex === index ? nextItem : item)));
  }

  function moveItem(index: number, direction: -1 | 1) {
    setItems((current) => {
      const nextIndex = index + direction;

      if (nextIndex < 0 || nextIndex >= current.length) {
        return current;
      }

      const next = [...current];
      const moved = next[index];
      next[index] = next[nextIndex]!;
      next[nextIndex] = moved!;
      return next;
    });
  }

  function addItem() {
    setItems((current) => [
      ...current,
      { description: "", time: "", title: `Program Item ${current.length + 1}` },
    ]);
  }

  function removeItem(index: number) {
    setItems((current) => current.filter((_, itemIndex) => itemIndex !== index));
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
              key={`${index}-${item.title}`}
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
      <EditorSaveButton />
    </EditorShell>
  );
}

export function OptionalEntouragePanel() {
  const [introLine, setIntroLine] = useState(
    "Meet the family and friends standing with us on our wedding day.",
  );
  const [displayStyle, setDisplayStyle] = useState("Grouped by role");
  const [nameFormat, setNameFormat] = useState("Full names");
  const [groups, setGroups] = useState<EntourageGroup[]>([
    {
      groupTitle: "Maid of Honor",
      names: "Maria Santos",
    },
    {
      groupTitle: "Bridesmaids",
      names: "Ana Cruz, Bella Reyes, Carla Lim",
    },
  ]);

  function updateGroup(index: number, nextGroup: EntourageGroup) {
    setGroups((current) => current.map((group, groupIndex) => (groupIndex === index ? nextGroup : group)));
  }

  function moveGroup(index: number, direction: -1 | 1) {
    setGroups((current) => {
      const nextIndex = index + direction;

      if (nextIndex < 0 || nextIndex >= current.length) {
        return current;
      }

      const next = [...current];
      const moved = next[index];
      next[index] = next[nextIndex]!;
      next[nextIndex] = moved!;
      return next;
    });
  }

  function addGroup() {
    setGroups((current) => [...current, { groupTitle: "", names: "" }]);
  }

  function removeGroup(index: number) {
    setGroups((current) => current.filter((_, groupIndex) => groupIndex !== index));
  }

  return (
    <EditorShell
      title="Entourage"
      description="List the wedding party and ceremony participants, grouped by role."
    >
      <EditorGroup title="Display Settings" layout="two-column">
        <TextAreaField
          field={{ colSpan: "full", id: "entourageIntroLine", label: "Intro Line", maxLength: 220 }}
          value={introLine}
          onChange={setIntroLine}
        />
        <SelectField
          field={{ colSpan: "half", id: "entourageDisplayStyle", label: "Display Style", maxLength: 40, showCounter: false }}
          options={["Grouped by role", "Simple list"]}
          value={displayStyle}
          onChange={setDisplayStyle}
        />
        <SelectField
          field={{ colSpan: "half", id: "entourageNameFormat", label: "Name Format", maxLength: 40, showCounter: false }}
          options={["Full names", "First names only"]}
          value={nameFormat}
          onChange={setNameFormat}
        />
      </EditorGroup>

      <EditorGroup title="Wedding Party Groups">
        <ListBuilder addLabel="Add entourage group" onAdd={addGroup}>
          {groups.map((group, index) => (
            <ListBuilderRow
              key={`${index}-${group.groupTitle}`}
              canMoveDown={index < groups.length - 1}
              canMoveUp={index > 0}
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
      <EditorSaveButton />
    </EditorShell>
  );
}

export function OptionalPrincipalSponsorsPanel() {
  const [introLine, setIntroLine] = useState(
    "We are grateful for the love and guidance of our principal sponsors.",
  );
  const [sponsors, setSponsors] = useState<SponsorItem[]>([
    {
      groupTitle: "Principal Sponsors",
      names: "Mr. Juan Dela Cruz\nMrs. Maria Dela Cruz",
    },
    {
      groupTitle: "Principal Sponsors",
      names: "Mr. Pedro Santos\nMrs. Ana Santos",
    },
  ]);

  function updateSponsor(index: number, nextSponsor: SponsorItem) {
    setSponsors((current) =>
      current.map((sponsor, sponsorIndex) => (sponsorIndex === index ? nextSponsor : sponsor)),
    );
  }

  function moveSponsor(index: number, direction: -1 | 1) {
    setSponsors((current) => {
      const nextIndex = index + direction;

      if (nextIndex < 0 || nextIndex >= current.length) {
        return current;
      }

      const next = [...current];
      const moved = next[index];
      next[index] = next[nextIndex]!;
      next[nextIndex] = moved!;
      return next;
    });
  }

  function addSponsor() {
    setSponsors((current) => [...current, { groupTitle: "", names: "" }]);
  }

  function removeSponsor(index: number) {
    setSponsors((current) => current.filter((_, sponsorIndex) => sponsorIndex !== index));
  }

  return (
    <EditorShell
      title="Principal Sponsors"
      description="List the principal sponsors who should appear on the wedding website."
    >
      <EditorGroup title="Sponsor Intro">
        <TextAreaField
          field={{ colSpan: "full", id: "principalSponsorsIntroLine", label: "Section Intro", maxLength: 220 }}
          value={introLine}
          onChange={setIntroLine}
        />
      </EditorGroup>

      <EditorGroup title="Principal Sponsor List">
        <ListBuilder addLabel="Add sponsor" onAdd={addSponsor}>
          {sponsors.map((sponsor, index) => (
            <ListBuilderRow
              key={`${index}-${sponsor.groupTitle}`}
              canMoveDown={index < sponsors.length - 1}
              canMoveUp={index > 0}
              hideGripIcon
              onMoveDown={() => moveSponsor(index, 1)}
              onMoveUp={() => moveSponsor(index, -1)}
              onRemove={() => removeSponsor(index)}
              title={`Sponsor ${index + 1}`}
            >
              <FieldGrid layout="two-column">
                <TextField
                  field={{
                    colSpan: "full",
                    id: `principalSponsorsGroupTitle${index}`,
                    label: "Group Title",
                    maxLength: 80,
                  }}
                  value={sponsor.groupTitle}
                  onChange={(value) => updateSponsor(index, { ...sponsor, groupTitle: value })}
                />
                <TextAreaField
                  field={{
                    colSpan: "full",
                    id: `principalSponsorsNames${index}`,
                    label: "Names",
                    maxLength: 220,
                  }}
                  value={sponsor.names}
                  onChange={(value) => updateSponsor(index, { ...sponsor, names: value })}
                />
              </FieldGrid>
            </ListBuilderRow>
          ))}
        </ListBuilder>
      </EditorGroup>
      <EditorSaveButton />
    </EditorShell>
  );
}

export function OptionalLoveStoryPanel() {
  const [values, setValues] = useState({
    sectionIntro: "A little story about how our journey began.",
    storyBody:
      "From the first hello to this special day, we are grateful for every moment that brought us here.",
    storyTitle: "Our Story",
  });

  return (
    <EditorShell
      title="Love Story"
      description="Share a short story guests can read on the wedding website."
    >
      <EditorGroup title="Story Intro">
        <TextAreaField
          field={{ id: "loveStorySectionIntro", label: "Section Intro", maxLength: 180 }}
          value={values.sectionIntro}
          onChange={(value) => setValues((current) => ({ ...current, sectionIntro: value }))}
        />
      </EditorGroup>
      <EditorGroup title="Story Content">
        <TextField
          field={{ id: "loveStoryTitle", label: "Story Title", maxLength: 80 }}
          value={values.storyTitle}
          onChange={(value) => setValues((current) => ({ ...current, storyTitle: value }))}
        />
        <TextAreaField
          field={{ id: "loveStoryBody", label: "Story Body", maxLength: 420 }}
          value={values.storyBody}
          onChange={(value) => setValues((current) => ({ ...current, storyBody: value }))}
        />
      </EditorGroup>
      <EditorSaveButton />
    </EditorShell>
  );
}

export function OptionalAttirePanel() {
  const [values, setValues] = useState({
    colorMotifNote: "Please wear shades that complement our wedding colors.",
    dressCodeNote: "Formal or semi-formal attire is encouraged.",
    sectionIntro: "We would love to see you in our wedding motif.",
  });

  return (
    <EditorShell
      title="Attire / Dress Code"
      description="Give guests clear guidance on what to wear."
    >
      <EditorGroup title="Dress Code">
        <TextAreaField
          field={{ id: "attireSectionIntro", label: "Section Intro", maxLength: 180 }}
          value={values.sectionIntro}
          onChange={(value) => setValues((current) => ({ ...current, sectionIntro: value }))}
        />
        <TextAreaField
          field={{ id: "attireDressCodeNote", label: "Dress Code Note", maxLength: 180 }}
          value={values.dressCodeNote}
          onChange={(value) => setValues((current) => ({ ...current, dressCodeNote: value }))}
        />
        <TextAreaField
          field={{ id: "attireColorMotifNote", label: "Color / Motif Note", maxLength: 180 }}
          value={values.colorMotifNote}
          onChange={(value) => setValues((current) => ({ ...current, colorMotifNote: value }))}
        />
      </EditorGroup>
      <EditorSaveButton />
    </EditorShell>
  );
}

export function OptionalMessagesPanel() {
  const [values, setValues] = useState({
    messageBody:
      "Your presence means the world to us. Thank you for celebrating this special day with us.",
    sectionTitle: "A Note from Us",
  });

  return (
    <EditorShell
      title="Messages"
      description="Add a simple note, reminder, or message from the couple."
    >
      <EditorGroup title="Message Content">
        <TextField
          field={{ id: "messagesSectionTitle", label: "Section Title", maxLength: 80 }}
          value={values.sectionTitle}
          onChange={(value) => setValues((current) => ({ ...current, sectionTitle: value }))}
        />
        <TextAreaField
          field={{ id: "messagesBody", label: "Message Body", maxLength: 320 }}
          value={values.messageBody}
          onChange={(value) => setValues((current) => ({ ...current, messageBody: value }))}
        />
      </EditorGroup>
      <EditorSaveButton />
    </EditorShell>
  );
}

export function OptionalGiftDetailsPanel() {
  const [values, setValues] = useState({
    giftNote:
      "If you wish to give a gift, a monetary gift would be greatly appreciated as we begin this new chapter together.",
    sectionIntro: "Your presence is the greatest gift.",
  });
  const [giftOptionOne, setGiftOptionOne] = useState<GiftOptionDraft>({
    file: null,
    title: "",
  });
  const [giftOptionTwo, setGiftOptionTwo] = useState<GiftOptionDraft | null>(null);

  return (
    <EditorShell
      title="Gift Details"
      description="Add a gift note and up to two display-only gift options for the wedding website."
    >
      <EditorGroup title="Gift Message">
        <TextAreaField
          field={{ id: "giftSectionIntro", label: "Section Intro", maxLength: 200 }}
          value={values.sectionIntro}
          onChange={(value) => setValues((current) => ({ ...current, sectionIntro: value }))}
        />
        <TextAreaField
          field={{ id: "giftNote", label: "Gift Note", maxLength: 360 }}
          value={values.giftNote}
          onChange={(value) => setValues((current) => ({ ...current, giftNote: value }))}
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
                onChange={(value) => setGiftOptionOne((current) => ({ ...current, title: value }))}
              />
              <div className="event-editor-field event-editor-field--full">
                <div className="event-editor-label-row">
                  <span>QR Code / Gift Image</span>
                </div>
                <EventWebsiteGiftUploadCard
                  file={giftOptionOne.file}
                  fileInputId="event-editor-gift-option-one-upload"
                  onFileChange={(file) => setGiftOptionOne((current) => ({ ...current, file }))}
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
                    onClick={() => setGiftOptionTwo(null)}
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
                  onChange={(value) =>
                    setGiftOptionTwo((current) => (current ? { ...current, title: value } : current))
                  }
                />
                <div className="event-editor-field event-editor-field--full">
                  <div className="event-editor-label-row">
                    <span>QR Code / Gift Image</span>
                  </div>
                  <EventWebsiteGiftUploadCard
                    file={giftOptionTwo.file}
                    fileInputId="event-editor-gift-option-two-upload"
                    onFileChange={(file) =>
                      setGiftOptionTwo((current) => (current ? { ...current, file } : current))
                    }
                  />
                </div>
              </FieldGrid>
            </div>
          ) : (
            <button
              type="button"
              className="event-editor-list-add-button event-editor-list-add-button--inline"
              onClick={() => setGiftOptionTwo({ file: null, title: "" })}
            >
              + Add another gift option
            </button>
          )}
        </div>
      </EditorGroup>
      <EditorSaveButton />
    </EditorShell>
  );
}

export function OptionalContactSocialsPanel() {
  const [values, setValues] = useState({
    contactNumber: "",
    contactPerson: "",
    email: "",
    facebookUrl: "",
    instagramUrl: "",
    tikTokUrl: "",
  });

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
          onChange={(value) => setValues((current) => ({ ...current, contactPerson: value }))}
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
          onChange={(value) => setValues((current) => ({ ...current, contactNumber: value }))}
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
          onChange={(value) => setValues((current) => ({ ...current, email: value }))}
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
          onChange={(value) => setValues((current) => ({ ...current, facebookUrl: value }))}
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
          onChange={(value) => setValues((current) => ({ ...current, instagramUrl: value }))}
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
          onChange={(value) => setValues((current) => ({ ...current, tikTokUrl: value }))}
        />
      </EditorGroup>
      <EditorSaveButton />
    </EditorShell>
  );
}

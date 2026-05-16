"use client";

import { motion } from "motion/react";
import {
  CalendarDays,
  Gift,
  Mail,
  MapPin,
  Monitor,
  Music,
  Phone,
  Play,
  Smartphone,
  UsersRound,
} from "lucide-react";
import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { EventWebsiteSectionDefinition, EventWebsiteSectionKey } from "@/config/event-website-sections";
import {
  formatPreviewDate,
  formatPreviewDateTime,
  formatPreviewTime,
  previewDefaultDraft,
  previewSupportedSectionKeys,
  type EventWebsitePreviewDevice,
  type EventWebsitePreviewDraft,
} from "@/components/dashboard/event/event-website-preview-data";
import { cn } from "@/lib/utils";

type EventWebsitePreviewPanelProps = {
  enabledSections: Record<EventWebsiteSectionKey, boolean>;
  previewScrollRequest: number;
  previewDraft: EventWebsitePreviewDraft;
  selectedSection: EventWebsiteSectionDefinition | undefined;
  websiteFlowSections: EventWebsiteSectionDefinition[];
};

const supportedSectionKeySet = new Set<EventWebsiteSectionKey>(previewSupportedSectionKeys);

export function EventWebsitePreviewPanel({
  enabledSections,
  previewScrollRequest,
  previewDraft,
  selectedSection,
  websiteFlowSections,
}: EventWebsitePreviewPanelProps) {
  const [device, setDevice] = useState<EventWebsitePreviewDevice>("desktop");
  const previewScrollRef = useRef<HTMLDivElement>(null);
  const visiblePreviewSections = websiteFlowSections.filter(
    (section) =>
      supportedSectionKeySet.has(section.key) &&
      (section.required || enabledSections[section.key]),
  );
  const selectedSectionIsOff = Boolean(
    selectedSection &&
    !selectedSection.required &&
    !selectedSection.comingSoon &&
    !enabledSections[selectedSection.key],
  );
  const selectedSectionKey = selectedSection?.key;

  useEffect(() => {
    if (!selectedSectionKey || !supportedSectionKeySet.has(selectedSectionKey) || selectedSectionIsOff) {
      return;
    }

    const scrollContainer = previewScrollRef.current;
    const target = scrollContainer?.querySelector<HTMLElement>(
      `[data-preview-section="${selectedSectionKey}"]`,
    );

    if (!scrollContainer || !target) {
      return;
    }

    requestAnimationFrame(() => {
      const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const targetTop =
        target.offsetTop -
        scrollContainer.clientHeight / 2 +
        target.clientHeight / 2;

      scrollContainer.scrollTo({
        behavior: prefersReducedMotion ? "auto" : "smooth",
        top: Math.max(0, targetTop),
      });
    });
  }, [previewScrollRequest, selectedSectionIsOff, selectedSectionKey, visiblePreviewSections]);

  return (
    <aside className="event-website-preview-space" aria-label="Website preview">
      <div className="event-preview-panel">
        {selectedSectionIsOff ? (
          <div className="event-preview-off-notice">
            {selectedSection?.label} is turned off and will not appear on the public website.
          </div>
        ) : null}

        <div className={cn("event-preview-frame-shell", device === "mobile" && "is-mobile")}>
          {device === "desktop" ? (
            <div className="event-preview-browser-bar">
              <span className="event-preview-browser-dot is-red" />
              <span className="event-preview-browser-dot is-green" />
              <span className="event-preview-browser-dot is-neutral" />
              <span className="event-preview-address">webserbisyo.app/r/juan-and-maria</span>
              <PreviewDeviceTabs device={device} onDeviceChange={setDevice} />
            </div>
          ) : (
            <div className="event-preview-mobile-control-row">
              <PreviewDeviceTabs device={device} onDeviceChange={setDevice} />
            </div>
          )}

          <div ref={previewScrollRef} className="event-preview-frame">
            {visiblePreviewSections.map((section, index) => (
              <PreviewSectionRouter
                key={section.key}
                draft={previewDraft}
                isActive={section.key === selectedSectionKey}
                section={section}
                showDivider={index > 0}
              />
            ))}
          </div>
        </div>
      </div>
    </aside>
  );
}

function PreviewDeviceTabs({
  device,
  onDeviceChange,
}: {
  device: EventWebsitePreviewDevice;
  onDeviceChange: (device: EventWebsitePreviewDevice) => void;
}) {
  return (
    <Tabs value={device} onValueChange={(value) => onDeviceChange(value as EventWebsitePreviewDevice)}>
      <TabsList className="event-preview-device-tabs" aria-label="Preview device">
        <TabsTrigger value="desktop" className="event-preview-device-trigger" aria-label="Desktop preview">
          <Monitor className="size-3.5" aria-hidden="true" />
        </TabsTrigger>
        <TabsTrigger value="mobile" className="event-preview-device-trigger" aria-label="Mobile preview">
          <Smartphone className="size-3.5" aria-hidden="true" />
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
}

function PreviewSectionRouter({
  draft,
  isActive,
  section,
  showDivider,
}: {
  draft: EventWebsitePreviewDraft;
  isActive: boolean;
  section: EventWebsiteSectionDefinition;
  showDivider: boolean;
}) {
  return (
    <>
      {showDivider ? <MajorDivider /> : null}
      <div
        className={cn("event-preview-section-anchor", isActive && "is-active-preview")}
        data-preview-section={section.key}
      >
        {section.key === "host_info" ? <CoupleInfoPreview draft={draft} /> : null}
        {section.key === "countdown" ? <CountdownPreview draft={draft} /> : null}
        {section.key === "music_effects" ? <MusicPreview draft={draft} /> : null}
        {section.key === "main_event" ? <CeremonyPreview draft={draft} /> : null}
        {section.key === "venue" ? <VenuePreview draft={draft} /> : null}
        {section.key === "secondary_event" ? <ReceptionPreview draft={draft} /> : null}
        {section.key === "timeline_program" ? <TimelinePreview draft={draft} /> : null}
        {section.key === "entourage" ? <EntouragePreview draft={draft} /> : null}
        {section.key === "principal_sponsors" ? <PrincipalSponsorsPreview draft={draft} /> : null}
        {section.key === "attire_motif" ? <AttirePreview draft={draft} /> : null}
        {section.key === "extra_info" ? <ExtraInfoPreview draft={draft} /> : null}
        {section.key === "rsvp_form" ? <RsvpFormPreview draft={draft} /> : null}
        {section.key === "gift_details" ? <GiftDetailsPreview draft={draft} /> : null}
        {section.key === "guestbook" ? <MessagesPreview draft={draft} /> : null}
        {section.key === "story_message" ? <LoveStoryPreview draft={draft} /> : null}
        {section.key === "contact_socials" ? <ContactSocialsPreview draft={draft} /> : null}
      </div>
    </>
  );
}

function CoupleInfoPreview({ draft }: { draft: EventWebsitePreviewDraft }) {
  const coupleInfo = draft.coupleInfo;
  const groomName = withFallback(coupleInfo.groomName, previewDefaultDraft.coupleInfo.groomName);
  const brideName = withFallback(coupleInfo.brideName, previewDefaultDraft.coupleInfo.brideName);
  const displayAs = coupleInfo.displayAs.trim() || `${groomName} & ${brideName}`;
  const hostLine = coupleInfo.hostLine.trim();
  const message = coupleInfo.shortHostMessage.trim();

  return (
    <section className="event-preview-section event-preview-section--hero">
      <Badge variant="outline" className="event-preview-section-label">
        Couple Info
      </Badge>
      {hostLine ? <p className="event-preview-host-line">{hostLine}</p> : null}
      <h2>{displayAs}</h2>
      {message ? <p className="event-preview-copy">{message}</p> : null}
      <InternalDivider />
      <div className="event-preview-couple-grid">
        <span>
          <strong>Groom</strong>
          {groomName}
        </span>
        <span>
          <strong>Bride</strong>
          {brideName}
        </span>
      </div>
    </section>
  );
}

function CountdownPreview({ draft }: { draft: EventWebsitePreviewDraft }) {
  const title = withFallback(draft.countdown.title, previewDefaultDraft.countdown.title);
  const shortNote = draft.countdown.shortNote.trim();
  const [now, setNow] = useState(() => Date.now());
  const countdownItems = useMemo(
    () => buildCountdownItems(draft.ceremony.eventDate, draft.ceremony.eventTime, now),
    [draft.ceremony.eventDate, draft.ceremony.eventTime, now],
  );

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, []);

  return (
    <section className="event-preview-section">
      <Badge variant="outline" className="event-preview-section-label">
        Countdown
      </Badge>
      <h3>{title}</h3>
      {shortNote ? <p className="event-preview-copy">{shortNote}</p> : null}
      <div className="event-preview-countdown-grid">
        {countdownItems.map((item, index) => (
          <motion.div
            key={item.label}
            className="event-preview-countdown-card"
            initial={{ opacity: 0, scale: 0.96, y: 6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ delay: index * 0.05, duration: 0.2, ease: "easeOut" }}
          >
            <strong>{item.value}</strong>
            <span>{item.label}</span>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

function MusicPreview({ draft }: { draft: EventWebsitePreviewDraft }) {
  const values = draft.musicEffects;
  const title = withFallback(values.musicTitle, previewDefaultDraft.musicEffects.musicTitle);
  const buttonLabel = withFallback(
    values.playButtonLabel,
    previewDefaultDraft.musicEffects.playButtonLabel,
  );
  const note = values.shortNote.trim() || previewDefaultDraft.musicEffects.shortNote;

  return (
    <section className="event-preview-section event-preview-section--compact">
      <Badge variant="outline" className="event-preview-section-label">
        Music
      </Badge>
      <div className="event-preview-music-card">
        <div className="event-preview-music-icon">
          <Music className="size-4" aria-hidden="true" />
        </div>
        <div className="event-preview-music-copy">
          <h4>{title}</h4>
          <p>{note}</p>
        </div>
        <Button type="button" variant="outline" size="sm" className="event-preview-music-button">
          <Play className="size-3.5" aria-hidden="true" />
          {buttonLabel}
        </Button>
      </div>
    </section>
  );
}

function CeremonyPreview({ draft }: { draft: EventWebsitePreviewDraft }) {
  const ceremony = draft.ceremony;
  const date = formatPreviewDate(
    ceremony.eventDate,
    formatPreviewDate(previewDefaultDraft.ceremony.eventDate, "Saturday, June 6, 2026"),
  );
  const startTime = formatPreviewTime(ceremony.eventTime, "4:00 PM");
  const endTime = formatPreviewTime(ceremony.endTime, "6:00 PM");
  const rsvpDeadline = formatPreviewDateTime(ceremony.rsvpDeadline, "June 1, 2026 at 6:00 PM");
  const scheduleNote = ceremony.scheduleNote.trim() || previewDefaultDraft.ceremony.scheduleNote;

  return (
    <section className="event-preview-section">
      <Badge variant="outline" className="event-preview-section-label">
        Ceremony
      </Badge>
      <h3>{withFallback(ceremony.eventLabel, previewDefaultDraft.ceremony.eventLabel)}</h3>
      <dl className="event-preview-detail-list">
        <div>
          <dt>Date</dt>
          <dd>{date}</dd>
        </div>
        <div>
          <dt>Time</dt>
          <dd>
            {startTime} - {endTime}
          </dd>
        </div>
      </dl>
      <p className="event-preview-copy">{scheduleNote}</p>
      <InternalDivider />
      <p className="event-preview-deadline">Kindly RSVP by {rsvpDeadline}.</p>
    </section>
  );
}

function VenuePreview({ draft }: { draft: EventWebsitePreviewDraft }) {
  const venue = draft.venue;
  const mapsLink = venue.mapsLink.trim();
  const arrivalNote = venue.arrivalNote.trim();

  return (
    <section className="event-preview-section">
      <Badge variant="outline" className="event-preview-section-label">
        Venue
      </Badge>
      <h3>{withFallback(venue.venueName, previewDefaultDraft.venue.venueName)}</h3>
      <p className="event-preview-address-copy">
        <MapPin className="size-4" aria-hidden="true" />
        {withFallback(venue.address, previewDefaultDraft.venue.address)}
      </p>
      {mapsLink ? (
        <Button asChild variant="outline" size="sm" className="event-preview-map-button">
          <a href={mapsLink} target="_blank" rel="noreferrer">
            Open in Google Maps
          </a>
        </Button>
      ) : null}
      {arrivalNote ? (
        <>
          <InternalDivider />
          <p className="event-preview-copy">{arrivalNote}</p>
        </>
      ) : null}
    </section>
  );
}

function ReceptionPreview({ draft }: { draft: EventWebsitePreviewDraft }) {
  const values = draft.reception;
  const startTime = formatPreviewTime(
    values.startTime,
    formatPreviewTime(previewDefaultDraft.reception.startTime, "6:00 PM"),
  );
  const endTime = formatPreviewTime(
    values.endTime,
    formatPreviewTime(previewDefaultDraft.reception.endTime, "9:00 PM"),
  );
  const note = values.note.trim() || previewDefaultDraft.reception.note;
  const venueName = values.venueName.trim();
  const address = values.address.trim();
  const mapsLink = values.mapsLink.trim();
  const hasLocation = Boolean(venueName || address);

  return (
    <section className="event-preview-section">
      <Badge variant="outline" className="event-preview-section-label">
        Reception
      </Badge>
      <h3>{withFallback(values.title, previewDefaultDraft.reception.title)}</h3>
      <div className="event-preview-inline-card">
        <CalendarDays className="size-4" aria-hidden="true" />
        <span>
          {startTime} - {endTime}
        </span>
      </div>
      <p className="event-preview-copy">{note}</p>
      {hasLocation ? (
        <div className="event-preview-location-card">
          <strong>{venueName || previewDefaultDraft.reception.venueName}</strong>
          {address ? <span>{address}</span> : null}
          {mapsLink ? (
            <Button asChild variant="outline" size="sm" className="event-preview-map-button">
              <a href={mapsLink} target="_blank" rel="noreferrer">
                Open in Google Maps
              </a>
            </Button>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}

function TimelinePreview({ draft }: { draft: EventWebsitePreviewDraft }) {
  const items = normalizeTimelineItems(draft.timelineProgram.items);

  return (
    <section className="event-preview-section">
      <Badge variant="outline" className="event-preview-section-label">
        Timeline / Program
      </Badge>
      <h3>Wedding Day Timeline</h3>
      <p className="event-preview-copy">Here is the flow of the day so guests know what to expect.</p>
      <div className="event-preview-timeline-list">
        {items.map((item, index) => (
          <div key={`${item.title}-${index}`} className="event-preview-timeline-item">
            <div className="event-preview-timeline-rail" aria-hidden="true" />
            <div className="event-preview-timeline-card">
              {item.time ? <span className="event-preview-timeline-time">{item.time}</span> : null}
              <strong>{item.title || "Program Item"}</strong>
              {item.description ? <p>{item.description}</p> : null}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function EntouragePreview({ draft }: { draft: EventWebsitePreviewDraft }) {
  const intro = draft.entourage.introLine.trim();
  const groups = normalizeEntourageGroups(draft.entourage.groups);

  return (
    <section className="event-preview-section">
      <Badge variant="outline" className="event-preview-section-label">
        Entourage
      </Badge>
      <h3>Wedding Entourage</h3>
      {intro ? <p className="event-preview-copy">{intro}</p> : null}
      <div className="event-preview-party-grid">
        {groups.map((group, index) => (
          <div key={`${group.groupTitle}-${index}`} className="event-preview-party-card">
            <strong>{group.groupTitle}</strong>
            <p>{group.names}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function PrincipalSponsorsPreview({ draft }: { draft: EventWebsitePreviewDraft }) {
  const intro = draft.principalSponsors.introLine.trim();
  const names = normalizeLineList(draft.principalSponsors.names);

  return (
    <section className="event-preview-section">
      <Badge variant="outline" className="event-preview-section-label">
        Principal Sponsors
      </Badge>
      <h3>Principal Sponsors</h3>
      {intro ? <p className="event-preview-copy">{intro}</p> : null}
      <div className="event-preview-sponsor-list">
        {names.map((name, index) => (
          <span key={`${name}-${index}`}>{name}</span>
        ))}
      </div>
    </section>
  );
}

function AttirePreview({ draft }: { draft: EventWebsitePreviewDraft }) {
  const values = draft.attireDressCode;
  const intro = values.sectionIntro.trim();
  const cards = [
    {
      body: values.dressCodeNote.trim(),
      title: "Dress Code",
    },
    {
      body: values.colorMotifNote.trim(),
      title: "Color / Motif",
    },
  ].filter((card) => card.body);
  const fallbackCards =
    cards.length > 0
      ? cards
      : [
        { body: previewDefaultDraft.attireDressCode.dressCodeNote, title: "Dress Code" },
        { body: previewDefaultDraft.attireDressCode.colorMotifNote, title: "Color / Motif" },
      ];

  return (
    <section className="event-preview-section">
      <Badge variant="outline" className="event-preview-section-label">
        Attire / Dress Code
      </Badge>
      <h3>Attire / Dress Code</h3>
      {intro ? <p className="event-preview-copy">{intro}</p> : null}
      <div className="event-preview-guidance-grid">
        {fallbackCards.map((card) => (
          <div key={card.title} className="event-preview-guidance-card">
            <strong>{card.title}</strong>
            <p>{card.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function ExtraInfoPreview({ draft }: { draft: EventWebsitePreviewDraft }) {
  const values = draft.extraInfo;
  const title = withFallback(values.sectionTitle, previewDefaultDraft.extraInfo.sectionTitle);
  const intro = values.sectionIntro.trim();
  const items = normalizeExtraInfoItems(values.items);

  return (
    <section className="event-preview-section">
      <Badge variant="outline" className="event-preview-section-label">
        Extra Info
      </Badge>
      <h3>{title}</h3>
      {intro ? <p className="event-preview-copy">{intro}</p> : null}
      <div className="event-preview-note-grid">
        {items.map((item, index) => (
          <div key={`${item.title}-${index}`} className="event-preview-note-card">
            <strong>{item.title}</strong>
            <p>{item.details}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function RsvpFormPreview({ draft }: { draft: EventWebsitePreviewDraft }) {
  const [previewCompanionCount, setPreviewCompanionCount] = useState(0);
  const rsvp = draft.rsvpForm;
  const maxCompanions = Math.max(1, Number(rsvp.companionLimit) || 1);
  const companionOptions = Array.from({ length: maxCompanions + 1 }, (_, i) => i);

  return (
    <section className="event-preview-section">
      <Badge variant="outline" className="event-preview-section-label">
        RSVP
      </Badge>
      <h3>Confirm Your Attendance</h3>
      <p className="event-preview-copy">
        Please confirm your attendance so we can prepare your seat and celebration details.
      </p>
      <form className="event-preview-rsvp-card" onSubmit={(event) => event.preventDefault()}>
        <label className="event-preview-field">
          <span>Guest Name</span>
          <input type="text" placeholder="Your full name" />
        </label>

        <div className="event-preview-choice-group" aria-label="Attendance">
          <button type="button" className="is-selected">Yes, I will attend</button>
          <button type="button">Sorry, I can&apos;t attend</button>
        </div>

        {rsvp.plusOneEnabled ? (
          <div className="event-preview-field">
            <span>Guest Count</span>
            <p className="text-[11.5px] text-[#7a746f] mb-1 leading-snug">
              Choose how many companions you will bring. You may bring up to {maxCompanions}.
            </p>
            {maxCompanions >= 4 ? (
              <select
                value={previewCompanionCount}
                onChange={(e) => setPreviewCompanionCount(Number(e.target.value))}
              >
                {companionOptions.map((count) => (
                  <option key={count} value={count}>
                    {count === 0 ? "Just me" : `Me + ${count}`}
                  </option>
                ))}
              </select>
            ) : (
              <div className="event-preview-choice-group" aria-label="Guest count">
                {companionOptions.map((count) => (
                  <button
                    key={count}
                    type="button"
                    className={count === previewCompanionCount ? "is-selected" : ""}
                    onClick={() => setPreviewCompanionCount(count)}
                  >
                    {count === 0 ? "Just me" : `Me + ${count}`}
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : null}

        {rsvp.plusOneEnabled && (rsvp.companionNameEnabled || rsvp.companionAgeEnabled) && previewCompanionCount > 0 ? (
          <div className="event-preview-field">
            <span>Companion Details</span>
            <div className="flex flex-col gap-3 mt-1">
              {Array.from({ length: previewCompanionCount }).map((_, i) => (
                <div key={i} className="flex flex-col gap-2 p-3 bg-[#fbfbfa] border border-[#ece9e5] rounded-[10px]">
                  <span className="!text-[11px] !font-bold">Companion {i + 1}</span>
                  {rsvp.companionNameEnabled ? (
                    <input type="text" placeholder="Full Name" />
                  ) : null}
                  {rsvp.companionAgeEnabled ? (
                    <input type="text" placeholder="Age" />
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {rsvp.foodAllergiesEnabled ? (
          <label className="event-preview-field">
            <span>Food Allergies / Dietary Restrictions</span>
            <textarea placeholder="List any allergies or dietary restrictions for you or your companions." />
          </label>
        ) : null}

        {rsvp.messageToHostEnabled ? (
          <label className="event-preview-field">
            <span>Message to the Couple</span>
            <textarea placeholder="Leave a short message." />
          </label>
        ) : null}

        <Button type="button" className="event-preview-submit-button">
          Submit RSVP
        </Button>
      </form>
    </section>
  );
}

function GiftDetailsPreview({ draft }: { draft: EventWebsitePreviewDraft }) {
  const values = draft.giftDetails;
  const intro = values.sectionIntro.trim() || previewDefaultDraft.giftDetails.sectionIntro;
  const note = values.giftNote.trim() || previewDefaultDraft.giftDetails.giftNote;
  const options = normalizeGiftOptions(values.options);

  return (
    <section className="event-preview-section">
      <Badge variant="outline" className="event-preview-section-label">
        Gift Details
      </Badge>
      <h3>Gift Details</h3>
      <p className="event-preview-copy">{intro}</p>
      <p className="event-preview-copy">{note}</p>
      <div className="event-preview-gift-grid">
        {options.map((option, index) => (
          <div key={`${option.title}-${index}`} className="event-preview-gift-card">
            <GiftPreviewMedia file={option.file} title={option.title} />
            <strong>{option.title}</strong>
          </div>
        ))}
      </div>
    </section>
  );
}

function MessagesPreview({ draft }: { draft: EventWebsitePreviewDraft }) {
  const title = withFallback(draft.messages.sectionTitle, previewDefaultDraft.messages.sectionTitle);
  const body = draft.messages.messageBody.trim() || previewDefaultDraft.messages.messageBody;

  return (
    <section className="event-preview-section">
      <Badge variant="outline" className="event-preview-section-label">
        Messages
      </Badge>
      <h3>{title}</h3>
      <div className="event-preview-message-card">
        <p>{body}</p>
      </div>
    </section>
  );
}

function LoveStoryPreview({ draft }: { draft: EventWebsitePreviewDraft }) {
  const intro = draft.loveStory.sectionIntro.trim();
  const title = withFallback(draft.loveStory.storyTitle, previewDefaultDraft.loveStory.storyTitle);
  const body = draft.loveStory.storyBody.trim() || previewDefaultDraft.loveStory.storyBody;

  return (
    <section className="event-preview-section">
      <Badge variant="outline" className="event-preview-section-label">
        Love Story
      </Badge>
      <h3>Love Story</h3>
      {intro ? <p className="event-preview-copy">{intro}</p> : null}
      <div className="event-preview-story-card">
        <strong>{title}</strong>
        <p>{body}</p>
      </div>
    </section>
  );
}

function ContactSocialsPreview({ draft }: { draft: EventWebsitePreviewDraft }) {
  const hasAnyContent = Object.values(draft.contactSocials).some((value) => value.trim());
  const values = hasAnyContent ? draft.contactSocials : previewDefaultDraft.contactSocials;
  const contactPerson = values.contactPerson.trim();
  const contactNumber = values.contactNumber.trim();
  const email = values.email.trim();
  const socialLinks = [
    { label: "Facebook", value: values.facebookUrl.trim() },
    { label: "Instagram", value: values.instagramUrl.trim() },
    { label: "TikTok", value: values.tikTokUrl.trim() },
  ].filter((item) => item.value);
  const brandLine = withFallback(
    draft.coupleInfo.displayAs,
    previewDefaultDraft.coupleInfo.displayAs,
  );

  return (
    <footer className="event-preview-section event-preview-section--footer">
      <Badge variant="outline" className="event-preview-section-label">
        Contact & Socials
      </Badge>
      <h3>Need help?</h3>
      <p className="event-preview-copy">
        Reach out if you need help with directions, RSVP details, or event updates.
      </p>
      <div className="event-preview-footer-card">
        {contactPerson ? (
          <span className="event-preview-footer-line">
            <UsersRound className="size-4" aria-hidden="true" />
            {contactPerson}
          </span>
        ) : null}
        {contactNumber ? (
          <span className="event-preview-footer-line">
            <Phone className="size-4" aria-hidden="true" />
            {contactNumber}
          </span>
        ) : null}
        {email ? (
          <span className="event-preview-footer-line">
            <Mail className="size-4" aria-hidden="true" />
            {email}
          </span>
        ) : null}
      </div>
      {socialLinks.length > 0 ? (
        <div className="event-preview-social-row">
          {socialLinks.map((item) => (
            <Button key={item.label} type="button" variant="outline" size="sm" className="event-preview-social-button">
              {item.label}
            </Button>
          ))}
        </div>
      ) : null}
      <p className="event-preview-footer-brand">{brandLine} · Wedding RSVP</p>
    </footer>
  );
}

function GiftPreviewMedia({ file, title }: { file: File | null; title: string }) {
  const imageUrl = useMemo(() => (file ? URL.createObjectURL(file) : null), [file]);

  useEffect(() => {
    return () => {
      if (imageUrl) {
        URL.revokeObjectURL(imageUrl);
      }
    };
  }, [imageUrl]);

  if (!imageUrl) {
    return (
      <div className="event-preview-gift-placeholder" aria-hidden="true">
        <Gift className="size-5" />
      </div>
    );
  }

  return (
    <div className="event-preview-gift-image">
      <Image
        src={imageUrl}
        alt={`${title || "Gift option"} preview`}
        fill
        unoptimized
        sizes="160px"
      />
    </div>
  );
}

function MajorDivider() {
  return (
    <div className="event-preview-major-divider" aria-hidden="true">
      <span />
    </div>
  );
}

function InternalDivider() {
  return <div className="event-preview-internal-divider" aria-hidden="true" />;
}

function normalizeTimelineItems(items: EventWebsitePreviewDraft["timelineProgram"]["items"]) {
  const cleaned = items
    .map((item) => ({
      description: item.description.trim(),
      time: item.time.trim()
        ? formatPreviewTime(item.time, item.time.trim())
        : "",
      title: item.title.trim(),
    }))
    .filter((item) => item.time || item.title || item.description)
    .map((item) => ({
      ...item,
      title: item.title || (item.description ? "Program Item" : ""),
    }));

  return cleaned.length > 0
    ? cleaned
    : previewDefaultDraft.timelineProgram.items.map((item) => ({
      description: item.description,
      time: formatPreviewTime(item.time, item.time),
      title: item.title,
    }));
}

function normalizeEntourageGroups(groups: EventWebsitePreviewDraft["entourage"]["groups"]) {
  const cleaned = groups
    .map((group) => ({
      groupTitle: group.groupTitle.trim() || (group.names.trim() ? "Wedding Party" : ""),
      names: group.names.trim(),
    }))
    .filter((group) => group.names);

  return cleaned.length > 0 ? cleaned : previewDefaultDraft.entourage.groups;
}

function normalizeLineList(value: string): string[] {
  const items = value
    .split("\n")
    .map((entry) => entry.trim())
    .filter(Boolean);

  return items.length > 0 ? items : normalizeLineList(previewDefaultDraft.principalSponsors.names);
}

function normalizeExtraInfoItems(items: EventWebsitePreviewDraft["extraInfo"]["items"]) {
  const cleaned = items
    .map((item) => ({
      details: item.details.trim(),
      title: item.title.trim() || (item.details.trim() ? "Note" : ""),
    }))
    .filter((item) => item.details);

  return cleaned.length > 0 ? cleaned : previewDefaultDraft.extraInfo.items;
}

function normalizeGiftOptions(options: EventWebsitePreviewDraft["giftDetails"]["options"]) {
  const cleaned = options.filter((option) => option.title.trim() || option.file);
  return cleaned.length > 0 ? cleaned : previewDefaultDraft.giftDetails.options;
}

function buildCountdownItems(eventDate: string, eventTime: string, now: number) {
  const targetTime = parseCountdownTarget(eventDate, eventTime);

  if (targetTime === null) {
    return createZeroCountdownItems();
  }

  const remainingMs = Math.max(0, targetTime - now);
  const totalSeconds = Math.floor(remainingMs / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return [
    { label: "Days", value: formatCountdownValue(days) },
    { label: "Hours", value: formatCountdownValue(hours) },
    { label: "Minutes", value: formatCountdownValue(minutes) },
    { label: "Seconds", value: formatCountdownValue(seconds) },
  ];
}

function createZeroCountdownItems() {
  return [
    { label: "Days", value: "00" },
    { label: "Hours", value: "00" },
    { label: "Minutes", value: "00" },
    { label: "Seconds", value: "00" },
  ];
}

function parseCountdownTarget(eventDate: string, eventTime: string) {
  const normalizedDate = eventDate.trim();
  const normalizedTime = eventTime.trim();

  if (!normalizedDate || !normalizedTime) {
    return null;
  }

  const parsedDate = new Date(`${normalizedDate}T${normalizedTime}`);

  if (Number.isNaN(parsedDate.getTime())) {
    return null;
  }

  return parsedDate.getTime();
}

function formatCountdownValue(value: number) {
  return `${value}`.padStart(2, "0");
}

function withFallback(value: string, fallback: string) {
  return value.trim() || fallback;
}

"use client";

import { motion } from "motion/react";
import {
  CalendarDays,
  ChevronDown,
  Gift,
  Mail,
  MessageCircleHeart,
  MapPin,
  Music,
  Phone,
  Play,
  UsersRound,
} from "lucide-react";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import type { EventWebsiteSectionKey } from "@/config/event-website-sections";
import {
  formatPreviewDate,
  formatPreviewDateTime,
  formatPreviewTime,
  getPreviewDefaultDraft,
} from "@/components/dashboard/event/event-website-preview-data";
import {
  eventWebsiteRenderModelSectionKeys,
  type EventWebsiteRenderModel,
} from "@/lib/event-website/render-model";
import type {
  EventWebsiteContentEventType,
  EventWebsiteGuestbookMessage,
} from "@/lib/event-website/types";
import {
  RSVP_ATTENDANCE_LABEL,
  RSVP_EMAIL_LABEL,
  RSVP_GUEST_COUNT_LABEL,
  RSVP_GUEST_NAME_LABEL,
  RSVP_MESSAGE_HELPER,
  RSVP_MESSAGE_LABEL,
  RSVP_MESSAGE_PRIVACY_COPY,
  RSVP_PHONE_LABEL,
} from "@/lib/event-website/rsvp-form-copy";
import { PublicRsvpResponseForm } from "@/components/public-rsvp/public-rsvp-response-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { EventWebsiteRsvpFormSection } from "@/lib/event-website/types";
import { PUBLIC_RSVP_MESSAGE_MAX_LENGTH } from "@/lib/validations/rsvp-response.schema";
import { cn } from "@/lib/utils";

type EventWebsiteRendererProps = {
  draft: EventWebsiteRenderModel;
  guestbookMessages?: EventWebsiteGuestbookMessage[];
  hideEmptyGuestbook?: boolean;
  highlightActiveSection?: boolean;
  publicRsvp?: {
    availabilityMessage: string | null;
    eventSlug: string;
    isAcceptingResponses: boolean;
    settings: EventWebsiteRsvpFormSection;
  } | null;
  sections: EventWebsiteSectionKey[];
  selectedSectionKey?: EventWebsiteSectionKey;
};

const supportedSectionKeySet = new Set<EventWebsiteSectionKey>(eventWebsiteRenderModelSectionKeys);

function getDraftFallback(draft: EventWebsiteRenderModel) {
  const eventKind = draft.hostInfo?.kind || "wedding";
  return getPreviewDefaultDraft(eventKind);
}

export function EventWebsiteRenderer({
  draft,
  guestbookMessages = [],
  hideEmptyGuestbook = false,
  highlightActiveSection = false,
  publicRsvp = null,
  sections,
  selectedSectionKey,
}: EventWebsiteRendererProps) {
  const visibleSections = sections.filter(
    (sectionKey) =>
      supportedSectionKeySet.has(sectionKey) &&
      !(sectionKey === "guestbook" && hideEmptyGuestbook && guestbookMessages.length === 0),
  );

  return (
    <>
      {visibleSections.map((sectionKey, index) => (
        <SectionRouter
          key={sectionKey}
          draft={draft}
          guestbookMessages={guestbookMessages}
          isActive={highlightActiveSection && sectionKey === selectedSectionKey}
          publicRsvp={sectionKey === "rsvp_form" ? publicRsvp : null}
          sectionKey={sectionKey}
          showDivider={index > 0}
        />
      ))}
    </>
  );
}

function SectionRouter({
  draft,
  guestbookMessages,
  isActive,
  publicRsvp,
  sectionKey,
  showDivider,
}: {
  draft: EventWebsiteRenderModel;
  guestbookMessages: EventWebsiteGuestbookMessage[];
  isActive: boolean;
  publicRsvp: EventWebsiteRendererProps["publicRsvp"];
  sectionKey: EventWebsiteSectionKey;
  showDivider: boolean;
}) {
  return (
    <>
      {showDivider ? <MajorDivider /> : null}
      <div
        className={cn("event-preview-section-anchor", isActive && "is-active-preview")}
        data-preview-section={sectionKey}
      >
        {sectionKey === "host_info" ? <HostInfoSection draft={draft} /> : null}
        {sectionKey === "countdown" ? <CountdownSection draft={draft} /> : null}
        {sectionKey === "music_effects" ? <MusicSection draft={draft} /> : null}
        {sectionKey === "gallery" ? <GallerySection draft={draft} /> : null}
        {sectionKey === "main_event" ? <CeremonySection draft={draft} /> : null}
        {sectionKey === "venue" ? <VenueSection draft={draft} /> : null}
        {sectionKey === "secondary_event" ? <ReceptionSection draft={draft} /> : null}
        {sectionKey === "timeline_program" ? <TimelineSection draft={draft} /> : null}
        {sectionKey === "entourage" ? <EntourageSection draft={draft} /> : null}
        {sectionKey === "principal_sponsors" ? <PrincipalSponsorsSection draft={draft} /> : null}
        {sectionKey === "attire_motif" ? <AttireSection draft={draft} /> : null}
        {sectionKey === "extra_info" ? <ExtraInfoSection draft={draft} /> : null}
        {sectionKey === "rsvp_form" ? (
          <RsvpFormSection draft={draft} publicRsvp={publicRsvp} />
        ) : null}
        {sectionKey === "gift_details" ? <GiftDetailsSection draft={draft} /> : null}
        {sectionKey === "guestbook" ? (
          <GuestbookSection draft={draft} guestbookMessages={guestbookMessages} />
        ) : null}
        {sectionKey === "story_message" ? (
          <LoveStorySection draft={draft} />
        ) : null}
        {sectionKey === "contact_socials" ? <ContactSocialsSection draft={draft} /> : null}
        {sectionKey === "eighteen_roses_candles" ? <TraditionsSection draft={draft} /> : null}
        {sectionKey === "debut_court" ? (
          <NamedGroupsSection title="Debut Court" groups={draft.debutCourt.groups} />
        ) : null}
        {sectionKey === "godparents" ? (
          <NamedGroupsSection title="Godparents" groups={draft.godparents.groups} />
        ) : null}
      </div>
    </>
  );
}

function HostInfoSection({ draft }: { draft: EventWebsiteRenderModel }) {
  const hostInfo = draft.hostInfo;
  const fallbackDraft = getDraftFallback(draft);

  if (hostInfo.kind !== "wedding") {
    const fallbackHost = fallbackDraft.hostInfo;
    const rawPrimary =
      hostInfo.kind === "birthday"
        ? hostInfo.celebrantName
        : hostInfo.kind === "debut"
          ? hostInfo.debutantName
          : hostInfo.childName;

    const fallbackPrimary =
      fallbackHost.kind === "birthday"
        ? fallbackHost.celebrantName
        : fallbackHost.kind === "debut"
          ? fallbackHost.debutantName
          : fallbackHost.kind === "baptism"
            ? fallbackHost.childName
            : "Celebrant";

    const primary = withFallback(rawPrimary, fallbackPrimary);
    const label =
      hostInfo.kind === "birthday"
        ? "Celebrant Info"
        : hostInfo.kind === "debut"
          ? "Debutant Info"
          : "Child & Parents";

    const rawSupporting = hostInfo.kind === "baptism" ? hostInfo.parentNames : hostInfo.milestone;
    const fallbackSupporting =
      fallbackHost.kind === "baptism"
        ? fallbackHost.parentNames
        : fallbackHost.kind === "birthday" || fallbackHost.kind === "debut"
          ? fallbackHost.milestone
          : "";
    const supporting = withFallback(rawSupporting, fallbackSupporting);

    const displayAs =
      hostInfo.displayAs.trim() ||
      (hostInfo.kind === "debut"
        ? `${primary}'s ${supporting || "18th Birthday"}`
        : hostInfo.kind === "birthday"
          ? `${primary}'s Birthday`
          : hostInfo.kind === "baptism"
            ? `${primary}'s Christening`
            : primary);

    return (
      <section className="event-preview-section event-preview-section--hero">
        <Badge variant="outline" className="event-preview-section-label">
          {label}
        </Badge>
        {hostInfo.hostLine.trim() ? (
          <p className="event-preview-host-line">{hostInfo.hostLine}</p>
        ) : null}
        <h2>{displayAs}</h2>
        {supporting ? <p className="event-preview-copy">{supporting}</p> : null}
        {hostInfo.shortHostMessage.trim() ? (
          <p className="event-preview-copy">{hostInfo.shortHostMessage}</p>
        ) : null}
      </section>
    );
  }
  const coupleInfo = hostInfo;
  const groomName = withFallback(coupleInfo.groomName, fallbackDraft.coupleInfo.groomName);
  const brideName = withFallback(coupleInfo.brideName, fallbackDraft.coupleInfo.brideName);
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

const GALLERY_PLACEHOLDER_SEEDS: Record<
  EventWebsiteContentEventType,
  Array<{ alt: string; url: string }>
> = {
  wedding: [
    {
      alt: "Wedding couple moment",
      url: "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=800&q=80",
    },
    {
      alt: "Wedding rings and details",
      url: "https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?auto=format&fit=crop&w=800&q=80",
    },
    {
      alt: "Bridal portrait",
      url: "https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&w=800&q=80",
    },
    {
      alt: "Ceremony aisle and florals",
      url: "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=800&q=80",
    },
    {
      alt: "Sunset romance portrait",
      url: "https://images.unsplash.com/photo-1522673607200-164d1b6ce486?auto=format&fit=crop&w=800&q=80",
    },
    {
      alt: "Reception celebration",
      url: "https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?auto=format&fit=crop&w=800&q=80",
    },
  ],
  debut: [
    {
      alt: "Debutant portrait in gown",
      url: "https://images.unsplash.com/photo-1566737236500-c8ac43014a67?auto=format&fit=crop&w=800&q=80",
    },
    {
      alt: "Debut celebration bouquet",
      url: "https://images.unsplash.com/photo-1526047932273-341f2a7631f9?auto=format&fit=crop&w=800&q=80",
    },
    {
      alt: "Milestone celebration portrait",
      url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80",
    },
    {
      alt: "Debut ballroom ambiance",
      url: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=800&q=80",
    },
    {
      alt: "Celebration lights and smile",
      url: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=800&q=80",
    },
    {
      alt: "Party celebration moment",
      url: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=800&q=80",
    },
  ],
  birthday: [
    {
      alt: "Celebrant milestone portrait",
      url: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=800&q=80",
    },
    {
      alt: "Birthday party cheer",
      url: "https://images.unsplash.com/photo-1496337589254-7e19d01cec44?auto=format&fit=crop&w=800&q=80",
    },
    {
      alt: "Celebration confetti",
      url: "https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&w=800&q=80",
    },
    {
      alt: "Party gathering and drinks",
      url: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=800&q=80",
    },
    {
      alt: "Milestone toast",
      url: "https://images.unsplash.com/photo-1527529482837-4698179dc6ce?auto=format&fit=crop&w=800&q=80",
    },
    {
      alt: "Birthday party memories",
      url: "https://images.unsplash.com/photo-1530103862676-de8c9debad1d?auto=format&fit=crop&w=800&q=80",
    },
  ],
  baptism: [
    {
      alt: "Holy baptism ceremony candle",
      url: "https://images.unsplash.com/photo-1519817650390-64a93db51149?auto=format&fit=crop&w=800&q=80",
    },
    {
      alt: "Baptismal white flowers",
      url: "https://images.unsplash.com/photo-1520854221256-17451cc331bf?auto=format&fit=crop&w=800&q=80",
    },
    {
      alt: "Baby blessing portrait",
      url: "https://images.unsplash.com/photo-1555252333-9f8e92e65df9?auto=format&fit=crop&w=800&q=80",
    },
    {
      alt: "Church sanctuary and altar",
      url: "https://images.unsplash.com/photo-1548625361-19597a7e3734?auto=format&fit=crop&w=800&q=80",
    },
    {
      alt: "Family holding child",
      url: "https://images.unsplash.com/photo-1544126592-807ade215a0b?auto=format&fit=crop&w=800&q=80",
    },
    {
      alt: "Reception gathering",
      url: "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=800&q=80",
    },
  ],
};

function GallerySection({ draft }: { draft: EventWebsiteRenderModel }) {
  const kind =
    draft.hostInfo.kind === "wedding" ||
    draft.hostInfo.kind === "debut" ||
    draft.hostInfo.kind === "birthday" ||
    draft.hostInfo.kind === "baptism"
      ? draft.hostInfo.kind
      : "wedding";
  const images = GALLERY_PLACEHOLDER_SEEDS[kind];
  const sectionTitle = draft.gallery?.sectionTitle?.trim() || "Gallery";
  const sectionIntro = draft.gallery?.sectionIntro?.trim() || "Photo highlights and visual memories.";

  return (
    <section className="event-preview-section">
      <Badge variant="outline" className="event-preview-section-label">
        Gallery
      </Badge>
      <h3>{sectionTitle}</h3>
      {sectionIntro ? <p className="event-preview-copy">{sectionIntro}</p> : null}
      <div className="grid grid-cols-2 gap-2.5 pt-2 sm:grid-cols-3 sm:gap-3">
        {images.map((img, index) => (
          <div
            key={index}
            className="group relative aspect-[3/4] overflow-hidden rounded-xl border border-slate-200/80 bg-slate-100 shadow-sm transition duration-300 hover:shadow-md"
          >
            <img
              src={img.url}
              alt={img.alt}
              className="size-full object-cover transition duration-300 group-hover:scale-105"
              loading="lazy"
            />
          </div>
        ))}
      </div>
    </section>
  );
}

function TraditionsSection({ draft }: { draft: EventWebsiteRenderModel }) {
  const groups =
    draft.eighteenRosesCandles.groups.length > 0
      ? draft.eighteenRosesCandles.groups
      : getPreviewDefaultDraft("debut").eighteenRosesCandles.groups;

  return (
    <section className="event-preview-section">
      <Badge variant="outline" className="event-preview-section-label">
        18 Traditions
      </Badge>
      <h3>18 Traditions</h3>
      <p className="event-preview-copy">
        Honored participants and special dances for the debutant.
      </p>
      <div className="event-preview-party-grid">
        {groups.map((group) => (
          <div key={group.id} className="event-preview-party-card">
            <strong>{group.title || group.kind}</strong>
            {group.entries.length > 0 ? (
              <div className="space-y-1 pt-1 text-sm">
                {group.entries.map((entry) => (
                  <p key={entry.id} className="text-slate-600">
                    <span className="font-medium text-slate-800">{entry.name}</span>
                    {entry.message ? (
                      <span className="italic text-slate-500"> — {entry.message}</span>
                    ) : null}
                  </p>
                ))}
              </div>
            ) : (
              <p className="italic text-slate-400">No participants listed yet.</p>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

function NamedGroupsSection({
  title,
  groups,
}: {
  title: string;
  groups: EventWebsiteRenderModel["debutCourt"]["groups"];
}) {
  const isGodparents = title.toLowerCase().includes("godparent") || title === "Godparents";
  const defaultGroups = isGodparents
    ? getPreviewDefaultDraft("baptism").godparents.groups
    : getPreviewDefaultDraft("debut").debutCourt.groups;
  const displayGroups = groups.length > 0 ? groups : defaultGroups;

  return (
    <section className="event-preview-section">
      <Badge variant="outline" className="event-preview-section-label">
        {title}
      </Badge>
      <h3>{title}</h3>
      <div className="event-preview-party-grid">
        {displayGroups.map((group) => (
          <div key={group.id} className="event-preview-party-card">
            <strong>{group.title}</strong>
            {group.names.length > 0 ? (
              <div className="space-y-1 pt-1 text-sm">
                {group.names.map((entry) => (
                  <p key={entry.id} className="text-slate-700">
                    {entry.name}
                  </p>
                ))}
              </div>
            ) : (
              <p className="italic text-slate-400">No members listed yet.</p>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

function CountdownSection({ draft }: { draft: EventWebsiteRenderModel }) {
  const fallbackDraft = getDraftFallback(draft);
  const title = withFallback(draft.countdown.title, fallbackDraft.countdown.title);
  const shortNote = draft.countdown.shortNote.trim();
  const [now, setNow] = useState(0);
  const countdownItems = useMemo(
    () =>
      now === 0
        ? createZeroCountdownItems()
        : buildCountdownItems(draft.ceremony.eventDate, draft.ceremony.eventTime, now),
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
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="event-preview-countdown-card"
            initial={{ opacity: 0, scale: 0.96, y: 6 }}
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

function MusicSection({ draft }: { draft: EventWebsiteRenderModel }) {
  const fallbackDraft = getDraftFallback(draft);
  const values = draft.musicEffects;
  const title = withFallback(values.musicTitle, fallbackDraft.musicEffects.musicTitle);
  const buttonLabel = withFallback(
    values.playButtonLabel,
    fallbackDraft.musicEffects.playButtonLabel,
  );
  const note = values.shortNote.trim() || fallbackDraft.musicEffects.shortNote;

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
        {values.musicLink.trim() ? (
          <Button
            asChild
            type="button"
            variant="outline"
            size="sm"
            className="event-preview-music-button"
          >
            <a href={values.musicLink.trim()} target="_blank" rel="noreferrer">
              <Play className="size-3.5" aria-hidden="true" />
              {buttonLabel}
            </a>
          </Button>
        ) : (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="event-preview-music-button"
            disabled
          >
            <Play className="size-3.5" aria-hidden="true" />
            {buttonLabel}
          </Button>
        )}
      </div>
    </section>
  );
}

function CeremonySection({ draft }: { draft: EventWebsiteRenderModel }) {
  const ceremony = draft.ceremony;
  const isDebut = draft.hostInfo.kind === "debut";
  const isWedding = draft.hostInfo.kind === "wedding";
  const defaultDraft = getPreviewDefaultDraft(draft.hostInfo.kind);

  const date = formatPreviewDate(
    ceremony.eventDate,
    formatPreviewDate(defaultDraft.ceremony.eventDate, "Saturday, June 6, 2026"),
  );
  const startTime = formatPreviewTime(ceremony.eventTime, "4:00 PM");
  const endTime = formatPreviewTime(ceremony.endTime, isDebut ? "9:00 PM" : "6:00 PM");
  const rsvpDeadline = formatPreviewDateTime(ceremony.rsvpDeadline, "June 1, 2026 at 6:00 PM");
  const scheduleNote = ceremony.scheduleNote.trim() || defaultDraft.ceremony.scheduleNote;
  const badgeLabel =
    ceremony.eventLabel.trim() ||
    (isDebut ? "Debut Program" : isWedding ? "Ceremony" : "Main Event");
  const sectionHeading = withFallback(ceremony.eventLabel, defaultDraft.ceremony.eventLabel);

  return (
    <section className="event-preview-section">
      <Badge variant="outline" className="event-preview-section-label">
        {badgeLabel}
      </Badge>
      <h3>{sectionHeading}</h3>
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

function VenueSection({ draft }: { draft: EventWebsiteRenderModel }) {
  const fallbackDraft = getDraftFallback(draft);
  const venue = draft.venue;
  const mapsLink = venue.mapsLink.trim();
  const arrivalNote = venue.arrivalNote.trim();

  return (
    <section className="event-preview-section">
      <Badge variant="outline" className="event-preview-section-label">
        Venue
      </Badge>
      <h3>{withFallback(venue.venueName, fallbackDraft.venue.venueName)}</h3>
      <p className="event-preview-address-copy">
        <MapPin className="size-4" aria-hidden="true" />
        <span className="event-preview-address-text">
          {withFallback(venue.address, fallbackDraft.venue.address)}
        </span>
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

function ReceptionSection({ draft }: { draft: EventWebsiteRenderModel }) {
  const fallbackDraft = getDraftFallback(draft);
  const isBirthday = draft.hostInfo.kind === "birthday";
  const label = isBirthday ? "Reception / After-Party" : "Reception";
  const values = draft.reception;
  const startTime = formatPreviewTime(
    values.startTime,
    formatPreviewTime(fallbackDraft.reception.startTime, "6:00 PM"),
  );
  const endTime = formatPreviewTime(
    values.endTime,
    formatPreviewTime(fallbackDraft.reception.endTime, "9:00 PM"),
  );
  const note = values.note.trim() || fallbackDraft.reception.note;
  const venueName = values.venueName.trim();
  const address = values.address.trim();
  const mapsLink = values.mapsLink.trim();
  const hasLocation = Boolean(venueName || address);

  return (
    <section className="event-preview-section">
      <Badge variant="outline" className="event-preview-section-label">
        {label}
      </Badge>
      <h3>{withFallback(values.title, fallbackDraft.reception.title)}</h3>
      <div className="event-preview-inline-card">
        <CalendarDays className="size-4" aria-hidden="true" />
        <span>
          {startTime} - {endTime}
        </span>
      </div>
      <p className="event-preview-copy">{note}</p>
      {hasLocation ? (
        <div className="event-preview-location-card">
          <strong>{venueName || fallbackDraft.reception.venueName}</strong>
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

function TimelineSection({ draft }: { draft: EventWebsiteRenderModel }) {
  const isDebut = draft.hostInfo.kind === "debut";
  const isWedding = draft.hostInfo.kind === "wedding";
  const isBirthday = draft.hostInfo.kind === "birthday";
  const isBaptism = draft.hostInfo.kind === "baptism";
  const items = normalizeTimelineItems(draft.timelineProgram.items, draft.hostInfo.kind);

  return (
    <section className="event-preview-section">
      <Badge variant="outline" className="event-preview-section-label">
        Timeline / Program
      </Badge>
      <h3>
        {isDebut
          ? "Debut Program Flow"
          : isWedding
            ? "Wedding Day Timeline"
            : isBirthday
              ? "Birthday Party Flow"
              : isBaptism
                ? "Christening Flow"
                : "Event Schedule & Flow"}
      </h3>
      <p className="event-preview-copy">
        Here is the flow of the day so guests know what to expect.
      </p>
      <div className="event-preview-timeline-list">
        {items.map((item, index) => (
          <div key={item.id || `timeline-${index + 1}`} className="event-preview-timeline-item">
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

function EntourageSection({ draft }: { draft: EventWebsiteRenderModel }) {
  const intro = draft.entourage.introLine.trim();
  const groups = normalizeEntourageGroups(draft.entourage.groups, draft.hostInfo.kind);

  return (
    <section className="event-preview-section">
      <Badge variant="outline" className="event-preview-section-label">
        Entourage
      </Badge>
      <h3>Wedding Entourage</h3>
      {intro ? <p className="event-preview-copy">{intro}</p> : null}
      <div className="event-preview-party-grid">
        {groups.map((group, index) => (
          <div key={group.id || `entourage-${index + 1}`} className="event-preview-party-card">
            <strong>{group.groupTitle}</strong>
            {group.names ? <p>{group.names}</p> : null}
          </div>
        ))}
      </div>
    </section>
  );
}

function PrincipalSponsorsSection({ draft }: { draft: EventWebsiteRenderModel }) {
  const isSpecialSponsors = draft.hostInfo.kind === "debut" || draft.hostInfo.kind === "birthday";
  const label = isSpecialSponsors ? "Special Sponsors" : "Principal Sponsors";
  const intro = draft.principalSponsors.introLine.trim();
  const names = normalizeLineList(draft.principalSponsors.names, draft.hostInfo.kind);

  return (
    <section className="event-preview-section">
      <Badge variant="outline" className="event-preview-section-label">
        {label}
      </Badge>
      <h3>{label}</h3>
      {intro ? <p className="event-preview-copy">{intro}</p> : null}
      <div className="event-preview-sponsor-list">
        {names.map((name, index) => (
          <span key={`${name}-${index}`}>{name}</span>
        ))}
      </div>
    </section>
  );
}

function AttireSection({ draft }: { draft: EventWebsiteRenderModel }) {
  const fallbackDraft = getDraftFallback(draft);
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
          { body: fallbackDraft.attireDressCode.dressCodeNote, title: "Dress Code" },
          { body: fallbackDraft.attireDressCode.colorMotifNote, title: "Color / Motif" },
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

function ExtraInfoSection({ draft }: { draft: EventWebsiteRenderModel }) {
  const fallbackDraft = getDraftFallback(draft);
  const values = draft.extraInfo;
  const title = withFallback(values.sectionTitle, fallbackDraft.extraInfo.sectionTitle);
  const intro = values.sectionIntro.trim();
  const items = normalizeExtraInfoItems(values.items, draft.hostInfo.kind);

  return (
    <section className="event-preview-section">
      <Badge variant="outline" className="event-preview-section-label">
        Extra Info
      </Badge>
      <h3>{title}</h3>
      {intro ? <p className="event-preview-copy">{intro}</p> : null}
      <div className="event-preview-note-grid">
        {items.map((item, index) => (
          <div key={item.id || `extra-info-${index + 1}`} className="event-preview-note-card">
            <strong>{item.title}</strong>
            {item.details ? <p>{item.details}</p> : null}
          </div>
        ))}
      </div>
    </section>
  );
}

function RsvpFormSection({
  draft,
  publicRsvp,
}: {
  draft: EventWebsiteRenderModel;
  publicRsvp: EventWebsiteRendererProps["publicRsvp"];
}) {
  const [previewCompanionCount, setPreviewCompanionCount] = useState(0);
  const rsvp = draft.rsvpForm;
  const shouldShowPhone = rsvp.phoneEnabled;
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
      {publicRsvp ? (
        <div className="event-preview-rsvp-public-shell" id="rsvp-form">
          <PublicRsvpResponseForm
            availabilityMessage={publicRsvp.availabilityMessage}
            eventSlug={publicRsvp.eventSlug}
            isAcceptingResponses={publicRsvp.isAcceptingResponses}
            settings={publicRsvp.settings}
          />
        </div>
      ) : (
        <form className="event-preview-rsvp-card" onSubmit={(event) => event.preventDefault()}>
          <label className="event-preview-field">
            <span>{RSVP_GUEST_NAME_LABEL}</span>
            <input type="text" placeholder="Your full name" />
          </label>

          <label className="event-preview-field">
            <span>{RSVP_EMAIL_LABEL}</span>
            <input type="email" placeholder="you@example.com" />
          </label>

          {shouldShowPhone ? (
            <label className="event-preview-field">
              <span>{RSVP_PHONE_LABEL}</span>
              <input type="tel" placeholder="09XXXXXXXXX" />
            </label>
          ) : null}

          <div className="event-preview-field">
            <span>{RSVP_ATTENDANCE_LABEL}</span>
            <div className="event-preview-choice-group" aria-label={RSVP_ATTENDANCE_LABEL}>
              <button type="button" className="is-selected">
                Yes, I will attend
              </button>
              <button type="button">Sorry, I can&apos;t attend</button>
            </div>
          </div>

          {rsvp.plusOneEnabled ? (
            <div className="event-preview-field">
              <span>{RSVP_GUEST_COUNT_LABEL}</span>
              <p className="mb-1 text-[11.5px] leading-snug text-[#7a746f]">
                Choose how many companions you will bring. You may bring up to {maxCompanions}.
              </p>
              {maxCompanions >= 4 ? (
                <div className="event-preview-select-shell">
                  <select
                    value={previewCompanionCount}
                    onChange={(event) => setPreviewCompanionCount(Number(event.target.value))}
                  >
                    {companionOptions.map((count) => (
                      <option key={count} value={count}>
                        {count === 0 ? "Just me" : `Me + ${count}`}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="event-preview-select-chevron" aria-hidden="true" />
                </div>
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

          {rsvp.plusOneEnabled &&
          (rsvp.companionNameEnabled || rsvp.companionAgeEnabled) &&
          previewCompanionCount > 0 ? (
            <div className="event-preview-field">
              <span>Companion Details</span>
              <div className="mt-1 flex flex-col gap-3">
                {Array.from({ length: previewCompanionCount }).map((_, index) => (
                  <div
                    key={index}
                    className="flex flex-col gap-2 rounded-[10px] border border-[#ece9e5] bg-[#fbfbfa] p-3"
                  >
                    <span className="!text-[11px] !font-bold">Companion {index + 1}</span>
                    {rsvp.companionNameEnabled ? (
                      <input type="text" placeholder="Full Name" />
                    ) : null}
                    {rsvp.companionAgeEnabled ? <input type="text" placeholder="Age" /> : null}
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

          <label className="event-preview-field">
            <span>{RSVP_MESSAGE_LABEL}</span>
            <p className="text-[11.5px] leading-snug text-[#7a746f]">{RSVP_MESSAGE_HELPER}</p>
            <textarea
              placeholder="Leave a short message."
              maxLength={PUBLIC_RSVP_MESSAGE_MAX_LENGTH}
            />
            <p className="text-[11.5px] leading-snug text-[#7a746f]">{RSVP_MESSAGE_PRIVACY_COPY}</p>
          </label>

          <Button type="button" className="event-preview-submit-button">
            Submit RSVP
          </Button>
        </form>
      )}
    </section>
  );
}

function GiftDetailsSection({ draft }: { draft: EventWebsiteRenderModel }) {
  const fallbackDraft = getDraftFallback(draft);
  const values = draft.giftDetails;
  const intro = values.sectionIntro.trim() || fallbackDraft.giftDetails.sectionIntro;
  const note = values.giftNote.trim() || fallbackDraft.giftDetails.giftNote;
  const options = normalizeGiftOptions(values.options, draft.hostInfo.kind);

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
          <div key={option.id || `gift-option-${index + 1}`} className="event-preview-gift-card">
            <GiftPreviewMedia file={option.file} image={option.image} title={option.title} />
            <strong>{option.title}</strong>
          </div>
        ))}
      </div>
    </section>
  );
}

function GuestbookSection({
  draft,
  guestbookMessages,
}: {
  draft: EventWebsiteRenderModel;
  guestbookMessages: EventWebsiteGuestbookMessage[];
}) {
  const fallbackDraft = getDraftFallback(draft);
  const title = withFallback(
    draft.guestbook.sectionTitle,
    fallbackDraft.guestbook.sectionTitle,
  );
  const intro = draft.guestbook.sectionIntro.trim() || fallbackDraft.guestbook.sectionIntro;
  const emptyState =
    draft.guestbook.emptyStateMessage.trim() || fallbackDraft.guestbook.emptyStateMessage;

  return (
    <section className="event-preview-section event-preview-section--guestbook">
      <Badge variant="outline" className="event-preview-section-label">
        Guestbook
      </Badge>
      <h3>{title}</h3>
      {intro ? <p className="event-preview-copy">{intro}</p> : null}
      {guestbookMessages.length > 0 ? (
        <div className="event-preview-guestbook-stack">
          {guestbookMessages.map((message) => (
            <GuestbookMessageCard key={message.id} message={message} />
          ))}
        </div>
      ) : (
        <div className="event-preview-message-card event-preview-message-card--empty">
          <p>{emptyState}</p>
        </div>
      )}
    </section>
  );
}

function GuestbookMessageCard({ message }: { message: EventWebsiteGuestbookMessage }) {
  const isExpandable = message.message.length > 180 || /\n.{0,}\n/.test(message.message);
  const [isExpanded, setIsExpanded] = useState(false);
  const displayedDate = message.submittedAt ?? message.approvedAt;

  return (
    <article className="event-preview-message-card">
      <div className="event-preview-message-card-inner">
        <span className="event-preview-message-icon" aria-hidden="true">
          <MessageCircleHeart className="size-4" aria-hidden="true" />
        </span>
        <div className="event-preview-message-body">
          <strong>{message.guestName}</strong>
          <p
            className={cn(
              "event-preview-message-text",
              isExpandable && "is-expandable",
              isExpanded && "is-expanded",
            )}
          >
            {message.message}
          </p>
          {isExpandable ? (
            <button
              type="button"
              className="event-preview-message-toggle"
              onClick={() => setIsExpanded((current) => !current)}
            >
              {isExpanded ? "Show less" : "View more"}
            </button>
          ) : null}
          {displayedDate ? (
            <p className="event-preview-message-date">{formatGuestbookDate(displayedDate)}</p>
          ) : null}
        </div>
      </div>
    </article>
  );
}

function LoveStorySection({ draft }: { draft: EventWebsiteRenderModel }) {
  const fallbackDraft = getDraftFallback(draft);
  const isBirthday = draft.hostInfo.kind === "birthday";
  const isDebut = draft.hostInfo.kind === "debut";
  const isBaptism = draft.hostInfo.kind === "baptism";
  const sectionLabel = isBaptism
    ? "Parents' Dedication"
    : isDebut
      ? "My Journey"
      : isBirthday
        ? "Celebrant Story"
        : "Love Story";
  const intro = draft.loveStory.sectionIntro.trim();
  const title = withFallback(draft.loveStory.storyTitle, fallbackDraft.loveStory.storyTitle);
  const body = draft.loveStory.storyBody.trim() || fallbackDraft.loveStory.storyBody;

  return (
    <section className="event-preview-section">
      <Badge variant="outline" className="event-preview-section-label">
        {sectionLabel}
      </Badge>
      <h3>{sectionLabel}</h3>
      {intro ? <p className="event-preview-copy">{intro}</p> : null}
      <div className="event-preview-story-card">
        <strong>{title}</strong>
        <p>{body}</p>
      </div>
    </section>
  );
}

function ContactSocialsSection({ draft }: { draft: EventWebsiteRenderModel }) {
  const fallbackDraft = getDraftFallback(draft);
  const hasAnyContent = Object.values(draft.contactSocials).some((value) => value.trim());
  const values = hasAnyContent ? draft.contactSocials : fallbackDraft.contactSocials;
  const contactPerson = values.contactPerson.trim();
  const contactNumber = values.contactNumber.trim();
  const email = values.email.trim();
  const socialLinks = [
    { label: "Facebook", value: values.facebookUrl.trim() },
    { label: "Instagram", value: values.instagramUrl.trim() },
    { label: "TikTok", value: values.tikTokUrl.trim() },
  ].filter((item) => item.value);
  const isDebut = draft.hostInfo.kind === "debut";
  const isBirthday = draft.hostInfo.kind === "birthday";
  const isBaptism = draft.hostInfo.kind === "baptism";
  const brandLine = isDebut
    ? `${draft.hostInfo.displayAs || "Debutant"}'s 18th Birthday`
    : isBirthday
      ? `${draft.hostInfo.displayAs || "Celebrant's Birthday"}`
      : isBaptism
        ? `${draft.hostInfo.displayAs || "Liam's Christening"}`
        : withFallback(
            draft.coupleInfo.displayAs,
            fallbackDraft.coupleInfo.displayAs,
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
            <span className="event-preview-footer-text">{contactPerson}</span>
          </span>
        ) : null}
        {contactNumber ? (
          <span className="event-preview-footer-line">
            <Phone className="size-4" aria-hidden="true" />
            <span className="event-preview-footer-text">{contactNumber}</span>
          </span>
        ) : null}
        {email ? (
          <span className="event-preview-footer-line">
            <Mail className="size-4" aria-hidden="true" />
            <span className="event-preview-footer-text">{email}</span>
          </span>
        ) : null}
      </div>
      {socialLinks.length > 0 ? (
        <div className="event-preview-social-row">
          {socialLinks.map((item) => (
            <Button
              key={item.label}
              type="button"
              variant="outline"
              size="sm"
              className="event-preview-social-button"
              asChild
            >
              <a href={item.value} target="_blank" rel="noreferrer">
                {item.label}
              </a>
            </Button>
          ))}
        </div>
      ) : null}
      <p className="event-preview-footer-brand">{brandLine} · WEBserbisyo RSVP</p>
    </footer>
  );
}

function GiftPreviewMedia({
  file,
  image,
  title,
}: {
  file: File | null;
  image: { alt?: string; path: string; url?: string } | null;
  title: string;
}) {
  const uploadedImageUrl = image?.url?.trim() || null;
  const imageUrl = useMemo(
    () => (file ? URL.createObjectURL(file) : uploadedImageUrl),
    [file, uploadedImageUrl],
  );

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
        alt={image?.alt?.trim() || `${title || "Gift option"} preview`}
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
      <span className="event-preview-major-divider-line" />
      <span className="event-preview-major-divider-marker" />
      <span className="event-preview-major-divider-line" />
    </div>
  );
}

function InternalDivider() {
  return <div className="event-preview-internal-divider" aria-hidden="true" />;
}

function normalizeTimelineItems(
  items: EventWebsiteRenderModel["timelineProgram"]["items"],
  eventType?: string,
) {
  const hasDraftContent = items.some(
    (item) => item.time.trim() || item.title.trim() || item.description.trim(),
  );
  const cleaned = items
    .map((item) => ({
      description: item.description.trim(),
      id: item.id,
      time: item.time.trim() ? formatPreviewTime(item.time, item.time.trim()) : "",
      title: item.title.trim(),
    }))
    .filter((item) => item.time || item.title || item.description)
    .map((item) => ({
      ...item,
      title: item.title || (item.description ? "Program Item" : ""),
    }));

  if (cleaned.length > 0 || hasDraftContent) {
    return cleaned;
  }

  const defaultDraft = getPreviewDefaultDraft(eventType);
  return defaultDraft.timelineProgram.items.map((item) => ({
    description: item.description,
    id: item.id,
    time: formatPreviewTime(item.time, item.time),
    title: item.title,
  }));
}

function normalizeEntourageGroups(
  groups: EventWebsiteRenderModel["entourage"]["groups"],
  kind?: string,
) {
  const hasDraftContent = groups.some(
    (group) => group.groupTitle.trim() || group.names.trim(),
  );
  const cleaned = groups
    .map((group) => ({
      groupTitle: group.groupTitle.trim() || (group.names.trim() ? "Wedding Party" : ""),
      id: group.id,
      names: group.names.trim(),
    }))
    .filter((group) => group.groupTitle || group.names);

  return cleaned.length > 0
    ? cleaned
    : hasDraftContent
      ? cleaned
      : getPreviewDefaultDraft(kind).entourage.groups;
}

function normalizeLineList(value: string, kind?: string): string[] {
  const items = value
    .split("\n")
    .map((entry) => entry.trim())
    .filter(Boolean);

  if (items.length > 0) {
    return items;
  }
  const fallbackNames = getPreviewDefaultDraft(kind).principalSponsors.names;
  return fallbackNames
    .split("\n")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function normalizeExtraInfoItems(
  items: EventWebsiteRenderModel["extraInfo"]["items"],
  kind?: string,
) {
  const hasDraftContent = items.some((item) => item.title.trim() || item.details.trim());
  const cleaned = items
    .map((item) => ({
      details: item.details.trim(),
      id: item.id,
      title: item.title.trim() || (item.details.trim() ? "Note" : item.title.trim()),
    }))
    .filter((item) => item.title || item.details)
    .map((item) => ({
      details: item.details.trim(),
      id: item.id,
      title: item.title.trim() || (item.details.trim() ? "Note" : ""),
    }));

  return cleaned.length > 0
    ? cleaned
    : hasDraftContent
      ? cleaned
      : getPreviewDefaultDraft(kind).extraInfo.items;
}

function normalizeGiftOptions(
  options: EventWebsiteRenderModel["giftDetails"]["options"],
  kind?: string,
) {
  const cleaned = options.filter(
    (option) => option.title.trim() || option.file || option.image?.url?.trim(),
  );
  return cleaned.length > 0 ? cleaned : getPreviewDefaultDraft(kind).giftDetails.options;
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
  return value.toString().padStart(2, "0");
}

function formatGuestbookDate(value: string | null) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat("en-PH", {
    dateStyle: "medium",
    timeZone: "Asia/Manila",
  }).format(date);
}

function withFallback(value: string, fallback: string) {
  return value.trim() || fallback;
}

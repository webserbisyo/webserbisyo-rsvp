import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  CalendarDays,
  Clock3,
  HeartHandshake,
  MapPin,
  Music,
  Play,
  Timer,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PublicMetaPixelScripts } from "@/components/meta-pixels/public-meta-pixel-scripts";
import { getPublicMetaPixelsForRoute } from "@/server/queries/public-meta-pixels";
import {
  resolvePublicEventWebsite,
  type PublicEventWebsiteDto,
} from "@/server/services/resolve-public-event-website";

type PublicRsvpPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: PublicRsvpPageProps): Promise<Metadata> {
  const { slug } = await params;
  const event = await resolvePublicEventWebsite(slug);

  if (!event) {
    return {
      description: "Published RSVP event page.",
      title: "Event Website",
    };
  }

  const displayName = event.content.sections.host_info.displayAs.trim() || event.eventTitle;
  const summaryParts = [
    formatPublicDate(event.eventDate),
    formatPublicTime(event.eventTime),
    event.venueName,
  ].filter(Boolean);

  return {
    description:
      summaryParts.length > 0
        ? `${displayName} wedding details. ${summaryParts.join(" • ")}`
        : `${displayName} wedding details and RSVP information.`,
    title: `${displayName} Wedding RSVP`,
  };
}

export default async function PublicRsvpPage({ params }: PublicRsvpPageProps) {
  const { slug } = await params;
  const event = await resolvePublicEventWebsite(slug);

  if (!event) {
    notFound();
  }

  const pixels = await getPublicMetaPixelsForRoute({
    eventSlug: slug,
    route: "event_page",
  });

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#fff8ef_0%,#ffffff_55%,#fff6ec_100%)] text-slate-900">
      <PublicMetaPixelScripts eventName="ViewContent" pixels={pixels} />

      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
        <header className="rounded-[2rem] border border-amber-200/70 bg-white/90 p-6 shadow-[0_18px_60px_rgba(120,74,20,0.08)] backdrop-blur sm:p-8">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-900">
              {event.visibility === "unlisted" ? "Unlisted" : "Public"}
            </Badge>
            <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-900">
              Published
            </Badge>
          </div>

          <div className="mt-5 grid gap-6 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,0.7fr)]">
            <div className="space-y-4">
              {event.content.sections.host_info.hostLine.trim() ? (
                <p className="text-sm font-medium uppercase tracking-[0.28em] text-amber-700">
                  {event.content.sections.host_info.hostLine.trim()}
                </p>
              ) : null}
              <div className="space-y-3">
                <h1 className="font-serif text-4xl leading-tight sm:text-5xl">
                  {event.content.sections.host_info.displayAs.trim() || event.eventTitle}
                </h1>
                {event.content.sections.host_info.shortHostMessage.trim() ? (
                  <p className="max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
                    {event.content.sections.host_info.shortHostMessage.trim()}
                  </p>
                ) : null}
              </div>
            </div>

            <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50/80 p-5">
              <h2 className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-500">
                Event Summary
              </h2>
              <dl className="mt-4 space-y-3 text-sm">
                <SummaryRow
                  icon={<CalendarDays className="size-4" />}
                  label="Date"
                  value={formatPublicDate(event.eventDate) || "To be announced"}
                />
                <SummaryRow
                  icon={<Clock3 className="size-4" />}
                  label="Time"
                  value={formatPublicTime(event.eventTime) || "To be announced"}
                />
                <SummaryRow
                  icon={<MapPin className="size-4" />}
                  label="Venue"
                  value={event.venueName || "To be announced"}
                />
                <SummaryRow
                  icon={<Timer className="size-4" />}
                  label="RSVP by"
                  value={formatPublicDateTime(event.rsvpCloseAt) || "To be announced"}
                />
              </dl>
            </div>
          </div>
        </header>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <div className="space-y-6">
            {event.sectionsToRender.map((sectionKey) => (
              <SectionRouter key={sectionKey} event={event} sectionKey={sectionKey} />
            ))}
          </div>

          <aside className="h-fit rounded-[1.5rem] border border-slate-200 bg-white/90 p-5 shadow-sm lg:sticky lg:top-6">
            <h2 className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">
              RSVP Status
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Public RSVP submissions are not enabled yet in this fallback page. The form preview
              below is view-only for now.
            </p>
            <Button type="button" disabled className="mt-4 w-full">
              RSVP submissions coming soon
            </Button>
          </aside>
        </div>
      </div>
    </main>
  );
}

function SectionRouter({
  event,
  sectionKey,
}: {
  event: PublicEventWebsiteDto;
  sectionKey: PublicEventWebsiteDto["sectionsToRender"][number];
}) {
  switch (sectionKey) {
    case "host_info":
      return <HostInfoSection event={event} />;
    case "countdown":
      return <CountdownSection event={event} />;
    case "music_effects":
      return <MusicEffectsSection event={event} />;
    case "main_event":
      return <MainEventSection event={event} />;
    case "venue":
      return <VenueSection event={event} />;
    case "secondary_event":
      return <SecondaryEventSection event={event} />;
    case "timeline_program":
      return <TimelineProgramSection event={event} />;
    case "entourage":
      return <EntourageSection event={event} />;
    case "principal_sponsors":
      return <PrincipalSponsorsSection event={event} />;
    case "attire_motif":
      return <AttireMotifSection event={event} />;
    case "extra_info":
      return <ExtraInfoSection event={event} />;
    case "rsvp_form":
      return <RsvpFormSection event={event} />;
    case "gift_details":
      return <GiftDetailsSection event={event} />;
    case "guestbook":
      return <GuestbookSection event={event} />;
    case "story_message":
      return <StoryMessageSection event={event} />;
    case "contact_socials":
      return <ContactSocialsSection event={event} />;
    default:
      return null;
  }
}

function HostInfoSection({ event }: { event: PublicEventWebsiteDto }) {
  const section = event.content.sections.host_info;

  return (
    <PublicSection label="Couple Info" title={section.displayAs.trim() || event.eventTitle}>
      <div className="grid gap-4 sm:grid-cols-2">
        <InfoCard label="Groom" value={section.groomName.trim() || "Not set"} />
        <InfoCard label="Bride" value={section.brideName.trim() || "Not set"} />
      </div>
    </PublicSection>
  );
}

function CountdownSection({ event }: { event: PublicEventWebsiteDto }) {
  const section = event.content.sections.countdown;
  const countdown = buildCountdownItems(event.eventDate, event.eventTime);

  return (
    <PublicSection label="Countdown" title={section.title.trim() || "Countdown"}>
      {section.shortNote.trim() ? (
        <p className="text-sm leading-6 text-slate-600">{section.shortNote.trim()}</p>
      ) : null}
      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {countdown.map((item) => (
          <div
            key={item.label}
            className="rounded-2xl border border-amber-100 bg-amber-50/70 px-4 py-4 text-center"
          >
            <div className="text-2xl font-semibold text-slate-900">{item.value}</div>
            <div className="mt-1 text-xs uppercase tracking-[0.22em] text-slate-500">
              {item.label}
            </div>
          </div>
        ))}
      </div>
    </PublicSection>
  );
}

function MusicEffectsSection({ event }: { event: PublicEventWebsiteDto }) {
  const section = event.content.sections.music_effects;

  return (
    <PublicSection label="Music" title={section.musicTitle.trim() || "Special Song"}>
      <div className="flex flex-col gap-4 rounded-[1.5rem] border border-slate-200 bg-slate-50/80 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
            <Music className="size-4" />
            Music cue
          </div>
          <p className="text-sm leading-6 text-slate-600">
            {section.shortNote.trim() || "A song that reflects this special celebration."}
          </p>
        </div>
        {section.musicLink.trim() ? (
          <Button asChild type="button" variant="outline">
            <Link href={section.musicLink.trim()} target="_blank" rel="noreferrer">
              <Play className="size-4" />
              {section.playButtonLabel.trim() || "Play"}
            </Link>
          </Button>
        ) : (
          <Button type="button" variant="outline" disabled>
            <Play className="size-4" />
            {section.playButtonLabel.trim() || "Play"}
          </Button>
        )}
      </div>
    </PublicSection>
  );
}

function MainEventSection({ event }: { event: PublicEventWebsiteDto }) {
  const section = event.content.sections.main_event;

  return (
    <PublicSection label="Ceremony" title={section.eventLabel.trim() || "Main Event"}>
      <div className="grid gap-4 sm:grid-cols-2">
        <InfoCard label="Date" value={formatPublicDate(section.eventDate) || "To be announced"} />
        <InfoCard
          label="Time"
          value={formatTimeRange(section.eventTime, section.endTime) || "To be announced"}
        />
        <InfoCard
          label="RSVP deadline"
          value={formatPublicDateTime(section.rsvpDeadline) || "To be announced"}
        />
      </div>
      {section.scheduleNote.trim() ? (
        <p className="mt-4 text-sm leading-6 text-slate-600">{section.scheduleNote.trim()}</p>
      ) : null}
    </PublicSection>
  );
}

function VenueSection({ event }: { event: PublicEventWebsiteDto }) {
  const section = event.content.sections.venue;

  return (
    <PublicSection label="Venue" title={section.venueName.trim() || "Venue"}>
      <div className="grid gap-4 sm:grid-cols-2">
        <InfoCard label="Location" value={section.address.trim() || "To be announced"} />
        <InfoCard
          label="Map link"
          value={section.mapsLink.trim() ? "View map" : "Not provided yet"}
          href={section.mapsLink.trim() || undefined}
        />
      </div>
      {section.arrivalNote.trim() ? (
        <p className="mt-4 text-sm leading-6 text-slate-600">{section.arrivalNote.trim()}</p>
      ) : null}
    </PublicSection>
  );
}

function SecondaryEventSection({ event }: { event: PublicEventWebsiteDto }) {
  const section = event.content.sections.secondary_event;

  return (
    <PublicSection label="Reception" title={section.title.trim() || "Secondary Event"}>
      <div className="grid gap-4 sm:grid-cols-2">
        <InfoCard
          label="Time"
          value={formatTimeRange(section.startTime, section.endTime) || "To be announced"}
        />
        <InfoCard label="Venue" value={section.venueName.trim() || "To be announced"} />
        <InfoCard label="Address" value={section.address.trim() || "To be announced"} />
        <InfoCard
          label="Map link"
          value={section.mapsLink.trim() ? "View map" : "Not provided yet"}
          href={section.mapsLink.trim() || undefined}
        />
      </div>
      {section.note.trim() ? (
        <p className="mt-4 text-sm leading-6 text-slate-600">{section.note.trim()}</p>
      ) : null}
    </PublicSection>
  );
}

function TimelineProgramSection({ event }: { event: PublicEventWebsiteDto }) {
  const items = event.content.sections.timeline_program.items;

  return (
    <PublicSection label="Timeline" title="Program Flow">
      <div className="space-y-3">
        {items.map((item) => (
          <div
            key={item.id}
            className="rounded-[1.5rem] border border-slate-200 bg-white/80 px-4 py-4"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="font-medium text-slate-900">{item.title || "Program item"}</h3>
              <span className="text-sm font-medium text-amber-700">
                {formatPublicTime(item.time) || "Time TBD"}
              </span>
            </div>
            {item.description.trim() ? (
              <p className="mt-2 text-sm leading-6 text-slate-600">{item.description.trim()}</p>
            ) : null}
          </div>
        ))}
      </div>
    </PublicSection>
  );
}

function EntourageSection({ event }: { event: PublicEventWebsiteDto }) {
  const section = event.content.sections.entourage;

  return (
    <PublicSection label="Entourage" title="The People Standing With Us">
      {section.introLine.trim() ? (
        <p className="text-sm leading-6 text-slate-600">{section.introLine.trim()}</p>
      ) : null}
      <div className="mt-5 grid gap-4 md:grid-cols-2">
        {section.groups.map((group) => (
          <div
            key={group.id}
            className="rounded-[1.5rem] border border-slate-200 bg-white/80 px-4 py-4"
          >
            <h3 className="font-medium text-slate-900">{group.groupTitle || "Entourage group"}</h3>
            <p className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-600">
              {group.names.trim() || "Names to be announced"}
            </p>
          </div>
        ))}
      </div>
    </PublicSection>
  );
}

function PrincipalSponsorsSection({ event }: { event: PublicEventWebsiteDto }) {
  const section = event.content.sections.principal_sponsors;

  return (
    <PublicSection label="Principal Sponsors" title="With Gratitude">
      {section.introLine.trim() ? (
        <p className="text-sm leading-6 text-slate-600">{section.introLine.trim()}</p>
      ) : null}
      <p className="mt-4 whitespace-pre-line text-sm leading-7 text-slate-700">
        {section.names.trim() || "Names to be announced"}
      </p>
    </PublicSection>
  );
}

function AttireMotifSection({ event }: { event: PublicEventWebsiteDto }) {
  const section = event.content.sections.attire_motif;

  return (
    <PublicSection label="Attire" title="Dress Code">
      <div className="grid gap-4 sm:grid-cols-2">
        <InfoCard label="Attire" value={section.dressCodeNote.trim() || "Not specified"} />
        <InfoCard label="Motif" value={section.colorMotifNote.trim() || "Not specified"} />
      </div>
      {section.sectionIntro.trim() ? (
        <p className="mt-4 text-sm leading-6 text-slate-600">{section.sectionIntro.trim()}</p>
      ) : null}
    </PublicSection>
  );
}

function ExtraInfoSection({ event }: { event: PublicEventWebsiteDto }) {
  const section = event.content.sections.extra_info;

  return (
    <PublicSection label="Extra Info" title={section.sectionTitle.trim() || "Guest Notes"}>
      {section.sectionIntro.trim() ? (
        <p className="text-sm leading-6 text-slate-600">{section.sectionIntro.trim()}</p>
      ) : null}
      <div className="mt-5 grid gap-4 md:grid-cols-2">
        {section.items.map((item) => (
          <div
            key={item.id}
            className="rounded-[1.5rem] border border-slate-200 bg-white/80 px-4 py-4"
          >
            <h3 className="font-medium text-slate-900">{item.title || "Extra detail"}</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {item.details.trim() || "More details coming soon."}
            </p>
          </div>
        ))}
      </div>
    </PublicSection>
  );
}

function RsvpFormSection({ event }: { event: PublicEventWebsiteDto }) {
  const section = event.content.sections.rsvp_form;

  return (
    <PublicSection label="RSVP" title="Response Form Preview">
      <div className="space-y-4 rounded-[1.5rem] border border-slate-200 bg-slate-50/80 p-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <ReadOnlyField label="Guest name" placeholder="Guest name" />
          <ReadOnlyField label="Attendance" placeholder="Attending / Not attending" />
          {section.plusOneEnabled ? (
            <ReadOnlyField
              label="Companion"
              placeholder={`Up to ${section.companionLimit} companion${section.companionLimit === 1 ? "" : "s"}`}
            />
          ) : null}
          {section.foodAllergiesEnabled ? (
            <ReadOnlyField label="Food allergies" placeholder="Dietary notes" />
          ) : null}
          {section.messageToHostEnabled ? (
            <ReadOnlyField label="Message to host" placeholder="Write a message" />
          ) : null}
        </div>

        {section.customQuestions.length > 0 ? (
          <div className="space-y-3 border-t border-slate-200 pt-4">
            <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
              Additional questions
            </h3>
            {section.customQuestions.map((question) => (
              <ReadOnlyField
                key={question.id}
                label={question.label || "Custom question"}
                placeholder={
                  question.options.length > 0 ? question.options.join(", ") : question.fieldType
                }
              />
            ))}
          </div>
        ) : null}

        <Button type="button" disabled className="w-full">
          RSVP submissions coming soon
        </Button>
      </div>
    </PublicSection>
  );
}

function GiftDetailsSection({ event }: { event: PublicEventWebsiteDto }) {
  const section = event.content.sections.gift_details;

  return (
    <PublicSection label="Gift Details" title="Gift Preferences">
      {section.sectionIntro.trim() ? (
        <p className="text-sm leading-6 text-slate-600">{section.sectionIntro.trim()}</p>
      ) : null}
      <div className="mt-5 flex flex-wrap gap-3">
        {section.options.map((option) => (
          <div
            key={option.id}
            className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700"
          >
            {option.title.trim() || "Gift option"}
          </div>
        ))}
      </div>
      {section.giftNote.trim() ? (
        <p className="mt-4 text-sm leading-6 text-slate-600">{section.giftNote.trim()}</p>
      ) : null}
    </PublicSection>
  );
}

function GuestbookSection({ event }: { event: PublicEventWebsiteDto }) {
  const section = event.content.sections.guestbook;

  return (
    <PublicSection label="Messages" title={section.sectionTitle.trim() || "A Note from Us"}>
      <div className="rounded-[1.5rem] border border-slate-200 bg-white/80 px-5 py-5">
        <p className="text-sm leading-7 text-slate-600">
          {section.messageBody.trim() || "Guest messages will be displayed here."}
        </p>
      </div>
    </PublicSection>
  );
}

function StoryMessageSection({ event }: { event: PublicEventWebsiteDto }) {
  const section = event.content.sections.story_message;

  return (
    <PublicSection label="Story" title={section.storyTitle.trim() || "Our Story"}>
      {section.sectionIntro.trim() ? (
        <p className="text-sm leading-6 text-slate-600">{section.sectionIntro.trim()}</p>
      ) : null}
      <p className="mt-4 whitespace-pre-line text-sm leading-7 text-slate-700">
        {section.storyBody.trim() || "Story details will be shared soon."}
      </p>
    </PublicSection>
  );
}

function ContactSocialsSection({ event }: { event: PublicEventWebsiteDto }) {
  const section = event.content.sections.contact_socials;
  const socialLinks = [
    { href: section.facebookUrl.trim(), label: "Facebook" },
    { href: section.instagramUrl.trim(), label: "Instagram" },
    { href: section.tikTokUrl.trim(), label: "TikTok" },
  ].filter((item) => item.href);

  return (
    <footer className="rounded-[2rem] border border-slate-200 bg-slate-950 px-6 py-8 text-slate-100 shadow-[0_20px_60px_rgba(15,23,42,0.18)]">
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.22em] text-amber-200">
          <HeartHandshake className="size-4" />
          Contact & socials
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <FooterInfo label="Contact person" value={section.contactPerson.trim() || "Not provided"} />
          <FooterInfo label="Phone" value={section.contactNumber.trim() || "Not provided"} />
          <FooterInfo label="Email" value={section.email.trim() || "Not provided"} />
          <FooterInfo
            label="Socials"
            value={socialLinks.length > 0 ? socialLinks.map((item) => item.label).join(", ") : "Not provided"}
          />
        </div>
        {socialLinks.length > 0 ? (
          <div className="flex flex-wrap gap-3 pt-2">
            {socialLinks.map((link) => (
              <Button key={link.href} asChild type="button" variant="outline">
                <Link href={link.href} target="_blank" rel="noreferrer">
                  {link.label}
                </Link>
              </Button>
            ))}
          </div>
        ) : null}
      </div>
    </footer>
  );
}

function PublicSection({
  children,
  label,
  title,
}: {
  children: React.ReactNode;
  label: string;
  title: string;
}) {
  return (
    <section className="rounded-[2rem] border border-slate-200 bg-white/90 p-6 shadow-[0_18px_60px_rgba(15,23,42,0.06)] sm:p-8">
      <Badge variant="outline" className="border-slate-200 bg-slate-50 text-slate-700">
        {label}
      </Badge>
      <h2 className="mt-4 font-serif text-3xl leading-tight text-slate-900">{title}</h2>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function InfoCard({
  href,
  label,
  value,
}: {
  href?: string;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50/80 px-4 py-4">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{label}</p>
      {href ? (
        <Link
          href={href}
          target="_blank"
          rel="noreferrer"
          className="mt-2 inline-flex text-sm font-medium text-amber-700 underline decoration-amber-200 underline-offset-4"
        >
          {value}
        </Link>
      ) : (
        <p className="mt-2 text-sm leading-6 text-slate-700">{value}</p>
      )}
    </div>
  );
}

function ReadOnlyField({ label, placeholder }: { label: string; placeholder: string }) {
  return (
    <label className="grid gap-2">
      <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
        {label}
      </span>
      <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-400">
        {placeholder}
      </div>
    </label>
  );
}

function SummaryRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 text-amber-700">{icon}</span>
      <div>
        <dt className="text-slate-500">{label}</dt>
        <dd className="font-medium text-slate-900">{value}</dd>
      </div>
    </div>
  );
}

function FooterInfo({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">{label}</p>
      <p className="mt-2 text-sm leading-6 text-slate-100">{value}</p>
    </div>
  );
}

function buildCountdownItems(eventDate: string | null, eventTime: string | null) {
  const target = buildCountdownTarget(eventDate, eventTime);

  if (!target) {
    return zeroCountdownItems();
  }

  const remainingMs = Math.max(target.getTime() - Date.now(), 0);
  const totalSeconds = Math.floor(remainingMs / 1000);
  const days = Math.floor(totalSeconds / 86_400);
  const hours = Math.floor((totalSeconds % 86_400) / 3_600);
  const minutes = Math.floor((totalSeconds % 3_600) / 60);
  const seconds = totalSeconds % 60;

  return [
    { label: "Days", value: padCountdownValue(days) },
    { label: "Hours", value: padCountdownValue(hours) },
    { label: "Minutes", value: padCountdownValue(minutes) },
    { label: "Seconds", value: padCountdownValue(seconds) },
  ];
}

function buildCountdownTarget(eventDate: string | null, eventTime: string | null) {
  if (!eventDate || !eventTime) {
    return null;
  }

  const normalizedTime = eventTime.length === 5 ? `${eventTime}:00` : eventTime;
  const target = new Date(`${eventDate}T${normalizedTime}+08:00`);

  return Number.isNaN(target.getTime()) ? null : target;
}

function zeroCountdownItems() {
  return [
    { label: "Days", value: "00" },
    { label: "Hours", value: "00" },
    { label: "Minutes", value: "00" },
    { label: "Seconds", value: "00" },
  ];
}

function padCountdownValue(value: number) {
  return value.toString().padStart(2, "0");
}

function formatPublicDate(value: string | null) {
  if (!value) {
    return null;
  }

  const date = new Date(`${value}T00:00:00+08:00`);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return new Intl.DateTimeFormat("en-PH", {
    dateStyle: "full",
    timeZone: "Asia/Manila",
  }).format(date);
}

function formatPublicTime(value: string | null) {
  if (!value) {
    return null;
  }

  const normalizedTime = value.length === 5 ? `${value}:00` : value;
  const date = new Date(`2026-01-01T${normalizedTime}+08:00`);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return new Intl.DateTimeFormat("en-PH", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "Asia/Manila",
  }).format(date);
}

function formatPublicDateTime(value: string | null) {
  if (!value) {
    return null;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return new Intl.DateTimeFormat("en-PH", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Manila",
  }).format(date);
}

function formatTimeRange(start: string | null, end: string | null) {
  const startLabel = formatPublicTime(start);
  const endLabel = formatPublicTime(end);

  if (startLabel && endLabel) {
    return `${startLabel} to ${endLabel}`;
  }

  return startLabel || endLabel || null;
}

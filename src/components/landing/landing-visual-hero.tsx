"use client";

import { useState } from "react";
import { ArrowRight, Check, Play } from "lucide-react";
import { TrackedLink } from "@/components/meta-pixels/tracked-link";
import { marketingHero } from "@/config/marketing-hero";
import SideRays from "./effects/SideRays";
import { MarkerBrushUnderline } from "./effects/marker-brush-underline";
import { HeroVideoFrameFallback } from "./hero-video-frame-fallback";

type MilestoneId = "wedding" | "debut" | "birthday" | "baptism";

type MilestoneOption = {
  id: MilestoneId;
  label: string;
  ctaText: string;
};

const MILESTONES: readonly MilestoneOption[] = [
  { id: "wedding", label: "💍 Weddings", ctaText: "Start your free wedding website preview" },
  { id: "debut", label: "🎉 Debuts", ctaText: "Start your free debut website preview" },
  { id: "birthday", label: "🥳 Birthdays", ctaText: "Start your free birthday website preview" },
  { id: "baptism", label: "🕊️ Baptisms", ctaText: "Start your free baptism website preview" },
] as const;

const CLOUDINARY_TEASER_URL =
  "https://res.cloudinary.com/dg7spmujw/video/upload/f_auto,q_auto/hero-hook-teaser.mp4";
const YOUTUBE_FULL_EMBED_URL =
  "https://www.youtube-nocookie.com/embed/m03hBAcVjUw?autoplay=1&rel=0&playsinline=1";

export function LandingVisualHero() {
  const [selectedMilestone, setSelectedMilestone] = useState<MilestoneId | null>(null);
  const [isPlayingFull, setIsPlayingFull] = useState(false);
  const [videoError, setVideoError] = useState(false);

  const activeMilestone = selectedMilestone
    ? MILESTONES.find((item) => item.id === selectedMilestone) ?? null
    : null;

  const ctaHref = selectedMilestone ? `/apply?archetype=${selectedMilestone}` : "/apply";
  const ctaText = activeMilestone ? activeMilestone.ctaText : "Start your free website preview";

  return (
    <section
      aria-label="WebSerbisyo RSVP visual introduction"
      className="landing-theme-dark relative isolate min-h-[100svh] w-full overflow-hidden bg-[var(--landing-bg)]"
    >
      {/* SideRays: WebGL background layer */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0 overflow-hidden opacity-50 sm:opacity-65 lg:opacity-85"
      >
        <SideRays
          speed={2.5}
          rayColor1="#EAB308"
          rayColor2="#96c8ff"
          intensity={1.8}
          spread={2}
          origin="top-right"
          tilt={0}
          saturation={1.5}
          blend={0.75}
          falloff={1.6}
          opacity={1}
          className="absolute inset-0"
        />
      </div>

      {/* Hero content: Single-column centered visual stack with zero-scroll clearance */}
      <div className="relative z-10 mx-auto flex max-w-5xl flex-col items-center px-4 pt-20 pb-12 text-center sm:px-6 sm:pt-24 sm:pb-16 lg:px-8">
        {/* 1. Pricing Anchor Eyebrow: 50% OFF Badge + Slashed ₱2,000 */}
        <div className="flex flex-col items-center">
          <div className="mb-1 flex items-center justify-center gap-2 sm:mb-1.5 sm:gap-2.5">
            <span className="inline-flex items-center rounded-full border border-[#ff5a1f]/45 bg-[#ff5a1f]/15 px-2.5 py-0.5 text-[11px] font-black tracking-wider text-[#ff8a5c] uppercase shadow-[0_0_12px_rgba(255,90,31,0.25)] select-none sm:text-xs">
              50% OFF
            </span>
            <div className="relative inline-flex items-center leading-none">
              <span className="text-sm font-extrabold tracking-wider text-white/85 sm:text-base md:text-lg">
                ₱2,000
              </span>
              <span
                aria-hidden="true"
                className="pointer-events-none absolute -inset-x-1.5 top-1/2 h-[2px] -translate-y-1/2 -rotate-14 rounded-full bg-red-500/50 shadow-[0_0_4px_rgba(239,68,68,0.25)]"
              />
            </div>
          </div>

          {/* Main Price Anchor */}
          <div className="relative mt-0.5 inline-block pb-1.5 sm:pb-2">
            <span className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl md:text-4xl lg:text-[42px]">
              Starting at only ₱999
            </span>
            <MarkerBrushUnderline className="absolute bottom-0 left-0 h-3 w-full text-[#ff5a1f] sm:h-3.5" />
          </div>
        </div>

        {/* 2. Compact Single-Line Subtitle (subordinate to ₱999 price anchor) */}
        <h1 className="mt-2 text-base font-bold tracking-tight text-[var(--landing-text)] whitespace-nowrap sm:text-lg md:text-xl lg:text-2xl">
          {marketingHero.headline}
        </h1>

        {/* 3. Dedicated 16:9 Video Canvas (Sits directly below subtitle, fake chrome purged) */}
        <div className="mt-5 w-full max-w-2xl sm:mt-6 sm:max-w-3xl lg:max-w-[760px] xl:max-w-[840px]">
          <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-stone-800 bg-stone-950/80 shadow-[0_20px_50px_-10px_rgba(0,0,0,0.85),0_0_40px_rgba(255,90,31,0.08)] backdrop-blur-xl">
            {videoError ? (
              <HeroVideoFrameFallback archetype={selectedMilestone ?? "event"} />
            ) : isPlayingFull ? (
              <iframe
                src={YOUTUBE_FULL_EMBED_URL}
                title="WebSerbisyo RSVP Website Full Walkthrough"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                referrerPolicy="strict-origin-when-cross-origin"
                allowFullScreen
                className="absolute inset-0 size-full border-0 rounded-2xl"
              />
            ) : (
              <div
                role="button"
                tabIndex={0}
                onClick={() => setIsPlayingFull(true)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setIsPlayingFull(true);
                  }
                }}
                aria-label="Play full video walkthrough"
                className="group relative size-full cursor-pointer select-none"
              >
                <video
                  src={CLOUDINARY_TEASER_URL}
                  autoPlay
                  muted
                  playsInline
                  preload="metadata"
                  loop={false}
                  onEnded={() => setIsPlayingFull(true)}
                  onError={() => setVideoError(true)}
                  className="absolute inset-0 size-full object-cover rounded-2xl"
                />

                {/* Interactive Play Trigger Overlay */}
                <div className="absolute inset-0 flex items-center justify-center bg-black/20 transition-colors duration-300 group-hover:bg-black/35">
                  <div className="relative flex items-center justify-center">
                    <div className="absolute size-16 rounded-full bg-[#ff5a1f]/30 blur-md transition-transform duration-300 group-hover:scale-125" />
                    <div className="relative flex size-12 items-center justify-center rounded-full border border-[#ff5a1f]/80 bg-stone-950/85 text-white shadow-[0_0_20px_rgba(255,90,31,0.4)] transition-all duration-300 group-hover:scale-110 group-hover:border-[#ff5a1f] group-hover:shadow-[0_0_30px_rgba(255,90,31,0.6)]">
                      <Play className="ml-0.5 size-5 fill-white text-white" />
                    </div>
                  </div>

                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full border border-white/10 bg-black/60 px-3 py-1 text-[11px] font-medium tracking-wide text-white/80 backdrop-blur-md transition-opacity duration-300 group-hover:text-white sm:text-xs">
                    Click to watch full video
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 4. Objection Buster Kicker (Straight horizontally, scaled up & bold) */}
        <div className="mt-6 rotate-0 select-none sm:mt-8">
          <span className="font-script text-xl font-extrabold tracking-wide text-amber-400 sm:text-2xl md:text-3xl [font-family:var(--font-caveat,'Caveat','Comic_Sans_MS',cursive)]">
            &ldquo;No downpayment needed!&rdquo;
          </span>
        </div>

        {/* 5. Toggleable Milestone Category Filter Chips */}
        <div className="mt-4 flex flex-wrap items-center justify-center gap-2 sm:gap-3">
          {MILESTONES.map((milestone) => {
            const isSelected = selectedMilestone === milestone.id;
            return (
              <button
                key={milestone.id}
                type="button"
                onClick={() =>
                  setSelectedMilestone((prev) => (prev === milestone.id ? null : milestone.id))
                }
                className={`cursor-pointer rounded-full px-4 py-2 text-xs font-semibold transition-all duration-200 sm:text-sm ${
                  isSelected
                    ? "border border-[#ff5a1f]/70 bg-[#ff5a1f]/15 text-[#ff8a5c] shadow-[0_0_18px_rgba(255,90,31,0.25)]"
                    : "border border-white/10 bg-white/[0.04] text-white/70 hover:bg-white/[0.08] hover:text-white"
                }`}
              >
                {milestone.label}
              </button>
            );
          })}
        </div>

        {/* 6. Dynamic Primary CTA Button with Neutral Default State */}
        <div className="mt-5 w-full max-w-md sm:mt-6 sm:max-w-[480px]">
          <TrackedLink
            href={ctaHref}
            className="landing-cta-button group/hero-cta h-14 w-full justify-center gap-2.5 px-8 text-base font-semibold shadow-[0_0_35px_rgba(255,90,31,0.45)] transition-all duration-300 hover:shadow-[0_0_55px_rgba(255,90,31,0.65)]"
            trackingEvent="StartApplicationClick"
            trackingParams={{
              ...(selectedMilestone ? { archetype: selectedMilestone } : {}),
              content_category: "RSVP Website Application",
              destination: ctaHref,
              source: "hero",
            }}
          >
            <span>{ctaText}</span>
            <ArrowRight className="size-4 transition-transform duration-200 group-hover/hero-cta:translate-x-1" />
          </TrackedLink>
        </div>

        {/* 7. Consolidated Trust Row at the bottom */}
        <div className="mt-6 flex flex-col items-center gap-2 select-none">
          {/* Social Proof Line */}
          <div className="flex items-center gap-1.5 text-xs font-medium tracking-wide text-white/80 sm:text-sm">
            <span className="font-semibold text-white">{marketingHero.proof.summary}</span>
            <span className="text-white/30" aria-hidden="true">
              ·
            </span>
            <span className="font-bold tracking-wider text-amber-400" aria-hidden="true">
              {marketingHero.proof.rating}
            </span>
            <span className="text-[var(--landing-muted)]">
              {marketingHero.proof.supportingText}
            </span>
          </div>

          {/* Guarantee Badges Line */}
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 text-xs font-medium text-[rgba(248,248,248,0.78)] sm:text-sm">
            <div className="flex items-center gap-1.5">
              <Check className="size-3.5 shrink-0 text-[#ff8a5c]" aria-hidden="true" />
              <span>{marketingHero.reassurance[0]}</span>
            </div>
            <span className="hidden text-white/20 sm:inline" aria-hidden="true">
              ·
            </span>
            <div className="flex items-center gap-1.5">
              <Check className="size-3.5 shrink-0 text-[#ff8a5c]" aria-hidden="true" />
              <span>{marketingHero.reassurance[1]}</span>
            </div>
            <span className="hidden text-white/20 sm:inline" aria-hidden="true">
              ·
            </span>
            <div className="flex items-center gap-1.5">
              <Check className="size-3.5 shrink-0 text-[#ff8a5c]" aria-hidden="true" />
              <span>{marketingHero.reassurance[2]}</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

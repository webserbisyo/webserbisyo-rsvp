"use client";

import { useState } from "react";
import { ArrowRight, Check } from "lucide-react";
import { TrackedLink } from "@/components/meta-pixels/tracked-link";
import { marketingHero } from "@/config/marketing-hero";
import SideRays from "./effects/SideRays";
import { MarkerBrushUnderline } from "./effects/marker-brush-underline";

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

export function LandingVisualHero() {
  const [selectedMilestone, setSelectedMilestone] = useState<MilestoneId | null>(null);

  const activeMilestone = selectedMilestone
    ? MILESTONES.find((item) => item.id === selectedMilestone) ?? null
    : null;

  const ctaHref = selectedMilestone ? `/apply?archetype=${selectedMilestone}` : "/apply";
  const ctaText = activeMilestone ? activeMilestone.ctaText : "Start your free website preview";

  return (
    <section
      aria-label="WebSerbisyo RSVP visual introduction"
      className="landing-theme-dark relative isolate flex min-h-[100svh] w-full items-center justify-center overflow-hidden bg-[var(--landing-bg)] py-16 sm:py-20"
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
      <div className="relative z-10 mx-auto flex max-w-5xl flex-col items-center px-4 pt-16 pb-12 text-center sm:px-6 sm:pt-20 sm:pb-16 lg:px-8">
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

        {/* 3. Objection Buster Kicker (Straight horizontally, scaled up & bold) */}
        <div className="mt-8 rotate-0 select-none sm:mt-10">
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

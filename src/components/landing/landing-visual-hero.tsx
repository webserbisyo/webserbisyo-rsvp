import Image from "next/image";
import { ArrowRight, Check } from "lucide-react";
import { TrackedLink } from "@/components/meta-pixels/tracked-link";
import { PROMO_CONFIG } from "@/lib/promotion-config";
import SideRays from "./effects/SideRays";

export function LandingVisualHero() {
  return (
    <section
      aria-label="WebSerbisyo RSVP visual introduction"
      className="landing-theme-dark relative isolate min-h-[100svh] w-full overflow-hidden bg-[var(--landing-bg)]"
    >
      {/* SideRays: WebGL background, physically constrained to top-right product area on mobile */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-0 right-[-35%] z-0 h-[48%] w-[95%] overflow-hidden opacity-45 sm:right-[-28%] sm:h-[52%] sm:w-[88%] md:right-[-20%] md:h-[62%] md:w-[78%] md:opacity-55 lg:inset-0 lg:h-full lg:w-full lg:overflow-visible lg:opacity-100"
      >
        <SideRays
          speed={2.5}
          rayColor1="#EAB308"
          rayColor2="#96c8ff"
          intensity={2}
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

      {/* Mobile dark contrast backdrop behind left text column */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 left-0 z-[1] w-full bg-[linear-gradient(90deg,var(--landing-bg)_0%,var(--landing-bg)_48%,rgba(5,5,5,0.88)_66%,transparent_88%)] lg:hidden"
      />

      {/* Hero content: properly balanced responsive layout */}
      <div className="relative z-10 mx-auto flex min-h-[100svh] max-w-7xl items-center px-4 sm:px-6 lg:px-8">
        <div className="grid w-full items-center gap-10 pt-24 pb-12 lg:grid-cols-[1.08fr_0.92fr] lg:gap-10 lg:pt-32 lg:pb-16">
          {/* Left Pane */}
          <div className="flex max-w-3xl flex-col items-start sm:mx-auto sm:items-center lg:mx-0 lg:items-start">
            {/* Promo pill */}
            {PROMO_CONFIG.isActive && (
              <div className="mb-4 inline-flex items-center rounded-full bg-white/[0.03] px-3.5 py-1 text-xs font-semibold tracking-wide text-[var(--landing-text)] ring-1 ring-[var(--landing-border)] transition-colors ring-inset hover:bg-white/5 sm:self-center sm:text-sm lg:self-auto">
                <span className="mr-1.5 font-extrabold text-[#ff8a5c]">
                  {PROMO_CONFIG.discountLabel}
                </span>
                <span className="mr-1.5 text-white/30">·</span>
                <span>{PROMO_CONFIG.offerLabel}</span>
              </div>
            )}

            {/* Headline */}
            <h1 className="max-w-2xl text-4xl leading-[1.06] font-bold tracking-tight text-[var(--landing-text)] sm:mx-auto sm:text-center sm:text-5xl lg:mx-0 lg:text-left lg:text-6xl">
              Beautiful RSVP websites for Filipino weddings
            </h1>

            {/* Emphasized Trust Block */}
            <div className="mt-5 w-full max-w-md rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3.5 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-sm sm:max-w-[480px] sm:px-5 sm:py-4 lg:text-left">
              <p className="text-base font-bold tracking-wide text-white sm:text-lg">
                Website muna, bago bayad <span aria-hidden="true">😊</span>
              </p>
              <p className="mt-1 text-xs leading-relaxed font-normal text-[rgba(248,248,248,0.78)] sm:text-sm">
                See your website preview first, then decide.
              </p>
            </div>

            {/* CTA */}
            <div className="mt-6 w-full max-w-md sm:max-w-[480px] lg:max-w-none">
              <TrackedLink
                href="/apply"
                className="landing-cta-button group/hero-cta h-14 w-full justify-center gap-2 px-8 text-base lg:w-auto"
                trackingEvent="StartApplicationClick"
                trackingParams={{
                  content_category: "RSVP Website Application",
                  destination: "/apply",
                  source: "hero",
                }}
              >
                Create my wedding website
                <ArrowRight className="size-4 transition-transform duration-200 group-hover/hero-cta:translate-x-0.5" />
              </TrackedLink>
            </div>

            {/* Compact Social-Proof Row */}
            <div className="mt-4 flex w-full flex-row items-center justify-center gap-1.5 text-xs font-medium tracking-wide select-none sm:text-sm lg:justify-start">
              <span className="font-semibold text-white">100+ websites created</span>
              <span className="text-white/30" aria-hidden="true">
                ·
              </span>
              <span className="sr-only">Five-star feedback from happy couples.</span>
              <span className="font-bold tracking-wider text-amber-400" aria-hidden="true">
                ★★★★★
              </span>
              <span className="text-[var(--landing-muted)]">happy couples</span>
            </div>

            {/* Trust Items */}
            <div className="mt-4 flex w-full flex-col items-center justify-center gap-2.5 text-xs font-medium text-[rgba(248,248,248,0.78)] sm:flex-row sm:gap-5 sm:text-sm lg:justify-start">
              <div className="flex items-center gap-1.5">
                <Check className="size-3.5 shrink-0 text-[#ff8a5c]" aria-hidden="true" />
                <span>No payment required upon application</span>
              </div>
              <div className="hidden text-white/20 sm:inline" aria-hidden="true">
                ·
              </div>
              <div className="flex items-center gap-1.5">
                <Check className="size-3.5 shrink-0 text-[#ff8a5c]" aria-hidden="true" />
                <span>No monthly website subscription</span>
              </div>
            </div>

            {/* Mobile Stacked Asset */}
            <div className="mt-10 flex w-full justify-center sm:mt-8 lg:hidden" aria-hidden="true">
              <Image
                src="/images/rsvp.webp"
                alt="Digital RSVP invitation and phone preview"
                width={1122}
                height={1402}
                priority
                className="h-auto w-full max-w-[280px] object-contain drop-shadow-[0_32px_90px_rgba(0,0,0,0.65)] select-none"
              />
            </div>
          </div>

          {/* Right Pane */}
          <div
            className="relative hidden min-h-[520px] items-center justify-center lg:flex"
            aria-hidden="true"
          >
            <div className="relative w-full max-w-[500px]">
              <div className="absolute inset-8 rounded-full bg-[var(--landing-cta-glow)] opacity-20 blur-3xl" />
              <Image
                src="/images/rsvp.webp"
                alt="Digital RSVP invitation and phone preview"
                width={1122}
                height={1402}
                priority
                className="relative z-10 h-auto w-full object-contain drop-shadow-[0_32px_90px_rgba(0,0,0,0.65)] select-none"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

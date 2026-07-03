import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { TrackedLink } from "@/components/meta-pixels/tracked-link";
import SideRays from "./effects/SideRays";

export function LandingVisualHero() {
  return (
    <section
      aria-label="WebSerbisyo RSVP visual introduction"
      className="landing-theme-dark relative isolate min-h-[100svh] w-full overflow-hidden bg-[var(--landing-bg)]"
    >
      {/* SideRays: full-section WebGL background, covers entire hero */}
      <div className="absolute inset-0 z-0 pointer-events-none">
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

      {/* Hero content: properly balanced responsive layout */}
      <div className="relative z-10 mx-auto flex min-h-[100svh] max-w-7xl items-center px-4 sm:px-6 lg:px-8">
        <div className="grid w-full items-center gap-12 pt-28 pb-16 lg:grid-cols-[1.08fr_0.92fr] lg:gap-10 lg:pt-32">
          {/* Left Pane */}
          <div className="flex max-w-3xl flex-col items-start">
            {/* Promo pill */}
            <div className="mb-6 inline-flex items-center rounded-full bg-transparent px-3 py-1 text-sm font-medium text-[var(--landing-text)] ring-1 ring-inset ring-[var(--landing-border)] transition-colors hover:bg-white/5">
              Preview first · Pay later
            </div>

            {/* Headline */}
            <h1 className="text-5xl font-bold tracking-tight text-[var(--landing-text)] leading-[1.02] sm:text-6xl lg:text-6xl xl:text-6xl">
              Digital RSVP websites for Filipino celebrations
            </h1>

            {/* Subheadline */}
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-[var(--landing-muted)] lg:text-xl">
              Website muna, bago bayad — see your finished website first, then decide.
            </p>

            {/* CTA */}
            <div className="mt-10">
              <TrackedLink
                href="/apply"
                className="landing-cta-button group/hero-cta h-14 px-8 text-base gap-2"
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

            {/* Trust line */}
            <p className="mt-4 text-sm font-medium text-[var(--landing-subtle)]">
              No payment needed today · 7-day money-back guarantee
            </p>

            {/* Mobile Stacked Asset */}
            <div className="mt-12 flex w-full justify-center lg:hidden" aria-hidden="true">
              <Image
                src="/images/rsvp.webp"
                alt="Digital RSVP invitation and phone preview"
                width={1122}
                height={1402}
                priority
                className="h-auto w-full max-w-[280px] select-none object-contain drop-shadow-[0_32px_90px_rgba(0,0,0,0.65)]"
              />
            </div>
          </div>

          {/* Right Pane */}
          <div className="relative hidden min-h-[520px] items-center justify-center lg:flex" aria-hidden="true">
            <div className="relative w-full max-w-[500px]">
              <div className="absolute inset-8 rounded-full bg-[var(--landing-cta-glow)] opacity-20 blur-3xl" />
              <Image
                src="/images/rsvp.webp"
                alt="Digital RSVP invitation and phone preview"
                width={1122}
                height={1402}
                priority
                className="relative z-10 h-auto w-full select-none object-contain drop-shadow-[0_32px_90px_rgba(0,0,0,0.65)]"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

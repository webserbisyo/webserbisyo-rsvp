"use client";

import { ArrowRight, Crown, Gem, Check } from "lucide-react";
import { TrackedLink } from "@/components/meta-pixels/tracked-link";
import { MaxPlanFeatureList } from "@/components/pricing/max-plan-feature-list";
import { SpotlightCard } from "@/components/ui/spotlight-card";
import { MAX_PRICING_PLAN, PRO_PRICING_PLAN } from "@/lib/pricing-plans";
import { ApplyPromoBanner } from "./apply-promo-banner";

type ApplyLandingProps = {
  config: {
    messengerPageUrl?: string | null;
  };
};

export function ApplyLanding({ config }: ApplyLandingProps) {
  return (
    <main
      data-config-ready={!!config.messengerPageUrl}
      className="landing-theme-dark relative isolate min-h-screen w-full overflow-x-hidden bg-[var(--landing-bg)] pt-12 pb-20"
    >
      {/* Evergreen 3-Day Looping Countdown Banner */}
      <ApplyPromoBanner />

      {/* Background Dashed Grid with Fade (seamlessly continues Features/FAQ visual styling) */}
      <div
        className="pointer-events-none absolute inset-0 z-0"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='64' height='64' viewBox='0 0 64 64' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M 64 0 L 0 0 0 64' fill='none' stroke='rgba(255,138,92,0.12)' stroke-width='1' stroke-dasharray='4 4' /%3E%3C/svg%3E")`,
          maskImage:
            "radial-gradient(ellipse at 50% 50%, transparent 15%, black 50%, black 85%, transparent 100%)",
          WebkitMaskImage:
            "radial-gradient(ellipse at 50% 50%, transparent 15%, black 50%, black 85%, transparent 100%)",
        }}
      />

      {/* Decorative dark background glows */}
      {/* Gold/coral glow center-left */}
      <div
        className="pointer-events-none absolute top-1/4 left-1/4 z-0 size-[600px] -translate-y-1/2 rounded-full bg-[radial-gradient(circle_at_center,rgba(234,179,8,0.03)_0%,rgba(255,138,92,0.02)_40%,transparent_70%)] blur-3xl"
        aria-hidden="true"
      />
      {/* Plum/espresso glow bottom-right */}
      <div
        className="pointer-events-none absolute right-1/4 bottom-10 z-0 size-[600px] rounded-full bg-[radial-gradient(circle_at_center,rgba(60,20,40,0.18)_0%,transparent_70%)] blur-3xl"
        aria-hidden="true"
      />

      <div className="relative z-10 mx-auto flex max-w-7xl flex-col items-center px-4 pt-4 sm:pt-6 pb-6 sm:px-6 lg:px-8">
        {/* Hero Header */}
        <div className="mb-6 sm:mb-8 flex flex-col items-center text-center">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-white/90">
            Choose Your Plan
          </h1>
          <span className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-[#ff5a1f] mt-1">
            Launch Your RSVP Website Faster
          </span>
          <p className="text-xs sm:text-sm text-stone-400 max-w-md mx-auto mt-2 leading-relaxed">
            Start with the complete PRO website, or upgrade to MAX for a more premium animated guest experience.
          </p>
        </div>

        {/* Pricing Cards Grid */}
        <div
          id="pricing-plans"
          className="grid w-full max-w-5xl grid-cols-1 items-stretch gap-8 px-2 sm:px-4 md:grid-cols-2"
        >
          {/* PRO Card */}
          <div className="relative flex h-full flex-col pt-6">
            {/* Top Floating Badge */}
            <div className="absolute top-0 right-0 left-0 z-10 flex justify-center">
              <span className="inline-block rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[10px] font-bold tracking-widest text-white uppercase shadow-md">
                MOST POPULAR
              </span>
            </div>

            <SpotlightCard
              className="flex h-full flex-col border border-white/[0.06] bg-white/[0.015] backdrop-blur-2xl hover:border-white/15"
              spotlightColor="rgba(255, 138, 92, 0.12)"
            >
              <div className="flex h-full min-h-[560px] flex-col justify-between p-8">
                {/* Upper Block */}
                <div>
                  {/* Card Title & Icon */}
                  <div className="mb-3 flex items-center gap-3">
                    <div className="flex size-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-[#ff8a5c]">
                      <Gem className="size-5" />
                    </div>
                    <h2 className="text-2xl font-extrabold tracking-wide text-white">
                      {PRO_PRICING_PLAN.name}
                    </h2>
                  </div>

                  {/* Description */}
                  <p className="mb-6 text-sm leading-relaxed text-white/60">
                    {PRO_PRICING_PLAN.description}
                  </p>

                  {/* Pricing Representation */}
                  <div className="mb-6 flex flex-col gap-1.5">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center rounded-full border border-[#ff5a1f]/45 bg-gradient-to-r from-[#ff5a1f]/20 to-amber-500/20 px-2 py-0.5 text-[10px] font-black tracking-wider text-[#ff8a5c] shadow-[0_0_12px_rgba(255,90,31,0.35)]">
                        50% OFF
                      </span>
                      <span className="relative inline-block text-stone-400 font-semibold text-base sm:text-lg">
                        <span>{PRO_PRICING_PLAN.regularPriceLabel}</span>
                        <span
                          className="pointer-events-none absolute inset-x-[-2px] top-1/2 h-[2px] -translate-y-1/2 -rotate-14 rounded-full bg-[#ef4444]/60 shadow-[0_0_4px_rgba(239,68,68,0.5)]"
                          aria-hidden="true"
                        />
                      </span>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                        {PRO_PRICING_PLAN.priceLabel}
                      </span>
                    </div>
                  </div>

                  {/* Feature Divider */}
                  <div className="mb-6 h-[1px] w-full bg-white/10" />
                  <p className="mb-4 text-xs font-bold tracking-widest text-[#ff8a5c] uppercase">
                    What&apos;s included:
                  </p>

                  {/* Feature List */}
                  <ul className="mb-8 space-y-3.5">
                    {PRO_PRICING_PLAN.features.map((feature) => (
                      <li key={feature.label} className="flex items-start gap-3">
                        <Check className="mt-0.5 size-4 shrink-0 text-[#ff8a5c]" />
                        <span className="text-sm leading-snug text-white/80">{feature.label}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Footer Block */}
                <div className="mt-auto">
                  <TrackedLink
                    href="/apply/start?plan=pro"
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/5 bg-white/10 px-4 py-3.5 text-sm font-semibold text-white transition-all duration-200 hover:border-white/10 hover:bg-white/20 hover:text-white focus-visible:ring-2 focus-visible:ring-white/30 focus-visible:outline-none"
                    trackingEvent="SelectPlan"
                    trackingParams={{
                      currency: "PHP",
                      plan: "pro",
                      source: "apply_pricing",
                      value: PRO_PRICING_PLAN.price,
                    }}
                  >
                    Select PRO <ArrowRight className="size-4" />
                  </TrackedLink>
                  <p className="mt-3 text-center text-xs font-medium text-white/45">
                    Perfect for most celebrations.
                  </p>
                </div>
              </div>
            </SpotlightCard>
          </div>

          {/* MAX Card */}
          <div className="relative flex h-full flex-col pt-6">
            {/* Top Floating Badge */}
            <div className="absolute top-0 right-0 left-0 z-10 flex justify-center">
              <span className="inline-block rounded-full bg-gradient-to-r from-[#ff8a5c] to-amber-500 px-3 py-1 text-[10px] font-black tracking-widest text-white uppercase shadow-md shadow-orange-950/20">
                MOST MEMORABLE EXPERIENCE
              </span>
            </div>

            <SpotlightCard
              className="flex h-full flex-col border border-[#ff8a5c]/25 bg-white/[0.025] shadow-lg shadow-orange-950/5 backdrop-blur-2xl hover:border-[#ff8a5c]/40"
              spotlightColor="rgba(251, 191, 36, 0.16)"
            >
              <div className="flex h-full min-h-[560px] flex-col justify-between p-8">
                {/* Upper Block */}
                <div>
                  {/* Card Title & Icon */}
                  <div className="mb-3 flex items-center gap-3">
                    <div className="flex size-10 items-center justify-center rounded-xl border border-[#ff8a5c]/35 bg-[#ff8a5c]/10 text-[#ff8a5c]">
                      <Crown className="size-5" />
                    </div>
                    <h2 className="text-2xl font-extrabold tracking-wide text-white">
                      {MAX_PRICING_PLAN.name}
                    </h2>
                  </div>

                  {/* Description */}
                  <p className="mb-6 text-sm leading-relaxed text-white/60">
                    {MAX_PRICING_PLAN.description}
                  </p>

                  {/* Pricing Representation */}
                  <div className="mb-6 flex flex-col gap-1.5">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center rounded-full border border-[#ff8a5c]/45 bg-gradient-to-r from-[#ff8a5c]/20 to-amber-500/20 px-2 py-0.5 text-[10px] font-black tracking-wider text-[#ff8a5c] shadow-[0_0_12px_rgba(255,138,92,0.35)]">
                        50% OFF
                      </span>
                      <span className="relative inline-block text-stone-400 font-semibold text-base sm:text-lg">
                        <span>{MAX_PRICING_PLAN.regularPriceLabel}</span>
                        <span
                          className="pointer-events-none absolute inset-x-[-2px] top-1/2 h-[2px] -translate-y-1/2 -rotate-14 rounded-full bg-[#ef4444]/60 shadow-[0_0_4px_rgba(239,68,68,0.5)]"
                          aria-hidden="true"
                        />
                      </span>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                        {MAX_PRICING_PLAN.priceLabel}
                      </span>
                    </div>
                  </div>

                  {/* Feature Divider */}
                  <div className="mb-6 h-[1px] w-full bg-white/10" />
                  <p className="mb-4 text-xs font-bold tracking-widest text-[#ff8a5c] uppercase">
                    What&apos;s included:
                  </p>

                  {/* Feature List */}
                  <MaxPlanFeatureList />
                </div>

                {/* Footer Block */}
                <div className="mt-auto">
                  <TrackedLink
                    href="/apply/start?plan=max"
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#ff8a5c] to-[#ff6b3b] px-4 py-3.5 text-sm font-semibold text-white shadow-lg shadow-orange-950/20 transition-all duration-200 hover:shadow-orange-950/40 hover:brightness-110 focus-visible:ring-2 focus-visible:ring-[#ff8a5c]/50 focus-visible:outline-none"
                    trackingEvent="SelectPlan"
                    trackingParams={{
                      currency: "PHP",
                      plan: "max",
                      source: "apply_pricing",
                      value: MAX_PRICING_PLAN.price,
                    }}
                  >
                    Select MAX <ArrowRight className="size-4" />
                  </TrackedLink>
                  <p className="mt-3 text-center text-xs font-medium text-white/45">
                    Designed to impress your guests.
                  </p>
                </div>
              </div>
            </SpotlightCard>
          </div>
        </div>

        {/* Pricing disclaimer */}
        <p className="apply-landing-disclaimer mt-12 max-w-md text-center text-xs text-white/40">
          Limited introductory pricing. Prices may increase in future releases.
        </p>
      </div>
    </main>
  );
}

"use client";

import { ArrowRight, Crown, Gem, Check } from "lucide-react";
import { TrackedLink } from "@/components/meta-pixels/tracked-link";
import { MaxPlanFeatureList } from "@/components/pricing/max-plan-feature-list";
import { SpotlightCard } from "@/components/ui/spotlight-card";
import { MAX_PRICING_PLAN, PRO_PRICING_PLAN } from "@/lib/pricing-plans";
import { PROMO_CONFIG } from "@/lib/promotion-config";

export function LandingPricing() {
  return (
    <section
      id="pricing"
      className="landing-theme-dark relative isolate w-full scroll-mt-28 overflow-hidden bg-[var(--landing-bg)] py-24 sm:py-32"
    >
      {/* Background Dashed Grid with Fade */}
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

      <div className="relative z-10 mx-auto flex max-w-7xl flex-col items-center px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="mb-6 flex flex-col items-center gap-4 text-center">
          <h2 className="max-w-3xl text-3xl leading-tight font-extrabold tracking-tight text-white sm:text-5xl sm:leading-none lg:text-6xl">
            Choose Your Plan —<br />
            <span className="bg-gradient-to-r from-[#ff8a5c] via-[#ff6b3b] to-yellow-500 bg-clip-text text-transparent">
              Launch Your RSVP Website Faster
            </span>
          </h2>
          <p className="mt-4 max-w-2xl text-sm text-white/70 sm:text-base md:text-lg">
            Start with the complete PRO website, or upgrade to MAX for a more premium animated guest
            experience.
          </p>
        </div>

        {/* Highlighted Promotion Badge */}
        {PROMO_CONFIG.isActive && (
          <div className="mb-14 inline-flex items-center justify-center gap-2 rounded-2xl border border-[#ff8a5c]/20 bg-white/[0.02] px-6 py-2.5 shadow-lg shadow-orange-950/5 backdrop-blur-md">
            <span className="bg-gradient-to-r from-[#ff8a5c] to-amber-500 bg-clip-text text-xs font-black tracking-widest text-transparent uppercase">
              {PROMO_CONFIG.discountLabel}
            </span>
            <span className="text-white/30">·</span>
            <span className="text-xs font-medium tracking-wide text-white/90 sm:text-sm">
              {PROMO_CONFIG.offerLabel}
            </span>
          </div>
        )}

        {/* Pricing Cards Grid */}
        <div className="grid w-full max-w-5xl grid-cols-1 items-stretch gap-8 px-2 sm:px-4 md:grid-cols-2">
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
                    <h3 className="text-2xl font-extrabold tracking-wide text-white">
                      {PRO_PRICING_PLAN.name}
                    </h3>
                  </div>

                  {/* Description */}
                  <p className="mb-6 text-sm leading-relaxed text-white/60">
                    {PRO_PRICING_PLAN.description}
                  </p>

                  {/* Pricing Representation */}
                  <div className="mb-8 flex items-baseline gap-2">
                    <span className="text-4xl font-extrabold text-white">
                      {PRO_PRICING_PLAN.priceLabel}
                    </span>
                    <span className="text-sm text-white/40 line-through">
                      {PRO_PRICING_PLAN.regularPriceLabel}
                    </span>
                    <span className="text-xs font-medium text-white/50">regular</span>
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
                      source: "landing_pricing",
                      value: PRO_PRICING_PLAN.price,
                    }}
                  >
                    Select PRO <ArrowRight className="size-4" />
                  </TrackedLink>
                  <p className="mt-3 text-center text-xs font-medium text-white/45">
                    Perfect for most couples.
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
                    <h3 className="text-2xl font-extrabold tracking-wide text-white">
                      {MAX_PRICING_PLAN.name}
                    </h3>
                  </div>

                  {/* Description */}
                  <p className="mb-6 text-sm leading-relaxed text-white/60">
                    {MAX_PRICING_PLAN.description}
                  </p>

                  {/* Pricing Representation */}
                  <div className="mb-8 flex items-baseline gap-2">
                    <span className="text-4xl font-extrabold text-white">
                      {MAX_PRICING_PLAN.priceLabel}
                    </span>
                    <span className="text-sm text-white/40 line-through">
                      {MAX_PRICING_PLAN.regularPriceLabel}
                    </span>
                    <span className="text-xs font-medium text-white/50">regular</span>
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
                      source: "landing_pricing",
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
        <p className="mt-12 max-w-md text-center text-xs text-white/40">
          Limited introductory pricing. Prices may increase in future releases.
        </p>
      </div>
    </section>
  );
}

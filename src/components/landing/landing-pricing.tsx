"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Crown, Gem, Check } from "lucide-react";
import { SpotlightCard } from "@/components/ui/spotlight-card";

const PRO_FEATURES = [
  "Premium mobile-friendly RSVP website",
  "Event details and schedule sections",
  "RSVP form and guest tracking",
  "Gallery and story sections",
  "Unlimited RSVP responses",
  "Guest response export",
  "Hosting included",
  "Website access controls",
  "1-year support and maintenance",
];

const MAX_FEATURES = [
  "Everything in PRO",
  "Advanced custom animations",
  "Premium motion and interaction polish",
  "Enhanced visual personalization",
  "More immersive section transitions",
  "Couple Alignment Kit included",
  "E-book resources for conversations, budgeting, newlywed planning, date night ideas, and more — ₱10,000 bonus value.",
  "Priority creative refinement",
  "Priority setup",
];

// Frontend-only rolling 72-hour countdown
// Uses a fixed UTC epoch constant in code
const EPOCH_DATE = new Date("2026-07-01T00:00:00Z").getTime();
const CYCLE_MS = 72 * 60 * 60 * 1000; // 72 hours in ms

function useCountdown() {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    function calculateTime() {
      const now = Date.now();
      const elapsed = now - EPOCH_DATE;
      const remainingMs = CYCLE_MS - (elapsed % CYCLE_MS);

      const days = Math.floor(remainingMs / (24 * 60 * 60 * 1000));
      const hours = Math.floor((remainingMs % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
      const minutes = Math.floor((remainingMs % (60 * 60 * 1000)) / (60 * 1000));
      const seconds = Math.floor((remainingMs % (60 * 1000)) / 1000);

      setTimeLeft({ days, hours, minutes, seconds });
    }

    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return timeLeft;
}

export function LandingPricing() {
  const [isMounted, setIsMounted] = useState(false);
  const timeLeft = useCountdown();

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsMounted(true);
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const days = isMounted ? String(timeLeft.days).padStart(2, "0") : "--";
  const hours = isMounted ? String(timeLeft.hours).padStart(2, "0") : "--";
  const minutes = isMounted ? String(timeLeft.minutes).padStart(2, "0") : "--";
  const seconds = isMounted ? String(timeLeft.seconds).padStart(2, "0") : "--";

  return (
    <section
      id="pricing"
      className="landing-theme-dark relative isolate w-full scroll-mt-28 bg-[var(--landing-bg)] overflow-hidden py-24 sm:py-32"
    >
      {/* Background Dashed Grid with Fade */}
      <div
        className="absolute inset-0 z-0 pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='64' height='64' viewBox='0 0 64 64' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M 64 0 L 0 0 0 64' fill='none' stroke='rgba(255,138,92,0.12)' stroke-width='1' stroke-dasharray='4 4' /%3E%3C/svg%3E")`,
          maskImage: "radial-gradient(ellipse at 50% 50%, transparent 15%, black 50%, black 85%, transparent 100%)",
          WebkitMaskImage: "radial-gradient(ellipse at 50% 50%, transparent 15%, black 50%, black 85%, transparent 100%)",
        }}
      />

      {/* Decorative dark background glows */}
      {/* Gold/coral glow center-left */}
      <div
        className="absolute top-1/4 left-1/4 -translate-y-1/2 z-0 size-[600px] rounded-full pointer-events-none bg-[radial-gradient(circle_at_center,rgba(234,179,8,0.03)_0%,rgba(255,138,92,0.02)_40%,transparent_70%)] blur-3xl"
        aria-hidden="true"
      />
      {/* Plum/espresso glow bottom-right */}
      <div
        className="absolute bottom-10 right-1/4 z-0 size-[600px] rounded-full pointer-events-none bg-[radial-gradient(circle_at_center,rgba(60,20,40,0.18)_0%,transparent_70%)] blur-3xl"
        aria-hidden="true"
      />

      <div className="relative z-10 mx-auto max-w-7xl flex flex-col items-center px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-6 flex flex-col items-center gap-4">
          <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl max-w-3xl leading-tight sm:leading-none">
            Choose Your Plan —<br />
            <span className="bg-gradient-to-r from-[#ff8a5c] via-[#ff6b3b] to-yellow-500 bg-clip-text text-transparent">
              Launch Your RSVP Website Faster
            </span>
          </h2>
          <p className="text-sm sm:text-base md:text-lg text-white/70 max-w-2xl mt-4">
            Start with the complete PRO website, or upgrade to MAX for a more premium animated guest experience.
          </p>
        </div>

        {/* Highlighted Countdown Badge */}
        <div className="mb-14 inline-flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3 rounded-2xl border border-[#ff8a5c]/20 bg-white/[0.02] px-6 py-3 shadow-lg shadow-orange-950/5 backdrop-blur-md">
          <span className="bg-gradient-to-r from-[#ff8a5c] to-amber-500 bg-clip-text text-transparent text-xs font-black tracking-widest uppercase">
            50% OFF DISCOUNT
          </span>
          <span className="hidden sm:inline text-white/20">|</span>
          <span className="text-xs sm:text-sm font-medium tracking-wide text-white/90">
            Ends in{" "}
            <span className="font-mono font-bold text-[#ff8a5c]">
              {days}d {hours}h {minutes}m {seconds}s
            </span>
          </span>
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-5xl items-stretch px-2 sm:px-4">
          {/* PRO Card */}
          <div className="relative pt-6 h-full flex flex-col">
            {/* Top Floating Badge */}
            <div className="absolute top-0 left-0 right-0 flex justify-center z-10">
              <span className="inline-block bg-white/10 border border-white/10 text-white text-[10px] font-bold tracking-widest px-3 py-1 rounded-full uppercase shadow-md">
                MOST POPULAR
              </span>
            </div>

            <SpotlightCard className="flex flex-col h-full border border-white/[0.06] bg-white/[0.015] backdrop-blur-2xl hover:border-white/15" spotlightColor="rgba(255, 138, 92, 0.12)">
              <div className="p-8 flex flex-col justify-between h-full min-h-[560px]">
                {/* Upper Block */}
                <div>
                  {/* Card Title & Icon */}
                  <div className="flex items-center gap-3 mb-3">
                    <div className="size-10 rounded-xl bg-white/[0.04] border border-white/10 flex items-center justify-center text-[#ff8a5c]">
                      <Gem className="size-5" />
                    </div>
                    <h3 className="text-2xl font-extrabold text-white tracking-wide">PRO</h3>
                  </div>

                  {/* Description */}
                  <p className="text-sm text-white/60 leading-relaxed mb-6">
                    Everything you need for a beautiful RSVP website.
                  </p>

                  {/* Pricing Representation */}
                  <div className="flex items-baseline gap-2 mb-8">
                    <span className="text-4xl font-extrabold text-white">₱1,599</span>
                    <span className="text-sm text-white/40 line-through">₱3,200</span>
                    <span className="text-xs text-white/50 font-medium">regular</span>
                  </div>

                  {/* Feature Divider */}
                  <div className="h-[1px] w-full bg-white/10 mb-6" />
                  <p className="text-xs font-bold text-[#ff8a5c] tracking-widest uppercase mb-4">
                    What&apos;s included:
                  </p>

                  {/* Feature List */}
                  <ul className="space-y-3.5 mb-8">
                    {PRO_FEATURES.map((feat) => (
                      <li key={feat} className="flex items-start gap-3">
                        <Check className="size-4 text-[#ff8a5c] shrink-0 mt-0.5" />
                        <span className="text-sm text-white/80 leading-snug">{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Footer Block */}
                <div className="mt-auto">
                  <Link
                    href="/apply/start?plan=pro"
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-white/10 px-4 py-3.5 text-sm font-semibold text-white transition-all duration-200 hover:bg-white/20 hover:text-white border border-white/5 hover:border-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
                  >
                    Select PRO <ArrowRight className="size-4" />
                  </Link>
                  <p className="text-xs text-white/45 text-center mt-3 font-medium">
                    Perfect for most couples.
                  </p>
                </div>
              </div>
            </SpotlightCard>
          </div>

          {/* MAX Card */}
          <div className="relative pt-6 h-full flex flex-col">
            {/* Top Floating Badge */}
            <div className="absolute top-0 left-0 right-0 flex justify-center z-10">
              <span className="inline-block bg-gradient-to-r from-[#ff8a5c] to-amber-500 text-white text-[10px] font-black tracking-widest px-3 py-1 rounded-full uppercase shadow-md shadow-orange-950/20">
                MOST MEMORABLE EXPERIENCE
              </span>
            </div>

            <SpotlightCard className="flex flex-col h-full border border-[#ff8a5c]/25 bg-white/[0.025] backdrop-blur-2xl hover:border-[#ff8a5c]/40 shadow-lg shadow-orange-950/5" spotlightColor="rgba(251, 191, 36, 0.16)">
              <div className="p-8 flex flex-col justify-between h-full min-h-[560px]">
                {/* Upper Block */}
                <div>
                  {/* Card Title & Icon */}
                  <div className="flex items-center gap-3 mb-3">
                    <div className="size-10 rounded-xl bg-[#ff8a5c]/10 border border-[#ff8a5c]/35 flex items-center justify-center text-[#ff8a5c]">
                      <Crown className="size-5" />
                    </div>
                    <h3 className="text-2xl font-extrabold text-white tracking-wide">MAX</h3>
                  </div>

                  {/* Description */}
                  <p className="text-sm text-white/60 leading-relaxed mb-6">
                    For couples who want a more premium and memorable guest experience.
                  </p>

                  {/* Pricing Representation */}
                  <div className="flex items-baseline gap-2 mb-8">
                    <span className="text-4xl font-extrabold text-white">₱3,599</span>
                    <span className="text-sm text-white/40 line-through">₱7,200</span>
                    <span className="text-xs text-white/50 font-medium">regular</span>
                  </div>

                  {/* Feature Divider */}
                  <div className="h-[1px] w-full bg-white/10 mb-6" />
                  <p className="text-xs font-bold text-[#ff8a5c] tracking-widest uppercase mb-4">
                    What&apos;s included:
                  </p>

                  {/* Feature List */}
                  <ul className="space-y-3.5 mb-8">
                    {MAX_FEATURES.map((feat) => (
                      <li key={feat} className="flex items-start gap-3">
                        <Check className="size-4 text-[#ff8a5c] shrink-0 mt-0.5" />
                        <span className="text-sm text-white/80 leading-snug">{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Footer Block */}
                <div className="mt-auto">
                  <Link
                    href="/apply/start?plan=max"
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#ff8a5c] to-[#ff6b3b] px-4 py-3.5 text-sm font-semibold text-white shadow-lg shadow-orange-950/20 transition-all duration-200 hover:brightness-110 hover:shadow-orange-950/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff8a5c]/50"
                  >
                    Select MAX <ArrowRight className="size-4" />
                  </Link>
                  <p className="text-xs text-white/45 text-center mt-3 font-medium">
                    Designed to impress your guests.
                  </p>
                </div>
              </div>
            </SpotlightCard>
          </div>
        </div>

        {/* Pricing disclaimer */}
        <p className="text-center text-xs text-white/40 mt-12 max-w-md">
          Limited introductory pricing. Prices may increase in future releases.
        </p>
      </div>
    </section>
  );
}

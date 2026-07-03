"use client";

import { motion, useReducedMotion, type Variants } from "motion/react";

export function LandingTrustPromise() {
  const shouldReduceMotion = useReducedMotion();

  // Animation variants for the card container
  const cardVariants: Variants = {
    hidden: { opacity: 0, y: shouldReduceMotion ? 0 : 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: "easeOut",
        staggerChildren: 0.1,
      },
    },
  };

  // Animation variants for the child items
  const itemVariants: Variants = {
    hidden: { opacity: 0, y: shouldReduceMotion ? 0 : 10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: "easeOut",
      },
    },
  };

  // Animation variants for drawing the organic SVG underline
  const pathVariants: Variants = {
    hidden: { pathLength: 0, opacity: 0 },
    visible: {
      pathLength: 1,
      opacity: 0.85,
      transition: {
        duration: 1.1,
        ease: "easeInOut",
        delay: 0.35,
      },
    },
  };

  return (
    <section
      id="trust-promise"
      className="landing-theme-dark relative isolate w-full scroll-mt-28 bg-[var(--landing-bg)] overflow-hidden pt-10 sm:pt-12 pb-24 sm:pb-32"
    >
      {/* Background Dashed Grid with Fade (visual continuation of Features section background) */}
      <div
        className="absolute inset-0 z-0 pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='64' height='64' viewBox='0 0 64 64' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M 64 0 L 0 0 0 64' fill='none' stroke='rgba(255,138,92,0.15)' stroke-width='1' stroke-dasharray='4 4' /%3E%3C/svg%3E")`,
          maskImage: "radial-gradient(ellipse at 50% 50%, transparent 15%, black 50%, black 80%, transparent 100%)",
          WebkitMaskImage: "radial-gradient(ellipse at 50% 50%, transparent 15%, black 50%, black 80%, transparent 100%)",
        }}
      />

      {/* Warm espresso/plum/coral background glows to connect with surrounding dark sections */}
      {/* Deep plum glow at top-left corner */}
      <div
        className="absolute top-0 left-1/4 -translate-y-1/2 z-0 size-[600px] rounded-full pointer-events-none bg-[radial-gradient(circle_at_center,rgba(50,20,35,0.15)_0%,transparent_70%)] blur-3xl"
        aria-hidden="true"
      />
      {/* Central coral background glow directly behind the glass card */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-0 size-[550px] rounded-full pointer-events-none bg-[#ff8a5c]/[0.03] blur-[100px]"
        aria-hidden="true"
      />
      {/* Subtle gold glow at bottom-right of section */}
      <div
        className="absolute bottom-0 right-1/4 translate-y-1/3 z-0 size-[500px] rounded-full pointer-events-none bg-[radial-gradient(circle_at_center,rgba(234,179,8,0.04)_0%,rgba(120,30,60,0.02)_50%,transparent_75%)] blur-3xl"
        aria-hidden="true"
      />

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          variants={cardVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="mx-auto max-w-4xl relative overflow-hidden rounded-[32px] border border-white/10 bg-white/[0.025] px-6 py-16 sm:px-12 sm:py-20 md:px-16 md:py-24 shadow-[inset_0_1px_0_rgba(255,255,255,0.08),_0_24px_50px_-12px_rgba(0,0,0,0.5)] backdrop-blur-2xl"
        >
          {/* Inner card warm coral/espresso radial gradient glow for premium highlight depth */}
          <div
            className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_50%_40%,rgba(255,138,92,0.04),transparent_60%)] pointer-events-none"
            aria-hidden="true"
          />

          <div className="relative z-10 flex flex-col items-center text-center">
            {/* Small Badge */}
            <motion.span
              variants={itemVariants}
              className="mb-6 inline-flex items-center rounded-full bg-white/[0.04] px-4 py-1.5 text-xs font-semibold tracking-widest text-[#ff8a5c] uppercase ring-1 ring-inset ring-[#ff8a5c]/20 shadow-[0_0_15px_rgba(255,138,92,0.08)]"
            >
              NO-RISK PREVIEW
            </motion.span>

            {/* Main Headline */}
            <motion.h2
              variants={itemVariants}
              className="text-[20px] min-[360px]:text-[22px] min-[390px]:text-[26px] sm:text-4xl lg:text-5xl xl:text-6xl font-bold tracking-tight text-[var(--landing-text)] leading-tight max-w-3xl"
            >
              <span className="relative inline-block pb-3">
                Website muna, bago bayad!
                <svg
                  className="absolute left-0 bottom-0 h-[10px] sm:h-[12px] w-full text-[#ff8a5c]"
                  viewBox="0 0 400 12"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  preserveAspectRatio="none"
                  aria-hidden="true"
                >
                  {/* Organic double-stroke paths (slightly wavy, imperfect lines) */}
                  <motion.path
                    d="M 5 2 C 100 0, 300 4, 395 3"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    variants={shouldReduceMotion ? undefined : pathVariants}
                    style={shouldReduceMotion ? { pathLength: 1, opacity: 0.85 } : undefined}
                  />
                  <motion.path
                    d="M 12 7 C 120 5, 280 9, 385 8"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    variants={shouldReduceMotion ? undefined : pathVariants}
                    style={shouldReduceMotion ? { pathLength: 1, opacity: 0.85 } : undefined}
                  />
                </svg>
              </span>
            </motion.h2>

            {/* Body */}
            <motion.p
              variants={itemVariants}
              className="mx-auto mt-8 max-w-2xl text-lg sm:text-xl leading-relaxed text-[var(--landing-muted)] font-normal"
            >
              We build your website first, so you can review the full preview before paying. If it feels right, approve it and go live.
            </motion.p>

            {/* Trust Chip */}
            <motion.div
              variants={itemVariants}
              className="mt-10 inline-flex items-center gap-2 rounded-full border border-white/5 bg-white/[0.02] px-5 py-2 text-sm font-medium text-[var(--landing-subtle)] shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] backdrop-blur-sm"
            >
              <span className="inline-block size-1.5 rounded-full bg-[#ff8a5c] animate-pulse" />
              <span>7-day money-back guarantee</span>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

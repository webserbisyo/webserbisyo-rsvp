"use client";

import { useState } from "react";
import Image, { type StaticImageData } from "next/image";
import { ArrowRight } from "lucide-react";
import { motion, useReducedMotion, type Variants } from "motion/react";
import { cn } from "@/lib/utils";
import { buildMessengerContinueUrl } from "@/lib/apply/messenger";
import { TrackedAnchor, TrackedLink } from "@/components/meta-pixels/tracked-link";
import { MessengerIcon } from "@/components/ui/icons/messenger-icon";

import applyImg from "../../../public/images/landing/how-it-works/apply.webp";
import buildFirstImg from "../../../public/images/landing/how-it-works/build-first.webp";
import confirmGoLiveImg from "../../../public/images/landing/how-it-works/confirm-go-live.webp";

type StepType = {
  number: string;
  title: string;
  description: string;
  microcopy: string;
  imageSrc: StaticImageData;
  alt: string;
  imageWidthClass: string;
  priority: boolean;
  loading?: "eager" | "lazy";
  fetchPriority?: "high" | "low" | "auto";
};

const steps: StepType[] = [
  {
    number: "01",
    title: "Apply",
    description: "Tell us about your big day. Takes about 3 minutes.",
    microcopy: "Names, event date, venue, attire motif, and event theme.",
    imageSrc: applyImg,
    alt: "Apply step illustration",
    imageWidthClass: "w-[82%] sm:w-[78%] lg:w-[78%]",
    priority: true,
  },
  {
    number: "02",
    title: "We build first",
    description: "Website muna — we design and build before you pay anything.",
    microcopy: "We prepare your RSVP form, event details, gallery, and preview link.",
    imageSrc: buildFirstImg,
    alt: "Website build step illustration",
    imageWidthClass: "w-[92%] sm:w-[88%] lg:w-[88%]",
    priority: false,
    loading: "lazy",
    fetchPriority: "low",
  },
  {
    number: "03",
    title: "Confirm & go live",
    description: "Love it? Confirm on Messenger, pay, and your site goes live.",
    microcopy: "Request small edits, approve the final website, then share your link.",
    imageSrc: confirmGoLiveImg,
    alt: "Confirm and go live step illustration",
    imageWidthClass: "w-[78%] sm:w-[74%] lg:w-[74%]",
    priority: false,
    loading: "lazy",
  },
];

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const headerItemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
};

const mediaVariants = (isLeft: boolean): Variants => ({
  hidden: { opacity: 0, x: isLeft ? -40 : 40 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.8, ease: "easeOut" },
  },
});

const textVariants = (isLeft: boolean): Variants => ({
  hidden: { opacity: 0, x: isLeft ? -40 : 40 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.8, ease: "easeOut" },
  },
});

function StepImage({ step, index }: { step: StepType; index: number }) {
  const shouldReduceMotion = useReducedMotion();
  const [loaded, setLoaded] = useState(false);

  return (
    <motion.div
      animate={shouldReduceMotion ? {} : { y: [0, -8, 0] }}
      transition={{
        duration: 5 + index, // slight variance between rows
        repeat: Infinity,
        ease: "easeInOut",
      }}
      className={cn("relative z-10", step.imageWidthClass)}
    >
      <Image
        src={step.imageSrc}
        alt={step.alt}
        priority={step.priority}
        loading={step.loading}
        fetchPriority={step.fetchPriority}
        placeholder="empty"
        onLoad={() => setLoaded(true)}
        className={cn(
          "h-auto w-full object-contain transition-opacity duration-700 ease-out",
          loaded || step.priority || step.loading === "eager" ? "opacity-100" : "opacity-0"
        )}
      />
    </motion.div>
  );
}

type LandingHowItWorksProps = {
  messengerPageUrl?: string | null;
};

export function LandingHowItWorks({ messengerPageUrl }: LandingHowItWorksProps) {
  const messengerUrl = buildMessengerContinueUrl(messengerPageUrl);

  return (
    <section
      id="how-it-works"
      className="landing-theme-dark relative isolate w-full scroll-mt-28 bg-[var(--landing-bg)] pb-16 pt-20 sm:pb-20 sm:pt-28 lg:pb-24 lg:pt-32"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <motion.div
          className="mx-auto max-w-2xl text-center lg:max-w-none"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={containerVariants}
        >
          <motion.h2
            variants={headerItemVariants}
            className="text-4xl font-bold tracking-tight text-[var(--landing-text)] sm:text-5xl lg:text-6xl"
          >
            How it works?
          </motion.h2>
          <motion.p
            variants={headerItemVariants}
            className="mt-6 text-xl font-semibold text-[var(--landing-text)] sm:text-2xl"
          >
            From inquiry to live website in 3 simple steps.
          </motion.p>
          <motion.p
            variants={headerItemVariants}
            className="mx-auto mt-4 max-w-2xl text-lg leading-relaxed text-[var(--landing-muted)]"
          >
            A smooth, low-pressure process made for busy couples.
          </motion.p>
        </motion.div>

        {/* Steps */}
        <div className="mt-16 flex flex-col gap-16 sm:mt-24 sm:gap-24 lg:mt-32 lg:gap-32">
          {steps.map((step, index) => {
            const isVisualLeft = index % 2 === 0;

            return (
              <motion.div
                key={step.number}
                className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-16"
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-100px" }}
              >
                {/* Visual */}
                <motion.div
                  variants={mediaVariants(isVisualLeft)}
                  className={cn(
                    "flex w-full items-center justify-center",
                    isVisualLeft ? "lg:order-1" : "lg:order-2"
                  )}
                >
                  <div className="relative flex w-full flex-col items-center justify-center overflow-hidden rounded-[28px] border border-white/5 bg-white/[0.02] p-10 shadow-2xl shadow-orange-900/10 backdrop-blur-sm sm:rounded-[36px] sm:p-14 lg:h-[400px]">
                    {/* Soft radial glow */}
                    <div className="absolute inset-0 z-0 m-auto size-[220px] rounded-full bg-[#ff8a5c] opacity-15 blur-[60px] sm:size-[300px]" />
                    
                    {/* Inner floating asset with custom component */}
                    <StepImage step={step} index={index} />
                  </div>
                </motion.div>

                {/* Text */}
                <motion.div
                  variants={textVariants(!isVisualLeft)}
                  className={cn(
                    "flex flex-col justify-center",
                    isVisualLeft ? "lg:order-2" : "lg:order-1"
                  )}
                >
                  <div className="mb-4 inline-flex items-center text-sm font-semibold tracking-[0.15em] text-orange-400">
                    {step.number}
                  </div>
                  <h3 className="mb-3 text-2xl font-bold tracking-tight text-[var(--landing-text)] sm:text-3xl lg:text-4xl">
                    {step.title}
                  </h3>
                  <p className="max-w-[420px] text-lg leading-relaxed text-[var(--landing-muted)]">
                    {step.description}
                  </p>
                  <p className="mt-3 max-w-[420px] text-sm leading-relaxed text-[var(--landing-muted)] opacity-80">
                    {step.microcopy}
                  </p>

                  {/* Apply CTA (Step 1) */}
                  {step.number === "01" && (
                    <TrackedLink
                      href="/apply"
                      className="landing-cta-button group/how-cta mt-8 h-12 w-full px-6 text-sm sm:w-auto self-start gap-2"
                      trackingEvent="StartApplicationClick"
                      trackingParams={{
                        content_category: "RSVP Website Application",
                        destination: "/apply",
                        source: "landing_how_it_works",
                      }}
                    >
                      Apply
                      <ArrowRight className="size-4 transition-transform duration-200 group-hover/how-cta:translate-x-0.5" />
                    </TrackedLink>
                  )}

                  {/* Messenger CTA (Step 3) */}
                  {step.number === "03" && messengerUrl && (
                    <TrackedAnchor
                      href={messengerUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group/messenger mt-8 flex h-12 w-full items-center justify-center gap-2 rounded-full border border-white/10 bg-white/5 px-6 text-sm font-medium text-[var(--landing-text)] shadow-[inset_0_1px_0_rgba(255,255,255,0.1)] transition-all hover:border-[#0084FF]/50 hover:bg-white/10 sm:w-auto self-start"
                      trackingEvent="Contact"
                      trackingParams={{
                        contact_method: "messenger",
                        source: "landing_how_it_works",
                      }}
                    >
                      <MessengerIcon className="size-5 text-[#0084FF]" />
                      Continue on Messenger
                    </TrackedAnchor>
                  )}
                </motion.div>
              </motion.div>
            );
          })}
        </div>

      </div>
    </section>
  );
}

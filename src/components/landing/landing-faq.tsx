"use client";

import { motion, useReducedMotion, type Variants } from "motion/react";
import { Accordion as AccordionPrimitive } from "radix-ui";
import { Plus, Minus, ArrowRight } from "lucide-react";
import { TrackedAnchor } from "@/components/meta-pixels/tracked-link";
import { buildMessengerContinueUrl } from "@/lib/apply/messenger";

type FAQItem = {
  question: string;
  answer: string;
};

const FAQ_ITEMS: FAQItem[] = [
  {
    question: "Do I need to pay immediately?",
    answer: "No. You can apply first and review your website preview before final payment. Payment details are confirmed on Messenger when you are ready to proceed.",
  },
  {
    question: "What is included in the PRO package?",
    answer: "PRO includes a premium mobile-friendly RSVP website, event details, RSVP form, guest response tracking, gallery/story sections, hosting, guest response export, and 1-year support and maintenance. It is the complete package for most couples.",
  },
  {
    question: "What makes MAX different from PRO?",
    answer: "MAX includes everything in PRO, plus advanced custom animations, more premium interaction polish, enhanced visual personalization, and the Couple Alignment Kit with bonus guides for conversations, budgeting, newlywed planning, and date night ideas.",
  },
  {
    question: "Can I request changes before going live?",
    answer: "Yes. You can review the website preview and request small edits before approving the final website for launch.",
  },
  {
    question: "What happens after applying?",
    answer: "After submitting your application, you’ll receive a reference code and continue on Messenger. The team will confirm your details, guide the next steps, and prepare your website preview.",
  },
  {
    question: "Can I use GCash or Maya?",
    answer: "Yes. If enabled by WebSerbisyo, you can choose GCash or Maya as your payment option. Final instructions are confirmed on Messenger.",
  },
  {
    question: "How do I follow up?",
    answer: "Use your reference code when messaging WebSerbisyo on Messenger so the team can quickly find your application and continue your onboarding.",
  },
];

type LandingFAQProps = {
  messengerPageUrl?: string | null;
};

export function LandingFAQ({ messengerPageUrl }: LandingFAQProps) {
  const shouldReduceMotion = useReducedMotion();
  const messengerUrl = buildMessengerContinueUrl(messengerPageUrl);

  // Staggered entrance animation variants for the section content
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: shouldReduceMotion ? 0 : 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: "easeOut",
      },
    },
  };

  return (
    <section
      id="faq"
      className="landing-theme-dark relative isolate w-full scroll-mt-32 bg-[var(--landing-bg)] overflow-hidden py-24 sm:py-32"
    >
      {/* Background Dashed Grid with Fade (seamlessly continues Features/TrustPromise background) */}
      <div
        className="absolute inset-0 z-0 pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='64' height='64' viewBox='0 0 64 64' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M 64 0 L 0 0 0 64' fill='none' stroke='rgba(255,138,92,0.12)' stroke-width='1' stroke-dasharray='4 4' /%3E%3C/svg%3E")`,
          maskImage: "radial-gradient(ellipse at 50% 50%, transparent 15%, black 50%, black 85%, transparent 100%)",
          WebkitMaskImage: "radial-gradient(ellipse at 50% 50%, transparent 15%, black 50%, black 85%, transparent 100%)",
        }}
      />

      {/* Decorative dark background glows */}
      {/* Gold/coral glow bottom-left */}
      <div
        className="absolute bottom-0 left-1/4 -translate-y-1/2 z-0 size-[500px] rounded-full pointer-events-none bg-[radial-gradient(circle_at_center,rgba(234,179,8,0.03)_0%,rgba(255,138,92,0.02)_40%,transparent_70%)] blur-3xl"
        aria-hidden="true"
      />
      {/* Plum/espresso glow right-center */}
      <div
        className="absolute top-1/3 right-1/4 z-0 size-[600px] rounded-full pointer-events-none bg-[radial-gradient(circle_at_center,rgba(60,20,40,0.15)_0%,transparent_70%)] blur-3xl"
        aria-hidden="true"
      />

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="mx-auto flex max-w-3xl flex-col items-center"
        >
          {/* Section Header */}
          <div className="text-center mb-16">
            <motion.h2
              variants={itemVariants}
              className="text-4xl font-bold tracking-tight text-[var(--landing-text)] sm:text-5xl"
            >
              Questions before you apply?
            </motion.h2>
            <motion.p
              variants={itemVariants}
              className="mt-4 text-lg text-[var(--landing-muted)] max-w-2xl mx-auto"
            >
              Everything you need to know before WebSerbisyo builds your RSVP website.
            </motion.p>
            {messengerUrl && (
              <motion.div variants={itemVariants} className="mt-4">
                <TrackedAnchor
                  href={messengerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#ff8a5c] transition-colors hover:text-[#ff742f]"
                  trackingEvent="Contact"
                  trackingParams={{
                    contact_method: "messenger",
                    source: "landing_faq",
                  }}
                >
                  Still unsure? Message us <ArrowRight className="size-4" />
                </TrackedAnchor>
              </motion.div>
            )}
          </div>

          {/* Accordion Container */}
          <motion.div variants={itemVariants} className="w-full">
            <AccordionPrimitive.Root type="single" collapsible className="w-full space-y-4">
              {FAQ_ITEMS.map((item, idx) => (
                <AccordionPrimitive.Item
                  key={idx}
                  value={`faq-item-${idx}`}
                  className="w-full overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.015] px-6 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.05),_0_4px_16px_rgba(0,0,0,0.2)] backdrop-blur-2xl transition-all duration-300 hover:border-white/10 hover:bg-white/[0.025] data-[state=open]:border-[#ff8a5c]/20 data-[state=open]:bg-white/[0.035] data-[state=open]:shadow-[inset_0_1px_0_rgba(255,255,255,0.08),_0_12px_24px_rgba(255,138,92,0.04)]"
                >
                  <AccordionPrimitive.Header className="flex">
                    <AccordionPrimitive.Trigger className="group/trigger flex w-full items-center justify-between py-2 text-left font-semibold text-base sm:text-lg text-[var(--landing-text)] transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff8a5c]/40 rounded-lg select-none">
                      <span className="pr-4">{item.question}</span>
                      <div className="relative size-5 shrink-0 text-[#ff8a5c]/80 transition-transform duration-300 group-hover/trigger:text-[#ff8a5c]">
                        {/* Plus and Minus toggle elements matching visual design target */}
                        <Plus className="absolute inset-0 size-5 transition-all duration-300 group-data-[state=open]/trigger:scale-0 group-data-[state=open]/trigger:rotate-90 opacity-100 group-data-[state=open]/trigger:opacity-0" />
                        <Minus className="absolute inset-0 size-5 transition-all duration-300 scale-0 rotate-0 opacity-0 group-data-[state=open]/trigger:scale-100 group-data-[state=open]/trigger:rotate-180 group-data-[state=open]/trigger:opacity-100" />
                      </div>
                    </AccordionPrimitive.Trigger>
                  </AccordionPrimitive.Header>
                  <AccordionPrimitive.Content className="data-[state=open]:animate-accordion-down data-[state=closed]:animate-accordion-up overflow-hidden text-sm sm:text-base leading-relaxed text-[var(--landing-muted)]">
                    <div className="pt-3 pb-2 text-[var(--landing-muted)]">
                      {item.answer}
                    </div>
                  </AccordionPrimitive.Content>
                </AccordionPrimitive.Item>
              ))}
            </AccordionPrimitive.Root>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

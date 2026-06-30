"use client";

import { FileCode2, ReceiptText, Globe2, Headset, ShieldCheck } from "lucide-react";
import { SpotlightCard } from "@/components/ui/spotlight-card";
import { motion, type Variants } from "motion/react";

export function LandingTrustBar() {
  const cards = [
    {
      title: "Lifetime website ownership",
      description: "Request your website files anytime.",
      icon: <FileCode2 className="size-11" strokeWidth={1.8} />,
    },
    {
      title: "One-time website payment",
      description: "No monthly website subscription fees.",
      icon: <ReceiptText className="size-11" strokeWidth={1.8} />,
    },
    {
      title: "Free domain for 1 year",
      description: "Launch with a clean custom event link.",
      icon: <Globe2 className="size-11" strokeWidth={1.8} />,
    },
    {
      title: "1-year support & maintenance",
      description: "Fixes and small content updates are covered.",
      icon: <Headset className="size-11" strokeWidth={1.8} />,
    },
    {
      title: "7-day money-back guarantee",
      description: "Pay with confidence after your website preview.",
      icon: <ShieldCheck className="size-11" strokeWidth={1.8} />,
    },
  ];

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
      },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
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
    <section className="landing-theme-dark relative isolate w-full bg-[var(--landing-bg)] py-20 sm:py-28 lg:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          className="mx-auto max-w-2xl text-center lg:max-w-none"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={containerVariants}
        >
          <motion.p
            variants={itemVariants}
            className="mb-6 inline-flex items-center rounded-full bg-transparent px-3 py-1 text-sm font-medium text-[var(--landing-text)] ring-1 ring-inset ring-[var(--landing-border)] transition-colors"
          >
            Included with every RSVP website
          </motion.p>
          <motion.h2
            variants={itemVariants}
            className="text-3xl font-bold tracking-tight text-[var(--landing-text)] sm:text-4xl lg:text-5xl"
          >
            Built for trust, ownership, and peace of mind
          </motion.h2>
          <motion.p
            variants={itemVariants}
            className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-[var(--landing-muted)] lg:text-xl"
          >
            No monthly website subscription. Preview your website first, then decide.
          </motion.p>
        </motion.div>

        <motion.div
          className="mt-16 sm:mt-20 lg:mt-24"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={containerVariants}
        >
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {cards.slice(0, 3).map((card, idx) => (
              <motion.div key={idx} variants={itemVariants}>
                <SpotlightCard className="h-full p-8 sm:p-10">
                  <div className="flex h-full flex-col items-center justify-center text-center">
                    <div className="mb-7 flex items-center justify-center text-orange-400 drop-shadow-[0_0_12px_rgba(251,146,60,0.35)]">
                      {card.icon}
                    </div>
                    <h3 className="mb-3 text-xl font-semibold text-[var(--landing-text)]">
                      {card.title}
                    </h3>
                    <p className="text-base text-[var(--landing-muted)]">
                      {card.description}
                    </p>
                  </div>
                </SpotlightCard>
              </motion.div>
            ))}
          </div>
          <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:mx-auto lg:max-w-4xl lg:grid-cols-2">
            {cards.slice(3, 5).map((card, idx) => (
              <motion.div key={idx} variants={itemVariants}>
                <SpotlightCard className="h-full p-8 sm:p-10">
                  <div className="flex h-full flex-col items-center justify-center text-center">
                    <div className="mb-7 flex items-center justify-center text-orange-400 drop-shadow-[0_0_12px_rgba(251,146,60,0.35)]">
                      {card.icon}
                    </div>
                    <h3 className="mb-3 text-xl font-semibold text-[var(--landing-text)]">
                      {card.title}
                    </h3>
                    <p className="text-base text-[var(--landing-muted)]">
                      {card.description}
                    </p>
                  </div>
                </SpotlightCard>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}

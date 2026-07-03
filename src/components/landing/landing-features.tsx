"use client";

import Link from "next/link";
import { 
  Smartphone, 
  Server, 
  LayoutDashboard, 
  Download, 
  LockKeyhole, 
  Infinity as InfinityIcon,
  ArrowRight
} from "lucide-react";
import { motion } from "motion/react";
import { buildMessengerContinueUrl } from "@/lib/apply/messenger";
import { MessengerIcon } from "@/components/ui/icons/messenger-icon";

const features = [
  {
    title: "Mobile-friendly wedding website",
    description: "Looks beautiful on phones, tablets, and desktops so guests can view details anytime.",
    icon: Smartphone,
  },
  {
    title: "Hosting included",
    description: "Your website is published and kept online without monthly hosting setup on your end.",
    icon: Server,
  },
  {
    title: "RSVP dashboard",
    description: "Track guest responses, attendance, meal notes, and RSVP status in one place.",
    icon: LayoutDashboard,
  },
  {
    title: "Guest response export",
    description: "Download guest responses for planning, seating, coordination, and final headcount.",
    icon: Download,
  },
  {
    title: "Access controls",
    description: "Control who can access your RSVP form and reduce random or duplicate responses.",
    icon: LockKeyhole,
  },
  {
    title: "Unlimited responses",
    description: "Accept responses from your full guest list without worrying about per-response limits.",
    icon: InfinityIcon,
  },
];

type LandingFeaturesProps = {
  messengerPageUrl?: string | null;
};

export function LandingFeatures({ messengerPageUrl }: LandingFeaturesProps) {
  const messengerUrl = buildMessengerContinueUrl(messengerPageUrl);

  return (
    <section
      id="features"
      className="landing-theme-dark relative isolate w-full scroll-mt-36 bg-[var(--landing-bg)] overflow-hidden py-24 sm:py-32"
    >
      {/* Background Dashed Grid with Fade */}
      <div 
        className="absolute inset-0 z-0 pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='64' height='64' viewBox='0 0 64 64' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M 64 0 L 0 0 0 64' fill='none' stroke='rgba(255,138,92,0.1)' stroke-width='1' stroke-dasharray='4 4' /%3E%3C/svg%3E")`,
          maskImage: 'radial-gradient(ellipse at 50% 25%, transparent 15%, black 45%, black 85%, transparent 100%)',
          WebkitMaskImage: 'radial-gradient(ellipse at 50% 25%, transparent 15%, black 45%, black 85%, transparent 100%)',
        }}
      />

      {/* Subtle Text Readability Overlay & Warm Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 z-0 size-[800px] pointer-events-none bg-[radial-gradient(ellipse_at_center,rgba(20,10,5,0.4),transparent_60%)]" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-0 m-auto size-[400px] rounded-full bg-[#ff8a5c] opacity-5 blur-[120px] pointer-events-none" />

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header Section */}
        <div className="mx-auto max-w-2xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <h2 className="text-4xl font-bold tracking-tight text-[var(--landing-text)] sm:text-5xl lg:text-6xl">
              FEATURES
            </h2>
            <p className="mt-6 text-xl font-semibold text-[var(--landing-text)] sm:text-2xl">
              Everything your RSVP website needs
            </p>
            <p className="mx-auto mt-4 max-w-2xl text-lg leading-relaxed text-[var(--landing-muted)]">
              Beautiful for guests. Organized for you. Built, hosted, and maintained by WebSerbisyo.
            </p>
          </motion.div>

          {/* CTA Row */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
            className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row sm:gap-6"
          >
            <Link
              href="/apply"
              className="landing-cta-button group/feature-cta h-12 px-6 text-sm gap-2"
            >
              Create my wedding website
              <ArrowRight className="size-4 transition-transform duration-200 group-hover/feature-cta:translate-x-0.5" />
            </Link>
            
            {messengerUrl && (
              <a
                href={messengerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="group/messenger flex h-12 items-center justify-center gap-2 rounded-full border border-white/10 bg-white/5 px-6 text-sm font-medium text-[var(--landing-text)] shadow-[inset_0_1px_0_rgba(255,255,255,0.1)] transition-all hover:border-[#0084FF]/50 hover:bg-white/10 w-full sm:w-auto"
              >
                <MessengerIcon className="size-5 text-[#0084FF]" />
                Message us
              </a>
            )}
          </motion.div>
        </div>

        {/* Features Grid */}
        <div className="mx-auto mt-16 max-w-6xl sm:mt-20 lg:mt-24">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 lg:gap-8 items-stretch">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.5, delay: index * 0.1, ease: "easeOut" }}
                  className="group relative flex flex-col items-center text-center overflow-hidden rounded-[24px] border border-white/5 bg-white/[0.02] p-10 shadow-2xl shadow-orange-900/5 backdrop-blur-md transition-all duration-300 hover:border-orange-500/20 hover:bg-white/[0.04] hover:shadow-orange-900/20 hover:-translate-y-1"
                >
                  <div className="mb-6 inline-flex items-center justify-center rounded-2xl bg-[#ff8a5c]/10 p-4 ring-1 ring-[#ff8a5c]/20 shadow-[0_0_20px_rgba(255,138,92,0.1)] transition-all duration-300 group-hover:bg-[#ff8a5c]/20 group-hover:ring-[#ff8a5c]/30 group-hover:shadow-[0_0_30px_rgba(255,138,92,0.2)]">
                    <Icon className="size-8 text-[#ff8a5c]" />
                  </div>
                  <h3 className="mb-3 text-2xl font-bold tracking-tight text-[var(--landing-text)]">
                    {feature.title}
                  </h3>
                  <p className="text-base leading-relaxed text-[var(--landing-muted)]">
                    {feature.description}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

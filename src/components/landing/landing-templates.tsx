"use client";

import { useState } from "react";
import Image from "next/image";
import { ArrowRight, ExternalLink, Lock, Sparkles } from "lucide-react";
import { TrackedLink } from "@/components/meta-pixels/tracked-link";

export type TemplateArchetype = "wedding" | "debut" | "birthday" | "baptism";

export interface TemplateItem {
  id: string;
  archetype: TemplateArchetype;
  category: "Weddings" | "Debuts" | "Birthdays" | "Baptisms";
  title: string;
  themeName: string;
  subtitle: string;
  description: string;
  demoUrl: string;
  fauxDomain: string;
  previewImage: string;
  colorPalette: readonly [string, string, string, string];
  featureTags: readonly string[];
  badge?: string;
}

export const TEMPLATES: readonly TemplateItem[] = [
  {
    id: "wedding-sage-estate",
    archetype: "wedding",
    category: "Weddings",
    title: "Mart & Joy",
    themeName: "Sage Estate & Botanical",
    subtitle: "Refined botanical elegance with sage greenery, gold flourishes, and romantic serif typography.",
    description: "Built for couples seeking an organic, modern estate aesthetic. Highlights ceremony & reception logistics, entourage hierarchy, and comprehensive dietary RSVP.",
    demoUrl: "https://mart-and-joy-wedding.rsvp.webserbisyo.com/",
    fauxDomain: "mart-and-joy.rsvp.webserbisyo.com",
    previewImage: "/images/templates/wedding-sage-estate.webp",
    colorPalette: ["#556B2F", "#8FBC8F", "#D4AF37", "#FDFBF7"],
    featureTags: ["Interactive RSVP", "Entourage List", "Ceremony & Banquet", "Photo Gallery", "Google Maps"],
    badge: "Most Popular",
  },
  {
    id: "debut-rose-glam",
    archetype: "debut",
    category: "Debuts",
    title: "Alyssa at 18",
    themeName: "Rose Glam Cotillion",
    subtitle: "Dazzling blush rose, glittering gold sparkles, and a lavish 18 Roses cotillion program.",
    description: "Designed for grand 18th celebrations. Features interactive 18 Roses, 18 Candles, and 18 Treasures rosters, celebrant spotlight, and theme dress codes.",
    demoUrl: "https://debut-rose-glam-starter.vercel.app/",
    fauxDomain: "alyssa-turns-18.rsvp.webserbisyo.com",
    previewImage: "/images/templates/debut-rose-glam.webp",
    colorPalette: ["#E08594", "#F4C2C2", "#E5A93C", "#2B1A29"],
    featureTags: ["18 Roses & Candles", "Debutante Spotlight", "Attire & Motif", "RSVP Form", "Guestbook"],
    badge: "Trending Debut",
  },
  {
    id: "birthday-avengers",
    archetype: "birthday",
    category: "Birthdays",
    title: "Marcus' 10th Birthday",
    themeName: "Avengers Comic Action",
    subtitle: "Action-packed comic book styling, vibrant superhero pop art, and thrilling party missions.",
    description: "Perfect for action-themed birthdays. Features dynamic superhero countdown, hero attire guide, party games schedule, and dual kid/adult meal RSVP options.",
    demoUrl: "https://starter-birthday-avengers-10th.vercel.app/",
    fauxDomain: "marcus-10th-birthday.rsvp.webserbisyo.com",
    previewImage: "/images/templates/birthday-avengers.webp",
    colorPalette: ["#E23636", "#0B60B0", "#FDE047", "#1E1E24"],
    featureTags: ["Party Mission Schedule", "Hero Countdown", "Attire & Costumes", "Kids & Adults RSVP", "Venue Radar"],
    badge: "Fan Favorite",
  },
  {
    id: "baptism-celestial-sky",
    archetype: "baptism",
    category: "Baptisms",
    title: "Baby Liam's Christening",
    themeName: "Celestial Sky Blessing",
    subtitle: "Pure, serene celestial clouds, heavenly doves, and soft gold accents for baby's sacred milestone.",
    description: "Crafted for solemn baptisms and dedications. Includes dedicated Godparents (Ninong & Ninang) honors, church & banquet details, and a baby blessings registry.",
    demoUrl: "https://baptism-celestial-sky-starter.vercel.app/",
    fauxDomain: "liam-christening.rsvp.webserbisyo.com",
    previewImage: "/images/templates/baptism-celestial-sky.webp",
    colorPalette: ["#7EA1C4", "#B8D4E3", "#D1B280", "#F8FAFC"],
    featureTags: ["Ninong & Ninang Roster", "Church & Reception", "Baby Story", "RSVP Headcount", "Blessings Book"],
    badge: "Sacramental",
  },
] as const;

const FILTER_OPTIONS = [
  { id: "all", label: "All Templates" },
  { id: "wedding", label: "Weddings" },
  { id: "debut", label: "Debuts" },
  { id: "birthday", label: "Birthdays" },
  { id: "baptism", label: "Christenings" },
] as const;

export function LandingTemplates() {
  const [activeFilter, setActiveFilter] = useState<string>("all");

  const filteredTemplates =
    activeFilter === "all"
      ? TEMPLATES
      : TEMPLATES.filter((t) => t.archetype === activeFilter);

  return (
    <section
      id="templates"
      className="landing-theme-dark relative isolate w-full scroll-mt-28 overflow-hidden bg-[var(--landing-bg)] py-20 sm:py-28 lg:py-32"
    >
      {/* Background Ambient Glow */}
      <div className="pointer-events-none absolute left-1/2 top-10 -translate-x-1/2 size-[650px] rounded-full bg-[#ff5a1f]/10 blur-[140px]" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-[#ff8a5c] backdrop-blur-md">
            <Sparkles className="size-3.5" />
            <span>Interactive Starter Designs</span>
          </div>

          <h2 className="text-3xl font-extrabold tracking-tight sm:text-5xl text-white">
            Designed for Every Celebration
          </h2>

          <p className="text-sm sm:text-base text-stone-400 max-w-2xl mx-auto leading-relaxed">
            Explore our curated flagship templates. Every design is 100% mobile-responsive, includes real-time guest RSVP tracking, and is ready for your celebration.
          </p>

          {/* Filter Chips */}
          <div className="pt-4 flex flex-wrap items-center justify-center gap-2 sm:gap-3">
            {FILTER_OPTIONS.map((filter) => {
              const isSelected = activeFilter === filter.id;
              const count =
                filter.id === "all"
                  ? TEMPLATES.length
                  : TEMPLATES.filter((t) => t.archetype === filter.id).length;

              return (
                <button
                  key={filter.id}
                  type="button"
                  onClick={() => setActiveFilter(filter.id)}
                  className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs sm:text-sm font-semibold transition-all duration-200 cursor-pointer ${
                    isSelected
                      ? "border border-[#ff5a1f]/60 bg-[#ff5a1f]/15 text-white shadow-[0_0_20px_rgba(255,90,31,0.25)]"
                      : "border border-white/10 bg-white/[0.03] text-stone-400 hover:border-white/20 hover:bg-white/[0.06] hover:text-stone-200"
                  }`}
                >
                  <span>{filter.label}</span>
                  <span
                    className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                      isSelected
                        ? "bg-[#ff5a1f]/30 text-white"
                        : "bg-white/10 text-stone-400"
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Templates Grid */}
        <div className="mt-12 sm:mt-16 grid grid-cols-1 gap-10 md:grid-cols-2 lg:gap-12">
          {filteredTemplates.map((template) => (
            <TemplateCard key={template.id} template={template} />
          ))}
        </div>
      </div>
    </section>
  );
}

function TemplateCard({ template }: { template: TemplateItem }) {
  const [imageError, setImageError] = useState(false);

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-3xl border border-white/10 bg-stone-900/40 p-2 sm:p-3 backdrop-blur-xl transition-all duration-300 hover:border-[#ff5a1f]/50 hover:shadow-[0_20px_60px_-15px_rgba(255,90,31,0.2)]">
      {/* macOS Faux Browser Window Shell */}
      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-stone-950 shadow-2xl transition-all duration-300">
        {/* Titlebar Chrome */}
        <div className="flex h-10 items-center justify-between border-b border-white/[0.08] bg-stone-900/90 px-4">
          <div className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-full bg-[#ff5f56]/80" />
            <span className="size-2.5 rounded-full bg-[#ffbd2e]/80" />
            <span className="size-2.5 rounded-full bg-[#27c93f]/80" />
          </div>

          <div className="flex items-center gap-1.5 rounded-md border border-white/5 bg-stone-950/70 px-3 py-1 text-[11px] font-mono text-stone-400">
            <Lock className="size-3 text-stone-500" />
            <span className="max-w-[160px] truncate sm:max-w-[220px]">
              {template.fauxDomain}
            </span>
          </div>

          <a
            href={template.demoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-stone-400 transition-colors hover:text-white"
            title="Open demo in new tab"
            aria-label={`Open ${template.title} preview in new tab`}
          >
            <ExternalLink className="size-3.5" />
          </a>
        </div>

        {/* 16:10 Aspect Canvas */}
        <div className="relative aspect-[16/10] w-full overflow-hidden bg-stone-950">
          {!imageError ? (
            <Image
              src={template.previewImage}
              alt={`${template.title} - ${template.themeName} - RSVP Website`}
              fill
              loading="lazy"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 600px"
              className="size-full object-cover object-top transition-transform duration-500 group-hover:scale-[1.02]"
              onError={() => setImageError(true)}
            />
          ) : (
            <div
              className="relative flex size-full flex-col items-center justify-center p-6 text-center select-none"
              style={{
                background: `radial-gradient(ellipse at 50% 30%, ${template.colorPalette[0]}33 0%, rgba(12, 10, 9, 0.95) 75%)`,
              }}
            >
              <div
                className="size-16 rounded-2xl border border-white/20 shadow-xl flex items-center justify-center backdrop-blur-md mb-3"
                style={{ backgroundColor: `${template.colorPalette[0]}44` }}
              >
                <Sparkles className="size-7" style={{ color: template.colorPalette[2] }} />
              </div>
              <h4 className="text-lg font-bold text-white tracking-wide">{template.title}</h4>
              <p className="text-xs text-stone-300 font-medium mt-1">{template.themeName}</p>
              <div className="mt-3 flex items-center gap-1.5">
                {template.colorPalette.map((color, i) => (
                  <span
                    key={i}
                    className="size-2.5 rounded-full border border-white/30"
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Hover Scrim Trigger */}
          <div className="absolute inset-0 flex items-center justify-center bg-black/45 opacity-0 backdrop-blur-xs transition-opacity duration-300 group-hover:opacity-100">
            <a
              href={template.demoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-full border border-white/30 bg-stone-950/90 px-4 py-2 text-xs font-semibold text-white shadow-xl hover:border-white/60 hover:bg-stone-900"
            >
              <ExternalLink className="size-3.5 text-[#ff8a5c]" />
              Open Live Website Demo
            </a>
          </div>
        </div>
      </div>

      {/* Card Info & Dual Action Bar */}
      <div className="mt-4 flex flex-1 flex-col px-3 py-2 sm:px-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <span className="text-[11px] font-bold tracking-widest text-[#ff8a5c] uppercase">
              {template.category}
            </span>
            <h3 className="text-xl font-bold tracking-tight text-white sm:text-2xl">
              {template.title}
            </h3>
            <p className="text-xs font-medium text-stone-400">
              Theme: <span className="text-stone-300">{template.themeName}</span>
            </p>
          </div>

          {template.badge && (
            <span className="inline-flex items-center rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-[10px] font-bold tracking-wider text-amber-400 uppercase">
              {template.badge}
            </span>
          )}
        </div>

        <p className="mt-2.5 text-xs sm:text-sm leading-relaxed text-stone-400">
          {template.description}
        </p>

        {/* Motif Palette & Feature Tags */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-y border-white/[0.06] py-3">
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-medium text-stone-500">Motif:</span>
            <div className="flex items-center gap-1">
              {template.colorPalette.map((color, i) => (
                <span
                  key={i}
                  className="size-3.5 rounded-full border border-white/20 shadow-sm"
                  style={{ backgroundColor: color }}
                  title={color}
                />
              ))}
            </div>
          </div>

          <div className="flex flex-wrap gap-1">
            {template.featureTags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="rounded-md border border-white/5 bg-white/[0.03] px-2 py-0.5 text-[10px] text-stone-400"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* Action Row */}
        <div className="mt-5 flex items-center gap-3">
          <TrackedLink
            href={`/apply?archetype=${template.archetype}`}
            trackingEvent="StartApplicationClick"
            trackingParams={{
              archetype: template.archetype,
              content_category: "RSVP Website Application",
              destination: `/apply?archetype=${template.archetype}`,
              source: "templates_showcase",
              template_id: template.id,
              template_name: template.title,
            }}
            className="landing-cta-button flex-1 h-10 sm:h-11 text-xs sm:text-sm font-semibold gap-1.5 justify-center"
          >
            <span>Use this Template</span>
            <ArrowRight className="size-4" />
          </TrackedLink>

          <a
            href={template.demoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-10 sm:h-11 items-center justify-center gap-1.5 rounded-full border border-white/15 bg-white/[0.04] px-4 text-xs sm:text-sm font-semibold text-white/90 shadow-sm backdrop-blur-md transition-all duration-200 hover:border-white/30 hover:bg-white/[0.09] hover:text-white"
          >
            <span>Preview Live</span>
            <ExternalLink className="size-3.5 text-stone-400" />
          </a>
        </div>
      </div>
    </div>
  );
}

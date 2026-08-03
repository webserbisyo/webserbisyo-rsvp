import { PROMO_CONFIG } from "@/lib/promotion-config";

export const marketingHero = {
  artwork: "/images/rsvp.webp",
  brand: "WebSerbisyo RSVP",
  cta: "Create my wedding website",
  headline: "Beautiful RSVP websites for Filipino weddings",
  promotion: PROMO_CONFIG,
  proof: {
    rating: "★★★★★",
    summary: "100+ websites created",
    supportingText: "happy couples",
  },
  reassurance: ["No payment required upon application", "No monthly website subscription"],
  social: {
    alt: "WebSerbisyo RSVP wedding invitation and website preview",
    artwork: "/images/landing/rsvp-og-artwork.png",
    description:
      "Create a personalized wedding website with online RSVP, real-time guest tracking, event details, maps, gallery, and more. Website muna, bago bayad.",
    imagePath: "/marketing/opengraph-image",
    title: "WebSerbisyo RSVP — Beautiful Wedding Websites for Filipino Couples",
    valueLine: "Personalized wedding website · Online RSVP · Guest tracking",
    version: "2026-08-hero-v1",
  },
  trust: {
    description: "See your website preview first, then decide.",
    emoji: "😊",
    title: "Website muna, bago bayad",
  },
} as const;

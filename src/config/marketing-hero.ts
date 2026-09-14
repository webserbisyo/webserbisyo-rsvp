import { PROMO_CONFIG } from "@/lib/promotion-config";
import { SOCIAL_PREVIEWS } from "@/config/social-previews";

export const marketingHero = {
  brand: "WebSerbisyo RSVP",
  cta: "Start your free website preview",
  headline: "The Modern RSVP Website for Every Celebration",
  pricing: {
    regularPrice: "₱2,000",
    startingAt: "₱999",
  },
  promotion: PROMO_CONFIG,
  proof: {
    rating: "★★★★★",
    summary: "100+ websites created",
    supportingText: "happy celebrants",
  },
  reassurance: ["Website muna, bago bayad", "GCash & Maya Payment", "One time payment"],
  social: {
    ...SOCIAL_PREVIEWS.marketing,
    artwork: "/images/landing/rsvp-og-artwork.png",
  },
  trust: {
    description: "See your website preview first, then decide.",
    emoji: "😊",
    title: "Website muna, bago bayad",
  },
} as const;

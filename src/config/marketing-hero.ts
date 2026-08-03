import { PROMO_CONFIG } from "@/lib/promotion-config";
import { SOCIAL_PREVIEWS } from "@/config/social-previews";

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
    ...SOCIAL_PREVIEWS.marketing,
    artwork: "/images/landing/rsvp-og-artwork.png",
  },
  trust: {
    description: "See your website preview first, then decide.",
    emoji: "😊",
    title: "Website muna, bago bayad",
  },
} as const;

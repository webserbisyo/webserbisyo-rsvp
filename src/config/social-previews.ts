import { MAX_PRICING_PLAN, PRO_PRICING_PLAN } from "@/lib/pricing-plans";
import { PROMO_CONFIG } from "@/lib/promotion-config";

export const SOCIAL_PREVIEWS = {
  apply: {
    alt: "WebSerbisyo RSVP PRO and MAX wedding website plans",
    description:
      "Choose between PRO and MAX for your personalized wedding RSVP website. Get online RSVP, guest tracking, event details, maps, gallery, and more. Website muna, bago bayad.",
    headline: "Choose Your Plan",
    path: "/apply/opengraph-image",
    title: "Choose Your Plan | WebSerbisyo RSVP",
    trustLine: "Website muna, bago bayad.",
    valueLine: "Launch Your RSVP Website Faster",
    version: "2026-08-apply-v1",
  },
  eventFallback: {
    alt: "WebSerbisyo RSVP wedding website and online RSVP invitation",
    description: "Event details, venue information, gallery, and RSVP in one link.",
    headline: "Wedding Website & Online RSVP",
    path: "/event/opengraph-image",
    title: "WebSerbisyo RSVP Wedding Website",
    valueLine: "Event details, venue information, gallery, and RSVP in one link.",
    version: "2026-08-event-v1",
  },
  marketing: {
    alt: "WebSerbisyo RSVP wedding invitation and website preview",
    description:
      "Create a personalized wedding website with online RSVP, real-time guest tracking, event details, maps, gallery, and more. Website muna, bago bayad.",
    path: "/marketing/opengraph-image",
    title: "WebSerbisyo RSVP — Beautiful Wedding Websites for Filipino Couples",
    valueLine: "Personalized wedding website · Online RSVP · Guest tracking",
    version: "2026-08-hero-v1",
  },
  neutral: {
    description: "WebSerbisyo RSVP helps couples manage wedding websites and guest responses.",
    title: "WebSerbisyo RSVP",
  },
} as const;

export const APPLY_SOCIAL_PRICING = {
  max: MAX_PRICING_PLAN,
  promotion: PROMO_CONFIG,
  pro: PRO_PRICING_PLAN,
} as const;

export function getVersionedSocialImage(
  preview: (typeof SOCIAL_PREVIEWS)["apply" | "eventFallback" | "marketing"],
) {
  return `${preview.path}?v=${preview.version}`;
}

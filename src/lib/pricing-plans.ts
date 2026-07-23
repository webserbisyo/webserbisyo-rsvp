export type PricingFeatureEmphasis = "exclusive" | "featured" | "standard";

export type PricingFeature = {
  badge?: "Bonus" | "Included";
  emphasis: PricingFeatureEmphasis;
  label: string;
};

export type PricingPlan = {
  description: string;
  features: readonly PricingFeature[];
  name: "MAX" | "PRO";
  price: number;
  priceLabel: string;
  regularPriceLabel: string;
};

export const PRO_PRICING_PLAN = {
  description: "Everything you need for a beautiful RSVP website.",
  features: [
    { label: "Premium mobile-friendly RSVP website", emphasis: "standard" },
    { label: "Event details and schedule sections", emphasis: "standard" },
    { label: "RSVP form and guest tracking", emphasis: "standard" },
    { label: "Gallery and story sections", emphasis: "standard" },
    { label: "Unlimited RSVP responses", emphasis: "standard" },
    { label: "Guest response export", emphasis: "standard" },
    { label: "Hosting included", emphasis: "standard" },
    { label: "Website access controls", emphasis: "standard" },
    { label: "1-year support and maintenance", emphasis: "standard" },
  ],
  name: "PRO",
  price: 1599,
  priceLabel: "₱1,599",
  regularPriceLabel: "₱3,200",
} as const satisfies PricingPlan;

export const MAX_PRICING_PLAN = {
  description: "For couples who want a more premium and memorable guest experience.",
  features: [
    { label: "Everything in PRO", emphasis: "standard" },
    { label: "Advanced custom animations", emphasis: "exclusive" },
    { label: "Premium motion and interaction polish", emphasis: "exclusive" },
    { label: "Enhanced visual personalization", emphasis: "exclusive" },
    { label: "More immersive section transitions", emphasis: "exclusive" },
    {
      label: "Monogram Animation included",
      emphasis: "featured",
      badge: "Included",
    },
    { label: "Couple Alignment Kit included", emphasis: "exclusive" },
    {
      label:
        "E-book resources for conversations, budgeting, newlywed planning, date night ideas, and more — ₱10,000 bonus value",
      emphasis: "featured",
      badge: "Bonus",
    },
    { label: "Priority creative refinement", emphasis: "exclusive" },
    { label: "Priority setup", emphasis: "exclusive" },
  ],
  name: "MAX",
  price: 3599,
  priceLabel: "₱3,599",
  regularPriceLabel: "₱7,200",
} as const satisfies PricingPlan;

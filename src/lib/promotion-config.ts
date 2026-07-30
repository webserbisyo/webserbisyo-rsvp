export type PromotionConfig = {
  discountLabel: string;
  heroBadgeText: string;
  isActive: boolean;
  offerLabel: string;
  pricingBadgeText: string;
};

export const PROMO_CONFIG: PromotionConfig = {
  discountLabel: "50% OFF",
  heroBadgeText: "50% OFF · Launch Offer",
  isActive: true,
  offerLabel: "Launch Offer",
  pricingBadgeText: "50% OFF · Launch Offer",
};

export const FUNNEL_PLAN_VALUES = ["pro", "max"] as const;
export const APPLICATION_STATUS_VALUES = [
  "submitted",
  "reviewing",
  "approved",
  "rejected",
  "cancelled",
] as const;
export const ACTIVE_APPLICATION_STATUS_VALUES = ["submitted", "reviewing"] as const;
export const PAYMENT_STATUS_VALUES = [
  "pending",
  "paid",
  "failed",
  "refunded",
  "cancelled",
] as const;
export const PAYMENT_FAILURE_TRANSITION_VALUES = ["failed", "cancelled", "refunded"] as const;
export const CLIENT_STATUS_VALUES = [
  "active",
  "paused",
  "expired",
  "archived",
  "cancelled",
] as const;
export const FUNNEL_CURRENCY_VALUES = ["PHP"] as const;

export type FunnelPlan = (typeof FUNNEL_PLAN_VALUES)[number];
export type ApplicationStatus = (typeof APPLICATION_STATUS_VALUES)[number];
export type ActiveApplicationStatus = (typeof ACTIVE_APPLICATION_STATUS_VALUES)[number];
export type PaymentStatus = (typeof PAYMENT_STATUS_VALUES)[number];
export type ClientStatus = (typeof CLIENT_STATUS_VALUES)[number];
export type FunnelCurrency = (typeof FUNNEL_CURRENCY_VALUES)[number];

import { z } from "zod";
import {
  EVENT_TYPE_VALUES,
  getAvailableApplicationEventTypes,
} from "@/config/event-type-availability";

const PLAN_TYPE_VALUES = ["pro", "max"] as const;
const MANUAL_PAYMENT_OPTION_VALUES = ["gcash", "maya"] as const;

type EventType = (typeof EVENT_TYPE_VALUES)[number];
type PlanType = (typeof PLAN_TYPE_VALUES)[number];
type ManualPaymentOption = (typeof MANUAL_PAYMENT_OPTION_VALUES)[number];

function isAllowedNameCharacter(value: string) {
  return /^[A-Za-zÀ-ÖØ-öø-ÿÑñ .'-]+$/u.test(value);
}

function hasLetter(value: string) {
  return /[A-Za-zÀ-ÖØ-öø-ÿÑñ]/u.test(value);
}

function isValidCalendarDate(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);

  if (!match) {
    return false;
  }

  const [, yearText, monthText, dayText] = match;
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  const candidate = new Date(Date.UTC(year, month - 1, day));

  return (
    candidate.getUTCFullYear() === year &&
    candidate.getUTCMonth() === month - 1 &&
    candidate.getUTCDate() === day
  );
}

function optionalText(max: number, tooLongMessage: string) {
  return z
    .string()
    .trim()
    .transform((value) => (value ? value : undefined))
    .refine((value) => value === undefined || value.length <= max, tooLongMessage);
}

function buildSelectionSchema<TValue extends string>(
  values: readonly TValue[],
  missingMessage: string,
  invalidMessage: string = missingMessage,
) {
  return z
    .string()
    .trim()
    .min(1, missingMessage)
    .refine((value): value is TValue => values.includes(value as TValue), invalidMessage)
    .transform((value) => value as TValue);
}

const FullNameSchema = z
  .string()
  .trim()
  .min(1, "Full name is required.")
  .min(2, "Full name must be at least 2 characters.")
  .max(120, "Enter a valid full name.")
  .refine((value) => isAllowedNameCharacter(value) && hasLetter(value), "Enter a valid full name.");

const EmailSchema = z
  .string()
  .trim()
  .min(1, "Enter a valid email address.")
  .max(320, "Enter a valid email address.")
  .email("Enter a valid email address.")
  .transform((value) => value.toLowerCase());

const PhoneSchema = z
  .string()
  .trim()
  .min(1, "Phone number is required.")
  .transform((value) => value.replace(/[\s-]+/g, ""))
  .refine(
    (value) => /^(09\d{9}|\+639\d{9})$/.test(value),
    "Enter a valid Philippine mobile number, like 09171234567 or +639171234567.",
  );

export const EventTypeSchema = buildSelectionSchema(
  EVENT_TYPE_VALUES,
  "Select an event type.",
  "Select an event type.",
);

export const PlanTypeSchema = buildSelectionSchema(
  PLAN_TYPE_VALUES,
  "Select a plan.",
  "Select a plan.",
);

export const ManualPaymentOptionSchema = buildSelectionSchema(
  MANUAL_PAYMENT_OPTION_VALUES,
  "Select a manual payment option.",
  "Select a manual payment option.",
);

const ApplicationEnabledEventTypeSchema = buildSelectionSchema(
  getAvailableApplicationEventTypes(),
  "Select an event type.",
  "This event type is coming soon. Wedding applications are available right now.",
);

const OptionalDateSchema = z
  .string()
  .trim()
  .transform((value) => (value ? value : undefined))
  .refine(
    (value) => value === undefined || isValidCalendarDate(value),
    "Enter a valid event date.",
  );

const EstimatedGuestCountSchema = z
  .union([z.string(), z.number(), z.undefined()])
  .transform((value, ctx) => {
    if (value === undefined) {
      return undefined;
    }

    const rawValue = typeof value === "number" ? String(value) : value.trim();

    if (!rawValue) {
      return undefined;
    }

    if (!/^\d+$/.test(rawValue)) {
      ctx.addIssue({
        code: "custom",
        message: "Guest count must be a number.",
      });
      return z.NEVER;
    }

    const parsed = Number(rawValue);

    if (parsed < 1) {
      ctx.addIssue({
        code: "custom",
        message: "Guest count must be at least 1.",
      });
      return z.NEVER;
    }

    if (parsed > 1000) {
      ctx.addIssue({
        code: "custom",
        message: "Guest count must be 1000 or less.",
      });
      return z.NEVER;
    }

    return parsed;
  });

const FirstNameSchema = z
  .string()
  .trim()
  .min(1, "First name is required.")
  .min(2, "First name must be at least 2 characters.")
  .max(120, "Enter a valid first name.")
  .refine((value) => isAllowedNameCharacter(value) && hasLetter(value), "Enter a valid first name.");

const LastNameSchema = z
  .string()
  .trim()
  .min(1, "Last name is required.")
  .min(2, "Last name must be at least 2 characters.")
  .max(120, "Enter a valid last name.")
  .refine((value) => isAllowedNameCharacter(value) && hasLetter(value), "Enter a valid last name.");

export function createApplicationSchema(options?: { requireManualPaymentOption?: boolean }) {
  const requireManualPaymentOption = options?.requireManualPaymentOption ?? false;

  return z.object({
    email: EmailSchema,
    estimatedGuestCount: EstimatedGuestCountSchema,
    eventDate: OptionalDateSchema,
    eventLocation: optionalText(180, "Event location is too long."),
    eventType: ApplicationEnabledEventTypeSchema,
    fbFbc: z.string().max(500).optional(),
    fbFbp: z.string().max(500).optional(),
    firstName: FirstNameSchema,
    fullName: FullNameSchema,
    lastName: LastNameSchema,
    message: optionalText(1000, "Message is too long."),
    phone: PhoneSchema,
    preferredManualPaymentOption: requireManualPaymentOption
      ? ManualPaymentOptionSchema
      : ManualPaymentOptionSchema.optional().or(z.literal("").transform(() => undefined)),
    preferredPlan: PlanTypeSchema,
  });
}

export const ApplicationSchema = createApplicationSchema();

export type ApplicationInput = z.output<typeof ApplicationSchema>;
export type ApplicationFormInput = z.input<typeof ApplicationSchema>;

export const EVENT_TYPE_OPTIONS = EVENT_TYPE_VALUES satisfies readonly EventType[];
export const PLAN_TYPE_OPTIONS = PLAN_TYPE_VALUES satisfies readonly PlanType[];
export const MANUAL_PAYMENT_OPTIONS =
  MANUAL_PAYMENT_OPTION_VALUES satisfies readonly ManualPaymentOption[];

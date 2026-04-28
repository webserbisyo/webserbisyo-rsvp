import { z } from "zod";

export const EventTypeSchema = z.enum([
  "wedding",
  "debut",
  "birthday",
  "baptism",
  "reunion",
  "anniversary",
  "corporate",
  "other",
]);

export const PlanTypeSchema = z.enum(["pro", "max"]);
export const ManualPaymentOptionSchema = z.enum(["gcash", "maya"]);

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((value) => (value ? value : undefined));

const optionalDate = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD format.")
  .optional()
  .or(z.literal("").transform(() => undefined));

export const ApplicationSchema = z.object({
  email: z.string().trim().email().max(320).toLowerCase(),
  estimatedGuestCount: z.coerce.number().int().positive().max(10000).optional(),
  eventDate: optionalDate,
  eventLocation: optionalText(500),
  eventType: EventTypeSchema,
  fullName: z.string().trim().min(2).max(200),
  message: optionalText(2000),
  phone: optionalText(50),
  preferredManualPaymentOption: ManualPaymentOptionSchema.optional().or(
    z.literal("").transform(() => undefined),
  ),
  preferredPlan: PlanTypeSchema,
});

export type ApplicationInput = z.output<typeof ApplicationSchema>;
export type ApplicationFormInput = z.input<typeof ApplicationSchema>;

export const EVENT_TYPE_OPTIONS = EventTypeSchema.options;
export const PLAN_TYPE_OPTIONS = PlanTypeSchema.options;
export const MANUAL_PAYMENT_OPTIONS = ManualPaymentOptionSchema.options;

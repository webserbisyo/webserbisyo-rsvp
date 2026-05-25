import { z } from "zod";

export const RSVP_RESPONSE_STATUS_VALUES = ["attending", "not_attending"] as const;

export const EventSlugSchema = z
  .string()
  .trim()
  .min(1, "Event link is required.")
  .max(200, "Event link is invalid.")
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Event link is invalid.");

const GuestNameSchema = z
  .string()
  .trim()
  .min(1, "Guest name is required.")
  .max(120, "Guest name is too long.");

function normalizeOptionalInput(value: unknown) {
  return typeof value === "string" ? value : "";
}

const RequiredEmailSchema = z
  .preprocess(
    normalizeOptionalInput,
    z
      .string()
      .trim()
      .min(1, "Email address is required.")
      .transform((value) => value.toLowerCase())
      .refine((value) => z.email().safeParse(value).success, {
        message: "Enter a valid email address.",
      }),
  );

const OptionalPhoneSchema = z
  .preprocess(
    normalizeOptionalInput,
    z
      .string()
      .trim()
      .transform((value) => (value ? value.replace(/[\s-]+/g, "") : undefined))
      .refine((value) => value === undefined || value.length <= 40, {
        message: "Phone number is too long.",
      }),
  );

const OptionalTextSchema = (max: number, message: string) =>
  z
    .preprocess(
      normalizeOptionalInput,
      z
        .string()
        .trim()
        .transform((value) => (value ? value : undefined))
        .refine((value) => value === undefined || value.length <= max, message),
    );

const CompanionCountSchema = z
  .union([z.string(), z.number(), z.undefined()])
  .transform((value, ctx) => {
    if (value === undefined || value === "") {
      return 0;
    }

    const rawValue = typeof value === "number" ? String(value) : value.trim();

    if (!/^\d+$/.test(rawValue)) {
      ctx.addIssue({
        code: "custom",
        message: "Companion count must be a number.",
      });
      return z.NEVER;
    }

    const parsed = Number(rawValue);

    if (parsed < 0) {
      ctx.addIssue({
        code: "custom",
        message: "Companion count cannot be negative.",
      });
      return z.NEVER;
    }

    if (parsed > 20) {
      ctx.addIssue({
        code: "custom",
        message: "Companion count is too high.",
      });
      return z.NEVER;
    }

    return parsed;
  });

const CompanionSchema = z.object({
  ageLabel: OptionalTextSchema(40, "Companion age label is too long."),
  fullName: z.string().trim().max(120, "Companion name is too long."),
});

export const PublicRsvpResponseFieldsSchema = z.object({
  attendanceStatus: z.enum(RSVP_RESPONSE_STATUS_VALUES, {
    error: "Select whether you are attending.",
  }),
  companionCount: CompanionCountSchema,
  companions: z.array(CompanionSchema).max(20, "Too many companions.").optional(),
  dietaryNotes: OptionalTextSchema(1000, "Dietary notes are too long."),
  email: RequiredEmailSchema,
  guestName: GuestNameSchema,
  message: OptionalTextSchema(1200, "Message is too long."),
  phone: OptionalPhoneSchema,
});

export const PublicRsvpResponseSchema = PublicRsvpResponseFieldsSchema.extend({
  eventSlug: EventSlugSchema,
});

export type PublicRsvpResponseInput = z.output<typeof PublicRsvpResponseSchema>;
export type PublicRsvpResponseFormInput = z.input<typeof PublicRsvpResponseSchema>;
export type PublicRsvpResponseFieldsInput = z.output<typeof PublicRsvpResponseFieldsSchema>;
export type PublicRsvpResponseFieldsFormInput = z.input<typeof PublicRsvpResponseFieldsSchema>;

export type PublicRsvpSubmitSuccess = {
  responseId: string;
  submittedAt: string;
};

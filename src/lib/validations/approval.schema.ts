import { z } from "zod";
import { PlanTypeSchema } from "./application.schema";

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((value) => (value ? value : undefined));

const dateString = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD format.");

const timestampString = z.string().trim().datetime({ offset: true });

export const ReviewApplicationSchema = z.object({
  applicationId: z.uuid(),
  reviewNotes: optionalText(2000),
  status: z.enum(["reviewing", "rejected"]),
});

export const ApprovalSchema = z.object({
  amountDue: z.coerce.number().nonnegative(),
  amountPaid: z.coerce.number().positive(),
  applicationId: z.uuid(),
  contactName: optionalText(200),
  contactPhone: optionalText(50),
  eventSlug: z
    .string()
    .trim()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers, and hyphens."),
  hostingEndsAt: dateString,
  hostingStartsAt: dateString,
  paidAt: timestampString.optional(),
  paymentMethod: optionalText(100),
  planType: PlanTypeSchema,
  referenceNumber: optionalText(200),
  renewalRequiredAt: dateString.optional(),
  reviewNotes: optionalText(2000),
});

export type ApprovalInput = z.infer<typeof ApprovalSchema>;
export type ReviewApplicationInput = z.infer<typeof ReviewApplicationSchema>;

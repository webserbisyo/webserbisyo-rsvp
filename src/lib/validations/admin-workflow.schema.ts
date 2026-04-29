import { z } from "zod";
import { PlanTypeSchema } from "./application.schema";

const MANUAL_PAYMENT_METHOD_VALUES = ["gcash", "maya", "manual"] as const;

function optionalText(max: number) {
  return z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((value) => (value ? value : undefined));
}

function requiredText(max: number, message: string) {
  return z.string().trim().min(1, message).max(max, message);
}

const IsoDateTimeSchema = z.string().trim().datetime({ offset: true });
const PositiveMoneySchema = z.coerce.number().positive("Enter a valid amount.");

export const MarkApplicationReviewingSchema = z.object({
  applicationId: z.uuid(),
  note: optionalText(2000),
});

export const RejectApplicationSchema = z.object({
  applicationId: z.uuid(),
  note: requiredText(2000, "A rejection note is required."),
});

export const CancelApplicationSchema = z.object({
  applicationId: z.uuid(),
  note: requiredText(2000, "A cancellation note is required."),
});

export const ApproveApplicationForPaymentSchema = z.object({
  applicationId: z.uuid(),
  note: optionalText(2000),
});

export const ApproveApplicationSchema = z.object({
  applicationId: z.uuid(),
});

export const RejectAndDeleteApplicationSchema = z.object({
  applicationId: z.uuid(),
  confirmation: z
    .string()
    .trim()
    .refine((value) => value === "DELETE", "Type DELETE to confirm."),
});

export const BulkApproveApplicationsSchema = z.object({
  applicationIds: z.array(z.uuid()).min(1, "Select at least one application."),
});

export const BulkRejectAndDeleteApplicationsSchema = z.object({
  applicationIds: z.array(z.uuid()).min(1, "Select at least one application."),
  confirmation: z
    .string()
    .trim()
    .refine((value) => value === "DELETE", "Type DELETE to confirm."),
});

export const ConfirmManualPaymentSchema = z
  .object({
    amountPaid: PositiveMoneySchema.optional(),
    customAmountReason: optionalText(500),
    note: optionalText(2000),
    paidAt: IsoDateTimeSchema.optional(),
    paymentId: z.uuid(),
    paymentMethod: z.enum(MANUAL_PAYMENT_METHOD_VALUES).optional(),
    referenceNumber: requiredText(200, "A reference number is required."),
  })
  .superRefine((value, ctx) => {
    if (value.amountPaid !== undefined && !value.customAmountReason) {
      ctx.addIssue({
        code: "custom",
        message: "A reason is required when overriding the default amount.",
        path: ["customAmountReason"],
      });
    }
  });

export const TransitionPaymentStatusSchema = z.object({
  note: requiredText(2000, "A note is required."),
  paymentId: z.uuid(),
  status: z.enum(["failed", "cancelled", "refunded"]),
});

export const ArchiveClientSchema = z.object({
  clientId: z.uuid(),
  note: requiredText(2000, "An archive note is required."),
});

export const RestoreClientSchema = z.object({
  clientId: z.uuid(),
  note: optionalText(2000),
});

export const ResendOnboardingSchema = z.object({
  clientId: z.uuid(),
});

const PackagePlanSettingsSchema = z.object({
  defaultAmount: PositiveMoneySchema,
  defaultHostingDays: z.coerce.number().int().positive("Enter a valid hosting duration."),
  isActive: z.boolean().default(true),
  renewalNoticeDays: z.coerce.number().int().nonnegative("Enter a valid renewal notice."),
});

export const SavePackageSettingsSchema = z.object({
  max: PackagePlanSettingsSchema,
  pro: PackagePlanSettingsSchema,
});

export const PackagePlanSchema = PlanTypeSchema;

export type ApproveApplicationForPaymentInput = z.infer<typeof ApproveApplicationForPaymentSchema>;
export type ApproveApplicationInput = z.infer<typeof ApproveApplicationSchema>;
export type ArchiveClientInput = z.infer<typeof ArchiveClientSchema>;
export type BulkApproveApplicationsInput = z.infer<typeof BulkApproveApplicationsSchema>;
export type BulkRejectAndDeleteApplicationsInput = z.infer<
  typeof BulkRejectAndDeleteApplicationsSchema
>;
export type CancelApplicationInput = z.infer<typeof CancelApplicationSchema>;
export type ConfirmManualPaymentInput = z.infer<typeof ConfirmManualPaymentSchema>;
export type MarkApplicationReviewingInput = z.infer<typeof MarkApplicationReviewingSchema>;
export type RejectAndDeleteApplicationInput = z.infer<typeof RejectAndDeleteApplicationSchema>;
export type RejectApplicationInput = z.infer<typeof RejectApplicationSchema>;
export type ResendOnboardingInput = z.infer<typeof ResendOnboardingSchema>;
export type RestoreClientInput = z.infer<typeof RestoreClientSchema>;
export type SavePackageSettingsInput = z.infer<typeof SavePackageSettingsSchema>;
export type TransitionPaymentStatusInput = z.infer<typeof TransitionPaymentStatusSchema>;

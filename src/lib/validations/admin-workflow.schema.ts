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

export const MarkClientPaidSchema = z.object({
  amountDue: PositiveMoneySchema.optional(),
  amountPaid: PositiveMoneySchema,
  clientId: z.uuid(),
  note: optionalText(2000),
  paidAt: IsoDateTimeSchema.optional(),
  paymentMethod: z.enum(MANUAL_PAYMENT_METHOD_VALUES).optional(),
  referenceNumber: optionalText(200),
});

export const CancelClientSchema = z.object({
  clientId: z.uuid(),
  confirmation: z
    .string()
    .trim()
    .refine((value) => value === "CANCEL", "Type CANCEL to confirm."),
  note: optionalText(2000),
});

export const BulkMarkClientsPaidSchema = z.object({
  clientIds: z.array(z.uuid()).min(1, "Select at least one client."),
  note: optionalText(2000),
  paidAt: IsoDateTimeSchema.optional(),
  paymentMethod: z.enum(MANUAL_PAYMENT_METHOD_VALUES).optional(),
  referencePrefix: optionalText(120),
});

export const DeleteClientSchema = z.object({
  clientId: z.uuid(),
  confirmation: z
    .string()
    .trim()
    .refine((value) => value === "DELETE", "Type DELETE to confirm."),
  note: optionalText(2000),
});

export const BulkDeleteClientsSchema = z.object({
  clientIds: z.array(z.uuid()).min(1, "Select at least one client."),
  confirmation: z
    .string()
    .trim()
    .refine((value) => value === "DELETE", "Type DELETE to confirm."),
  note: optionalText(2000),
});

export const RefundClientPaymentSchema = z.object({
  clientId: z.uuid(),
  confirmedAt: IsoDateTimeSchema.optional(),
  note: requiredText(2000, "A refund note is required."),
  paymentMethod: z.enum(MANUAL_PAYMENT_METHOD_VALUES).optional(),
  referenceNumber: optionalText(200),
});

export const BulkRefundClientsSchema = z.object({
  clientIds: z.array(z.uuid()).min(1, "Select at least one client."),
  confirmation: z
    .string()
    .trim()
    .refine((value) => value === "REFUND", "Type REFUND to confirm."),
  confirmedAt: IsoDateTimeSchema.optional(),
  note: optionalText(2000),
  paymentMethod: z.enum(MANUAL_PAYMENT_METHOD_VALUES).optional(),
  referencePrefix: optionalText(120),
});

export const BulkCancelClientsSchema = z.object({
  clientIds: z.array(z.uuid()).min(1, "Select at least one client."),
  confirmation: z
    .string()
    .trim()
    .refine((value) => value === "CANCEL", "Type CANCEL to confirm."),
  note: optionalText(2000),
});

export const BulkArchiveClientsSchema = z.object({
  clientIds: z.array(z.uuid()).min(1, "Select at least one client."),
  note: requiredText(2000, "An archive note is required."),
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
  note: optionalText(2000),
  recipientEmail: z.email().optional(),
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
export type BulkArchiveClientsInput = z.infer<typeof BulkArchiveClientsSchema>;
export type BulkCancelClientsInput = z.infer<typeof BulkCancelClientsSchema>;
export type BulkDeleteClientsInput = z.infer<typeof BulkDeleteClientsSchema>;
export type BulkMarkClientsPaidInput = z.infer<typeof BulkMarkClientsPaidSchema>;
export type BulkRefundClientsInput = z.infer<typeof BulkRefundClientsSchema>;
export type BulkRejectAndDeleteApplicationsInput = z.infer<
  typeof BulkRejectAndDeleteApplicationsSchema
>;
export type CancelApplicationInput = z.infer<typeof CancelApplicationSchema>;
export type CancelClientInput = z.infer<typeof CancelClientSchema>;
export type ConfirmManualPaymentInput = z.infer<typeof ConfirmManualPaymentSchema>;
export type DeleteClientInput = z.infer<typeof DeleteClientSchema>;
export type MarkClientPaidInput = z.infer<typeof MarkClientPaidSchema>;
export type MarkApplicationReviewingInput = z.infer<typeof MarkApplicationReviewingSchema>;
export type RejectAndDeleteApplicationInput = z.infer<typeof RejectAndDeleteApplicationSchema>;
export type RejectApplicationInput = z.infer<typeof RejectApplicationSchema>;
export type RefundClientPaymentInput = z.infer<typeof RefundClientPaymentSchema>;
export type ResendOnboardingInput = z.infer<typeof ResendOnboardingSchema>;
export type RestoreClientInput = z.infer<typeof RestoreClientSchema>;
export type SavePackageSettingsInput = z.infer<typeof SavePackageSettingsSchema>;
export type TransitionPaymentStatusInput = z.infer<typeof TransitionPaymentStatusSchema>;

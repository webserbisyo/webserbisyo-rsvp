import { z } from "zod";

export const PaymentProviderSchema = z.enum(["gcash", "maya"]);

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((value) => (value ? value : undefined));

const optionalUrl = z
  .string()
  .trim()
  .url("Enter a valid Messenger page URL.")
  .max(500)
  .optional()
  .or(z.literal("").transform(() => undefined));

const optionalQrFile = z
  .custom<File | undefined>((value) => value === undefined || value instanceof File, {
    message: "Upload a valid image file.",
  })
  .transform((value) => {
    if (!(value instanceof File) || value.size === 0) {
      return undefined;
    }

    return value;
  });

const PaymentProviderSettingsSchema = z
  .object({
    accountName: optionalText(160),
    accountNumber: optionalText(80),
    isEnabled: z.boolean().default(false),
    qrFile: optionalQrFile.optional(),
    qrImagePath: optionalText(500),
  })
  .superRefine((value, ctx) => {
    if (!value.isEnabled) {
      return;
    }

    if (!value.accountName) {
      ctx.addIssue({
        code: "custom",
        message: "Account name is required before enabling this payment option.",
        path: ["accountName"],
      });
    }

    if (!value.accountNumber) {
      ctx.addIssue({
        code: "custom",
        message: "Account number is required before enabling this payment option.",
        path: ["accountNumber"],
      });
    }
  });

export const PaymentOptionsSchema = z.object({
  gcash: PaymentProviderSettingsSchema,
  maya: PaymentProviderSettingsSchema,
  messengerPageUrl: optionalUrl,
});

export type PaymentOptionsInput = z.output<typeof PaymentOptionsSchema>;
export type PaymentOptionsFormInput = z.input<typeof PaymentOptionsSchema>;

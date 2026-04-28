"use client";

import {
  Controller,
  type Control,
  type FieldErrors,
  type UseFormRegister,
  type UseFormSetValue,
  useWatch,
} from "react-hook-form";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import type { PaymentOptionsFormInput } from "@/lib/validations/payment-options.schema";
import { QrUploadField } from "./qr-upload-field";

type ProviderKey = "gcash" | "maya";

type PaymentOptionSectionProps = {
  control: Control<PaymentOptionsFormInput>;
  errors: FieldErrors<PaymentOptionsFormInput>;
  existingImageUrl: string | null;
  provider: ProviderKey;
  register: UseFormRegister<PaymentOptionsFormInput>;
  setValue: UseFormSetValue<PaymentOptionsFormInput>;
  title: string;
};

export function PaymentOptionSection({
  control,
  errors,
  existingImageUrl,
  provider,
  register,
  setValue,
  title,
}: PaymentOptionSectionProps) {
  const fieldErrors = errors[provider];
  const isEnabled = useWatch({
    control,
    name: `${provider}.isEnabled`,
  });
  const currentQrImagePath = useWatch({
    control,
    name: `${provider}.qrImagePath`,
  });

  return (
    <Card className="rsvp-panel border-border/70 rounded-3xl">
      <CardHeader className="space-y-3">
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-1">
            <CardTitle className="text-xl">{title}</CardTitle>
            <p className="text-muted-foreground text-sm leading-6">
              Manage whether {title} is visible on the public application form.
            </p>
          </div>
          <Badge
            className={
              isEnabled
                ? "bg-rsvp-brand text-rsvp-brand-foreground hover:bg-rsvp-brand"
                : "bg-muted text-muted-foreground hover:bg-muted"
            }
          >
            {isEnabled ? "Enabled" : "Disabled"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="border-border/70 bg-background flex items-center justify-between gap-4 rounded-2xl border px-4 py-3">
          <div className="space-y-1">
            <Label htmlFor={`${provider}-enabled`} className="text-sm font-medium">
              Show {title} publicly
            </Label>
            <p className="text-muted-foreground text-sm">
              Disable this until the account details are ready for applicants to see.
            </p>
          </div>
          <Controller
            control={control}
            name={`${provider}.isEnabled`}
            render={({ field }) => (
              <Switch
                id={`${provider}-enabled`}
                checked={field.value}
                onCheckedChange={field.onChange}
              />
            )}
          />
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor={`${provider}-account-name`}>Account name</Label>
            <Input id={`${provider}-account-name`} {...register(`${provider}.accountName`)} />
            {fieldErrors?.accountName?.message ? (
              <p className="text-destructive text-sm">{fieldErrors.accountName.message}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor={`${provider}-account-number`}>Account number</Label>
            <Input id={`${provider}-account-number`} {...register(`${provider}.accountNumber`)} />
            {fieldErrors?.accountNumber?.message ? (
              <p className="text-destructive text-sm">{fieldErrors.accountNumber.message}</p>
            ) : null}
          </div>
        </div>

        <QrUploadField
          id={`${provider}-qr`}
          label={`${title} QR image`}
          existingImageUrl={existingImageUrl}
          error={fieldErrors?.qrFile?.message}
          onFileChange={(file) => {
            setValue(`${provider}.qrFile`, file, { shouldDirty: true, shouldValidate: true });
            setValue(`${provider}.qrImagePath`, currentQrImagePath, { shouldDirty: true });
          }}
        />
      </CardContent>
    </Card>
  );
}

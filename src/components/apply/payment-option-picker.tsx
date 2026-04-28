"use client";

import type { FieldError } from "react-hook-form";
import { toast } from "sonner";
import type { PublicPaymentOption } from "@/lib/apply/public-payment-option-dto";
import { getPaymentOptionLabel } from "@/lib/apply/public-payment-option-dto";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { PaymentOptionCard } from "./payment-option-card";

type PaymentOptionPickerProps = {
  error?: FieldError;
  onValueChange: (value: "gcash" | "maya") => void;
  options: PublicPaymentOption[];
  value?: string;
};

export function PaymentOptionPicker({
  error,
  onValueChange,
  options,
  value,
}: PaymentOptionPickerProps) {
  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <Label className="text-sm font-medium">Manual payment option</Label>
        <p className="text-muted-foreground text-sm leading-6">
          Choose the manual payment method you prefer so the team can prepare the right details.
        </p>
      </div>

      <RadioGroup
        value={value}
        onValueChange={(nextValue) => onValueChange(nextValue as "gcash" | "maya")}
        className="grid gap-4 lg:grid-cols-2"
      >
        {options.map((option) => (
          <div key={option.provider} className="space-y-3">
            <Label
              htmlFor={`payment-${option.provider}`}
              className="border-border/70 flex items-center gap-3 rounded-3xl border p-3"
            >
              <RadioGroupItem id={`payment-${option.provider}`} value={option.provider} />
              <div className="space-y-0.5">
                <span className="block text-sm font-medium">{option.label}</span>
                <span className="text-muted-foreground block text-xs">
                  {option.accountNumber
                    ? "Ready for manual coordination"
                    : "Account number to follow"}
                </span>
              </div>
            </Label>
            <PaymentOptionCard
              option={option}
              isSelected={value === option.provider}
              onCopyNumber={
                option.accountNumber
                  ? async () => {
                      try {
                        await navigator.clipboard.writeText(option.accountNumber ?? "");
                        toast.success(`${getPaymentOptionLabel(option.provider)} number copied.`);
                      } catch {
                        toast.error("Could not copy the account number.");
                      }
                    }
                  : undefined
              }
            />
          </div>
        ))}
      </RadioGroup>

      {error?.message ? <p className="text-destructive text-sm">{error.message}</p> : null}
    </div>
  );
}

"use client";

import type { FieldError } from "react-hook-form";
import { toast } from "sonner";
import type { PublicPaymentOption } from "@/lib/apply/public-payment-option-dto";
import { getPaymentOptionLabel } from "@/lib/apply/public-payment-option-dto";
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
    <div className="pop-wrap">
      <div className="pop-grid">
        {options.map((option) => (
          <div
            key={option.provider}
            role="button"
            tabIndex={0}
            className={`pop-option-btn ${value === option.provider ? "pop-option-btn--selected" : ""}`}
            onClick={() => onValueChange(option.provider as "gcash" | "maya")}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onValueChange(option.provider as "gcash" | "maya");
              }
            }}
          >
            {/* Header row */}
            <div className="pop-option-header">
              <span className="pop-option-name">{option.label}</span>
              {value === option.provider && (
                <span className="pop-selected-badge">Selected ✓</span>
              )}
              {value !== option.provider && (
                <span className="pop-radio-circle" />
              )}
            </div>

            {/* Card content */}
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
      </div>

      {error?.message ? <p className="pop-error">{error.message}</p> : null}
    </div>
  );
}

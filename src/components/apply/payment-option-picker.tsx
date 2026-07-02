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
    <div className="flex flex-col gap-3 w-full">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {options.map((option) => (
          <div
            key={option.provider}
            role="button"
            tabIndex={0}
            className={`bg-[#050505]/40 border rounded-2xl p-4 flex flex-col gap-0 cursor-pointer text-left transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff8a5c]/50 ${
              value === option.provider 
                ? "border-[#ff8a5c] shadow-lg shadow-orange-950/10 ring-1 ring-[#ff8a5c]/25" 
                : "border-white/[0.08] hover:border-white/15"
            }`}
            onClick={() => onValueChange(option.provider as "gcash" | "maya")}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onValueChange(option.provider as "gcash" | "maya");
              }
            }}
          >
            {/* Header row */}
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-white/[0.06]">
              <span className="text-sm font-bold text-white tracking-wide">{option.label}</span>
              {value === option.provider && (
                <span className="bg-[#ff8a5c]/10 border border-[#ff8a5c]/25 text-[#ff8a5c] text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0">Selected ✓</span>
              )}
              {value !== option.provider && (
                <span className="size-4 rounded-full border border-white/20 bg-white/[0.01]" />
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

      {error?.message ? <p className="text-xs text-red-400 font-medium mt-1">{error.message}</p> : null}
    </div>
  );
}

"use client";

import Image from "next/image";
import { Copy, QrCode } from "lucide-react";
import type { PublicPaymentOption } from "@/lib/apply/public-payment-option-dto";

type PaymentOptionCardProps = {
  isSelected?: boolean;
  onCopyNumber?: () => void;
  option: PublicPaymentOption;
};

export function PaymentOptionCard({ isSelected = false, onCopyNumber, option }: PaymentOptionCardProps) {
  return (
    <div className={`flex flex-col items-center gap-4 bg-white/[0.01] border border-white/[0.04] rounded-xl p-4 w-full transition-all duration-300 ${isSelected ? "border-white/[0.08]" : ""}`}>
      {/* QR code — centered, large */}
      {option.qrImageUrl ? (
        <div className="flex justify-center w-full">
          <Image
            src={option.qrImageUrl}
            alt={`${option.label} QR code`}
            width={200}
            height={200}
            className="w-[200px] h-[200px] object-contain rounded-lg border border-white/[0.08] bg-white p-1"
          />
        </div>
      ) : (
        <div className="w-[200px] h-[200px] border border-dashed border-white/20 rounded-lg flex flex-col items-center justify-center gap-2 text-white/40 bg-white/[0.01]">
          <QrCode className="size-6 text-white/20" />
          <p className="text-[11px] text-center">QR image not configured yet.</p>
        </div>
      )}

      {/* Account info — stacked below QR, centered */}
      <div className="flex flex-col items-center gap-3 text-center w-full mt-2">
        <div className="flex flex-col items-center gap-0.5">
          <p className="text-[9px] font-bold tracking-widest text-white/40 uppercase">ACCOUNT NAME</p>
          <p className="text-sm font-semibold text-white">{option.accountName || "To be confirmed"}</p>
        </div>
        <div className="flex flex-col items-center gap-0.5">
          <p className="text-[9px] font-bold tracking-widest text-white/40 uppercase">ACCOUNT NUMBER</p>
          <p className="text-base font-extrabold text-white tracking-wider font-mono">{option.accountNumber || "To be confirmed"}</p>
        </div>
      </div>

      {/* Copy number button — centered */}
      {option.accountNumber ? (
        <button 
          type="button" 
          className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.03] hover:bg-white/[0.08] px-3.5 py-1.5 text-xs font-semibold text-white/80 transition-all duration-200 cursor-pointer" 
          onClick={(e) => {
            e.stopPropagation(); // Avoid triggering card selection again on click
            if (onCopyNumber) onCopyNumber();
          }}
        >
          <Copy className="size-3.5" />
          Copy number
        </button>
      ) : null}
    </div>
  );
}

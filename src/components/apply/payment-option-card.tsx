"use client";

import Image from "next/image";
import { Copy, QrCode } from "lucide-react";
import type { PublicPaymentOption } from "@/lib/apply/public-payment-option-dto";

type PaymentOptionCardProps = {
  isSelected: boolean;
  onCopyNumber?: () => void;
  option: PublicPaymentOption;
};

export function PaymentOptionCard({ isSelected, onCopyNumber, option }: PaymentOptionCardProps) {
  return (
    <div className={`poc-card ${isSelected ? "poc-card--selected" : ""}`}>
      {/* QR code — centered, large */}
      {option.qrImageUrl ? (
        <div className="poc-qr-wrap">
          <Image
            src={option.qrImageUrl}
            alt={`${option.label} QR code`}
            width={220}
            height={220}
            className="poc-qr-img"
          />
        </div>
      ) : (
        <div className="poc-qr-placeholder">
          <QrCode className="poc-qr-placeholder-icon" />
          <p className="poc-qr-placeholder-text">QR image not configured yet.</p>
        </div>
      )}

      {/* Account info — stacked below QR, centered */}
      <div className="poc-account-info">
        <div className="poc-account-row">
          <p className="poc-account-label">ACCOUNT NAME</p>
          <p className="poc-account-value">{option.accountName || "To be confirmed"}</p>
        </div>
        <div className="poc-account-row">
          <p className="poc-account-label">ACCOUNT NUMBER</p>
          <p className="poc-account-number">{option.accountNumber || "To be confirmed"}</p>
        </div>
      </div>

      {/* Copy number button — centered */}
      {option.accountNumber ? (
        <button type="button" className="poc-copy-btn" onClick={onCopyNumber}>
          <Copy className="poc-copy-icon" />
          Copy number
        </button>
      ) : null}
    </div>
  );
}

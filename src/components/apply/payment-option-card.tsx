"use client";

import Image from "next/image";
import { Copy, QrCode, WalletCards } from "lucide-react";
import type { PublicPaymentOption } from "@/lib/apply/public-payment-option-dto";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type PaymentOptionCardProps = {
  isSelected: boolean;
  onCopyNumber?: () => void;
  option: PublicPaymentOption;
};

export function PaymentOptionCard({ isSelected, onCopyNumber, option }: PaymentOptionCardProps) {
  return (
    <Card
      className={`border-border/70 rounded-3xl transition-colors ${
        isSelected ? "border-rsvp-brand/60 bg-rsvp-accent/40" : "bg-background"
      }`}
    >
      <CardHeader className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <WalletCards className="text-rsvp-brand size-5" />
            {option.label}
          </CardTitle>
          <div className={`size-3 rounded-full ${isSelected ? "bg-rsvp-brand" : "bg-border"}`} />
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {option.qrImageUrl ? (
          <div className="border-border/70 overflow-hidden rounded-2xl border bg-white">
            <Image
              src={option.qrImageUrl}
              alt={`${option.label} QR code`}
              width={720}
              height={720}
              className="h-auto w-full object-cover"
            />
          </div>
        ) : (
          <div className="border-border/80 bg-muted/40 text-muted-foreground flex min-h-44 items-center justify-center rounded-2xl border border-dashed text-sm">
            <div className="flex flex-col items-center gap-2 text-center">
              <QrCode className="size-5" />
              <p>QR image will appear here once the admin uploads one.</p>
            </div>
          </div>
        )}

        <dl className="space-y-3 text-sm">
          <div className="space-y-1">
            <dt className="text-foreground font-medium">Account name</dt>
            <dd className="text-muted-foreground">{option.accountName || "To be confirmed"}</dd>
          </div>
          <div className="space-y-2">
            <dt className="text-foreground font-medium">Account number</dt>
            <dd className="text-muted-foreground">{option.accountNumber || "To be confirmed"}</dd>
            {option.accountNumber ? (
              <Button type="button" variant="outline" size="sm" onClick={onCopyNumber}>
                <Copy className="size-4" />
                Copy number
              </Button>
            ) : null}
          </div>
        </dl>
      </CardContent>
    </Card>
  );
}

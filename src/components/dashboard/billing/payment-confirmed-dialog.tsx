"use client";

import { useEffect, useState } from "react";
import { CheckCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { trackMetaPixelEvent } from "@/lib/meta/browser-events";

type PaymentConfirmedDialogProps = {
  amountPaid: number;
  currency: string;
  paidAt: string | null;
  paymentId: string;
  paymentStatus: "confirmed" | string;
};

const STORAGE_PREFIX = "webserbisyo:meta:purchase-confirmed:";
const SUPPRESSION_WINDOW_MS = 14 * 24 * 60 * 60 * 1000; // 14 days

function isAlreadyAcknowledged(paymentId: string): boolean {
  try {
    return localStorage.getItem(`${STORAGE_PREFIX}${paymentId}`) === "1";
  } catch {
    return false;
  }
}

function markAsAcknowledged(paymentId: string): void {
  try {
    localStorage.setItem(`${STORAGE_PREFIX}${paymentId}`, "1");
  } catch {
    // localStorage unavailable — modal will not re-show on same browser anyway.
  }
}

function isWithinSuppressionWindow(paidAt: string | null): boolean {
  if (!paidAt) {
    return true; // No date — treat as recent, show modal.
  }

  const paidTime = new Date(paidAt).getTime();

  if (Number.isNaN(paidTime)) {
    return true;
  }

  return Date.now() - paidTime <= SUPPRESSION_WINDOW_MS;
}

/**
 * Shows a one-time payment confirmation dialog on the client dashboard when:
 * 1. The payment status is "confirmed" (paid).
 * 2. The payment was confirmed within the last 14 days.
 * 3. The user has not yet acknowledged this specific payment.
 *
 * Fires `fbq('track', 'Purchase', ...)` with an eventID matching the server
 * CAPI deduplication key: `Purchase:<paymentId>`.
 */
export function PaymentConfirmedDialog({
  amountPaid,
  currency,
  paidAt,
  paymentId,
  paymentStatus,
}: PaymentConfirmedDialogProps) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Gate 1: Only trigger for confirmed payments.
    if (paymentStatus !== "confirmed") {
      return;
    }

    // Gate 2: Already acknowledged in this browser.
    if (isAlreadyAcknowledged(paymentId)) {
      return;
    }

    // Gate 3: 14-day suppression — don't pop up for old historical payments.
    if (!isWithinSuppressionWindow(paidAt)) {
      // Silently mark as acknowledged so it never pops up later.
      markAsAcknowledged(paymentId);
      return;
    }

    // Show the modal and fire the browser Purchase pixel.
    setIsOpen(true);

    trackMetaPixelEvent(
      "Purchase",
      { value: amountPaid, currency },
      { eventID: `Purchase:${paymentId}` },
    );

    // Mark acknowledged immediately — the pixel has already fired.
    markAsAcknowledged(paymentId);
  }, [amountPaid, currency, paidAt, paymentId, paymentStatus]);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
            <CheckCircle className="h-7 w-7 text-emerald-600" aria-hidden="true" />
          </div>
          <DialogTitle className="text-center text-lg">Payment Confirmed</DialogTitle>
          <DialogDescription className="text-center">
            Your payment of{" "}
            <strong>
              {new Intl.NumberFormat("en-PH", {
                currency,
                maximumFractionDigits: 0,
                minimumFractionDigits: 0,
                style: "currency",
              }).format(amountPaid)}
            </strong>{" "}
            has been confirmed. Thank you for choosing WebSerbisyo!
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            className="w-full rounded-full bg-[color:var(--dash-brand)] text-white hover:bg-[color:var(--dash-brand-hover)]"
            onClick={() => setIsOpen(false)}
          >
            Got it
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

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
  customerEmail?: string | null;
  customerFullName?: string | null;
  customerPhone?: string | null;
  externalId?: string | null;
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

async function sha256Client(value: string | null | undefined): Promise<string | null> {
  if (!value) return null;
  const normalized = value.trim().toLowerCase();
  if (!normalized) return null;
  try {
    if (typeof window !== "undefined" && window.crypto?.subtle) {
      const msgBuffer = new TextEncoder().encode(normalized);
      const hashBuffer = await window.crypto.subtle.digest("SHA-256", msgBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
    }
    return null;
  } catch {
    return null;
  }
}

async function sha256Phone(value: string | null | undefined): Promise<string | null> {
  if (!value) return null;
  const digits = value.replaceAll(/\D/g, "");
  if (!digits) return null;
  return sha256Client(digits);
}

/**
 * Shows a one-time payment confirmation dialog on the client dashboard when:
 * 1. The payment status is "confirmed" (paid).
 * 2. The payment was confirmed within the last 14 days.
 * 3. The user has not yet acknowledged this specific payment.
 *
 * Fires `fbq('track', 'Purchase', ...)` with an eventID matching the server
 * CAPI deduplication key: `Purchase:<paymentId>`, augmented with Manual Advanced
 * Matching customer parameters (em, ph, fn, ln, external_id) for max EMQ.
 */
async function firePurchasePixelWithRetry(params: {
  amountPaid: number;
  currency: string;
  customerEmail?: string | null;
  customerFullName?: string | null;
  customerPhone?: string | null;
  externalId?: string | null;
  paymentId: string;
}) {
  const nameParts = params.customerFullName?.trim().split(/\s+/) ?? [];
  const firstName = nameParts[0] ?? null;
  const lastName = nameParts.length > 1 ? nameParts.slice(1).join(" ") : null;

  const [em, ph, fn, ln, externalId] = await Promise.all([
    sha256Client(params.customerEmail),
    sha256Phone(params.customerPhone),
    sha256Client(firstName),
    sha256Client(lastName),
    sha256Client(params.externalId ?? params.paymentId),
  ]);

  const maxAttempts = 15;
  for (let i = 0; i < maxAttempts; i++) {
    if (typeof window !== "undefined" && typeof window.fbq === "function") {
      trackMetaPixelEvent(
        "Purchase",
        { value: params.amountPaid, currency: params.currency },
        {
          eventID: `Purchase:${params.paymentId}`,
          ...(em ? { em } : {}),
          ...(ph ? { ph } : {}),
          ...(fn ? { fn } : {}),
          ...(ln ? { ln } : {}),
          ...(externalId ? { external_id: externalId } : {}),
        },
      );
      return true;
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  return false;
}

export function PaymentConfirmedDialog({
  amountPaid,
  currency,
  customerEmail,
  customerFullName,
  customerPhone,
  externalId,
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

    // Show the modal and fire the browser Purchase pixel with retry.
    setIsOpen(true);

    void firePurchasePixelWithRetry({
      amountPaid,
      currency,
      customerEmail,
      customerFullName,
      customerPhone,
      externalId,
      paymentId,
    }).finally(() => {
      markAsAcknowledged(paymentId);
    });
  }, [
    amountPaid,
    currency,
    customerEmail,
    customerFullName,
    customerPhone,
    externalId,
    paidAt,
    paymentId,
    paymentStatus,
  ]);

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
            className="w-full"
            onClick={() => setIsOpen(false)}
          >
            Got it
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

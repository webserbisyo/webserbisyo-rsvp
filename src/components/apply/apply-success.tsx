"use client";

import { useMemo, useSyncExternalStore } from "react";
import Link from "next/link";
import { Copy, MessageCircleMore, ReceiptText } from "lucide-react";
import { toast } from "sonner";
import { buildReferenceOnlyFollowupMessage, formatPlanLabel } from "@/lib/apply/messenger";
import { getPaymentOptionLabel } from "@/lib/apply/public-payment-option-dto";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessengerFollowup } from "./messenger-followup";

type ApplySuccessProps = {
  messengerPageUrl: string | null;
  paymentOption: string | null;
  plan: string | null;
  referenceCode: string | null;
};

type StoredSuccessPayload = {
  followupMessage: string;
  plan: string | null;
  preferredManualPaymentOption: string | null;
  referenceCode: string;
};

const APPLY_SUCCESS_STORAGE_KEY = "ws-rsvp-apply-success";

function subscribeToStoredSuccessPayload() {
  return () => undefined;
}

function readStoredSuccessPayload(referenceCode: string | null): StoredSuccessPayload | null {
  if (!referenceCode) {
    return null;
  }

  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.sessionStorage.getItem(APPLY_SUCCESS_STORAGE_KEY);

    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as StoredSuccessPayload;

    return parsed.referenceCode === referenceCode ? parsed : null;
  } catch {
    return null;
  }
}

export function ApplySuccess({
  messengerPageUrl,
  paymentOption,
  plan,
  referenceCode,
}: ApplySuccessProps) {
  const storedPayload = useSyncExternalStore(
    subscribeToStoredSuccessPayload,
    () => readStoredSuccessPayload(referenceCode),
    () => null,
  );

  const displayPlan = storedPayload?.plan ?? plan;
  const displayPaymentOption = storedPayload?.preferredManualPaymentOption ?? paymentOption;
  const followupMessage = useMemo(
    () =>
      storedPayload?.followupMessage ??
      (referenceCode
        ? buildReferenceOnlyFollowupMessage(referenceCode)
        : "Hi WebSerbisyo! I need help locating my RSVP application reference."),
    [referenceCode, storedPayload?.followupMessage],
  );

  async function copyReference() {
    if (!referenceCode) {
      return;
    }

    try {
      await navigator.clipboard.writeText(referenceCode);
      toast.success("Reference code copied.");
    } catch {
      toast.error("Could not copy the reference code.");
    }
  }

  return (
    <main className="rsvp-shell min-h-screen">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
        <Card className="rsvp-panel border-border/70 rounded-[2rem]">
          <CardHeader className="space-y-3">
            <div className="bg-rsvp-brand text-rsvp-brand-foreground flex size-12 items-center justify-center rounded-2xl">
              <ReceiptText className="size-5" />
            </div>
            <div className="space-y-2">
              <CardTitle className="text-3xl font-semibold tracking-tight">
                Application submitted
              </CardTitle>
              <p className="text-muted-foreground text-sm leading-6">
                Please continue on Messenger and send your reference number so WebSerbisyo can
                manually confirm your application and payment details.
              </p>
            </div>
          </CardHeader>
          <CardContent className="grid gap-5 md:grid-cols-[1fr_auto] md:items-end">
            <div className="space-y-4">
              <div className="border-border/70 bg-background rounded-3xl border px-4 py-4">
                <p className="text-rsvp-brand text-xs font-semibold tracking-[0.22em] uppercase">
                  Reference code
                </p>
                <p className="mt-2 text-2xl font-semibold tracking-tight">
                  {referenceCode ?? "Not available"}
                </p>
                {!referenceCode ? (
                  <p className="text-muted-foreground mt-2 text-sm">
                    If you just submitted, return to the application flow and try again.
                  </p>
                ) : null}
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="border-border/70 bg-background rounded-3xl border px-4 py-4">
                  <p className="text-rsvp-brand text-xs font-semibold tracking-[0.22em] uppercase">
                    Selected plan
                  </p>
                  <p className="text-muted-foreground mt-2 text-sm">
                    {formatPlanLabel(displayPlan) ?? "Saved on submission"}
                  </p>
                </div>
                <div className="border-border/70 bg-background rounded-3xl border px-4 py-4">
                  <p className="text-rsvp-brand text-xs font-semibold tracking-[0.22em] uppercase">
                    Payment option
                  </p>
                  <p className="text-muted-foreground mt-2 text-sm">
                    {getPaymentOptionLabel(
                      (displayPaymentOption as "gcash" | "maya" | null | undefined) ?? null,
                    ) ?? "To be confirmed on Messenger"}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-3">
              <Button
                type="button"
                onClick={() => void copyReference()}
                disabled={!referenceCode}
                className="bg-rsvp-brand text-rsvp-brand-foreground hover:bg-rsvp-brand/90"
              >
                <Copy className="size-4" />
                Copy reference
              </Button>
              <Button asChild variant="outline">
                <Link href="/apply">Back to Apply</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <MessengerFollowup message={followupMessage} messengerPageUrl={messengerPageUrl} />

        <div className="flex justify-start">
          <Button asChild variant="ghost">
            <Link href="/apply/start?plan=pro">
              New application
              <MessageCircleMore className="size-4" />
            </Link>
          </Button>
        </div>
      </div>
    </main>
  );
}

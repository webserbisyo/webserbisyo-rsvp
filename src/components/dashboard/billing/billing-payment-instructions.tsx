"use client";

import { useState } from "react";
import { Copy, QrCode } from "lucide-react";
import { toast } from "sonner";
import { BillingPaymentProviderLogo } from "@/components/dashboard/billing/billing-payment-provider-logo";
import type { BillingPageData, BillingPaymentOption } from "@/components/dashboard/billing/billing-types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

type BillingPaymentInstructionsProps = {
  paymentInstructions: BillingPageData["paymentInstructions"];
};

const PROVIDER_STYLES: Record<string, string> = {
  gcash:
    "border-[color:color-mix(in_srgb,#1b64f1_16%,var(--dash-border))] bg-[color:color-mix(in_srgb,#1b64f1_7%,#fff8f2)] text-[#1b64f1] hover:border-[color:color-mix(in_srgb,#1b64f1_28%,var(--dash-border-hover))]",
  maya: "border-[color:color-mix(in_srgb,#16a36f_18%,var(--dash-border))] bg-[color:color-mix(in_srgb,#16a36f_8%,#fff8f1)] text-[#157a58] hover:border-[color:color-mix(in_srgb,#16a36f_30%,var(--dash-border-hover))]",
};

export function BillingPaymentInstructions({
  paymentInstructions,
}: BillingPaymentInstructionsProps) {
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-[0.17em] text-[color:var(--dash-heading-muted)]">
        Payment Instructions
      </p>
      <p className="mt-4 text-base font-medium leading-relaxed text-[color:var(--dash-muted)]">
        {paymentInstructions.description}
      </p>
      {paymentInstructions.options.length > 0 ? (
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {paymentInstructions.options.map((option) => (
            <PaymentOptionDialog key={option.provider} option={option} />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function PaymentOptionDialog({ option }: { option: BillingPaymentOption }) {
  const [isCopying, setIsCopying] = useState(false);
  const providerLabel = getProviderLabel(option.provider);
  const providerKey = option.provider.trim().toLowerCase();

  async function handleCopyAccountNumber() {
    if (!option.accountNumber || isCopying) {
      return;
    }

    setIsCopying(true);

    try {
      await copyText(option.accountNumber);
      toast("Copied", {
        description: `${providerLabel} account number copied.`,
      });
    } catch {
      toast("Copy unavailable", {
        description: "This device could not copy the account number automatically.",
      });
    } finally {
      window.setTimeout(() => {
        setIsCopying(false);
      }, 1200);
    }
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          type="button"
          className={cn(
            "group w-full cursor-pointer rounded-[1.35rem] border px-4 py-4 text-left shadow-[0_8px_22px_rgba(99,74,55,0.06)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_14px_28px_rgba(99,74,55,0.1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:color-mix(in_srgb,var(--dash-brand)_26%,white)]",
            PROVIDER_STYLES[providerKey] ??
              "border-[color:var(--dash-divider)] bg-[color:color-mix(in_srgb,var(--dash-surface-muted)_60%,white)] text-[color:var(--dash-foreground)] hover:border-[color:var(--dash-border-hover)]",
          )}
          aria-label={`Open ${providerLabel} payment details`}
        >
          <div className="flex min-h-20 flex-col items-center justify-center gap-2 text-center">
            <BillingPaymentProviderLogo provider={option.provider} />
            <span className="text-xs font-bold uppercase tracking-[0.14em] text-current/80">
              {providerLabel}
            </span>
          </div>
        </button>
      </DialogTrigger>
      <DialogContent
        className="max-h-[min(88vh,760px)] max-w-[calc(100%-1.5rem)] gap-0 overflow-hidden rounded-[1.7rem] border border-[color:var(--dash-border)] bg-[color:color-mix(in_srgb,var(--dash-surface)_88%,#fff5eb)] p-0 text-[color:var(--dash-foreground)] shadow-[0_28px_72px_rgba(66,45,29,0.2)] sm:max-w-lg"
      >
        <div className="max-h-[min(88vh,760px)] overflow-y-auto">
          <div className="px-5 pt-5 pb-4 sm:px-6 sm:pt-6">
            <DialogHeader className="gap-1">
              <DialogTitle className="text-[1.05rem] font-black tracking-[-0.01em] text-[color:var(--dash-foreground)]">
                {providerLabel} Payment Details
              </DialogTitle>
              <DialogDescription className="text-sm leading-6 text-[color:var(--dash-heading-muted)]">
                Use these details to settle your remaining balance.
              </DialogDescription>
            </DialogHeader>

            <div className="mt-5 grid gap-4">
              <DetailBlock label="Account name" value={option.accountName || "—"} />
              <div className="rounded-[1.2rem] border border-[color:var(--dash-divider)] bg-[color:color-mix(in_srgb,var(--dash-surface-muted)_50%,white)] px-4 py-3.5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs font-bold uppercase tracking-[0.14em] text-[color:var(--dash-heading-muted)]">
                      Account number
                    </p>
                    <p className="mt-2 break-all text-sm font-black tracking-[0.02em] text-[color:var(--dash-foreground)]">
                      {option.accountNumber || "—"}
                    </p>
                  </div>
                  {option.accountNumber ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleCopyAccountNumber}
                      aria-label={`Copy ${providerLabel} account number`}
                      className="shrink-0 rounded-full border-[color:var(--dash-divider)] bg-white/75 px-3 text-[color:var(--dash-foreground)] hover:bg-white"
                    >
                      <Copy className="size-3.5" />
                      {isCopying ? "Copied" : "Copy"}
                    </Button>
                  ) : null}
                </div>
              </div>

              <div className="rounded-[1.2rem] border border-[color:var(--dash-divider)] bg-[color:color-mix(in_srgb,var(--dash-surface-muted)_38%,white)] px-4 py-4">
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-[color:var(--dash-heading-muted)]">
                  QR code
                </p>
                {option.qrImageUrl ? (
                  <div className="mt-3 overflow-hidden rounded-[1rem] border border-[color:var(--dash-divider)] bg-white">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={option.qrImageUrl}
                      alt={`${providerLabel} payment QR code`}
                      className="h-auto w-full object-contain"
                    />
                  </div>
                ) : (
                  <div className="mt-3 flex min-h-36 items-center justify-center rounded-[1rem] border border-dashed border-[color:var(--dash-divider)] bg-white/60 px-4 text-center text-sm font-medium text-[color:var(--dash-heading-muted)]">
                    <div className="flex flex-col items-center gap-2">
                      <QrCode className="size-5 text-[color:var(--dash-brand)]" aria-hidden="true" />
                      <p>QR code not available.</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        <DialogFooter
          showCloseButton
          className="border-[color:var(--dash-divider)] bg-[color:color-mix(in_srgb,var(--dash-surface-muted)_44%,white)]"
        />
      </DialogContent>
    </Dialog>
  );
}

function DetailBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.2rem] border border-[color:var(--dash-divider)] bg-[color:color-mix(in_srgb,var(--dash-surface-muted)_50%,white)] px-4 py-3.5">
      <p className="text-xs font-bold uppercase tracking-[0.14em] text-[color:var(--dash-heading-muted)]">
        {label}
      </p>
      <p className="mt-2 text-sm font-semibold text-[color:var(--dash-foreground)]">{value}</p>
    </div>
  );
}

function getProviderLabel(provider: string) {
  const normalized = provider.trim().toLowerCase();

  if (normalized === "gcash") {
    return "GCash";
  }

  if (normalized === "maya") {
    return "Maya";
  }

  return provider;
}

async function copyText(value: string) {
  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return;
  }

  if (typeof document === "undefined") {
    throw new Error("Clipboard API unavailable");
  }

  const textarea = document.createElement("textarea");
  textarea.value = value;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "absolute";
  textarea.style.left = "-9999px";
  document.body.appendChild(textarea);
  textarea.select();

  try {
    const copied = document.execCommand("copy");

    if (!copied) {
      throw new Error("Copy command failed");
    }
  } finally {
    document.body.removeChild(textarea);
  }
}

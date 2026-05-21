"use client";

import { useState } from "react";
import { Copy, QrCode } from "lucide-react";
import { toast } from "sonner";
import type { BillingPageData, BillingPaymentOption } from "@/components/dashboard/billing/billing-types";
import { MessengerLogo } from "@/components/dashboard/billing/messenger-logo";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

type BillingPaymentInstructionsProps = {
  paymentInstructions: BillingPageData["paymentInstructions"];
  support: BillingPageData["support"];
};

const PROVIDER_STYLES: Record<string, string> = {
  gcash:
    "border-[color:color-mix(in_srgb,#1b64f1_16%,var(--dash-border))] bg-[color:color-mix(in_srgb,#1b64f1_7%,#fff8f2)] text-[#1b64f1] hover:border-[color:color-mix(in_srgb,#1b64f1_28%,var(--dash-border-hover))]",
  maya: "border-[color:color-mix(in_srgb,#16a36f_18%,var(--dash-border))] bg-[color:color-mix(in_srgb,#16a36f_8%,#fff8f1)] text-[#157a58] hover:border-[color:color-mix(in_srgb,#16a36f_30%,var(--dash-border-hover))]",
};

export function BillingPaymentInstructions({
  paymentInstructions,
  support,
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
            <PaymentOptionDialog key={option.provider} option={option} support={support} />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function PaymentOptionDialog({
  option,
  support,
}: {
  option: BillingPaymentOption;
  support: BillingPageData["support"];
}) {
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
          <div className="flex min-h-20 items-center justify-center text-center">
            <span className="text-base font-black tracking-[-0.01em] text-current">
              {providerLabel}
            </span>
          </div>
        </button>
      </DialogTrigger>
      <DialogContent
        className="max-w-[calc(100%-1.5rem)] gap-0 overflow-hidden rounded-[1.6rem] border border-[#ead8c4] bg-[#fffaf3] p-0 text-[color:var(--dash-foreground)] shadow-[0_24px_60px_rgba(83,54,33,0.16)] ring-[#f1e2d0]/80 sm:max-w-[500px]"
      >
        <div className="px-5 pt-5 pb-0 sm:px-5 sm:pt-5">
          <DialogHeader className="gap-1 pr-10">
            <DialogTitle className="text-[1.08rem] font-black tracking-[-0.01em] text-[color:var(--dash-foreground)]">
              {providerLabel} Payment Details
            </DialogTitle>
            <DialogDescription className="text-sm leading-6 text-[color:var(--dash-heading-muted)]">
              Use these details to settle your remaining balance.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4 grid gap-3 pb-4">
            <DetailBlock label="Account name" value={option.accountName || "—"} />
            <div className="rounded-[1.15rem] border border-[#efe0cf] bg-[color:color-mix(in_srgb,#fff9f1_78%,white)] px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.72)]">
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
                    className="shrink-0 rounded-full border-[#e6cfbb] bg-[#fff7ee] px-3 text-[color:var(--dash-brand)] shadow-[inset_0_1px_0_rgba(255,255,255,0.82)] hover:border-[#ddb493] hover:bg-[#fff1e5] hover:text-[color:var(--dash-brand)]"
                  >
                    <Copy className="size-3.5" />
                    {isCopying ? "Copied" : "Copy"}
                  </Button>
                ) : null}
              </div>
            </div>

            <div className="rounded-[1.2rem] border border-[#efe0cf] bg-[color:color-mix(in_srgb,#fff8ef_76%,white)] px-4 py-3.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.72)]">
              <p className="text-center text-xs font-bold uppercase tracking-[0.14em] text-[color:var(--dash-heading-muted)]">
                QR code
              </p>
              {option.qrImageUrl ? (
                <div className="mt-2.5 flex justify-center rounded-[1rem] border border-[#ebdccc] bg-white px-3 py-2.5">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={option.qrImageUrl}
                    alt={`${providerLabel} payment QR code`}
                    className="mx-auto aspect-square w-full max-w-[260px] max-h-[32dvh] object-contain"
                  />
                </div>
              ) : (
                <div className="mt-2.5 flex min-h-28 items-center justify-center rounded-[1rem] border border-dashed border-[#e6d2be] bg-white/65 px-4 text-center text-sm font-medium text-[color:var(--dash-heading-muted)]">
                  <div className="flex flex-col items-center gap-2">
                    <QrCode className="size-5 text-[color:var(--dash-brand)]" aria-hidden="true" />
                    <p>QR code not available.</p>
                  </div>
                </div>
              )}
            </div>

            <div className="rounded-[1.05rem] border border-[#efd4bd] bg-[#fff7ed] px-4 py-3 text-sm leading-relaxed text-[color:color-mix(in_srgb,var(--dash-brand)_82%,#7c4c33)] shadow-[inset_0_1px_0_rgba(255,255,255,0.76)]">
              After payment, send your proof of payment through Messenger so WebSerbisyo can verify
              your transaction.
            </div>

            {support.isEnabled && support.url ? (
              <Button
                asChild
                className="h-10 rounded-full bg-[#cf683f] px-5 text-sm font-black text-white shadow-[0_12px_26px_rgba(207,104,63,0.22)] hover:bg-[#bc5933] focus-visible:ring-[rgba(207,104,63,0.25)]"
              >
                <a href={support.url} target="_blank" rel="noreferrer">
                  <span className="flex items-center justify-center gap-2.5">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/18 ring-1 ring-white/18">
                      <MessengerLogo className="h-[14px] w-[14px] brightness-0 invert" />
                    </span>
                    Send proof via Messenger
                  </span>
                </a>
              </Button>
            ) : null}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function DetailBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.15rem] border border-[#efe0cf] bg-[color:color-mix(in_srgb,#fff9f1_78%,white)] px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.72)]">
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

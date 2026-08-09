"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Copy, MessageCircleMore } from "lucide-react";
import { toast } from "sonner";
import {
  buildReferenceOnlyFollowupMessage,
  buildMessengerContinueUrl,
  formatPlanLabel,
} from "@/lib/apply/messenger";
import { trackMetaAcquisitionClick } from "@/lib/meta/acquisition-tracker";
import { getPaymentOptionLabel } from "@/lib/apply/public-payment-option-dto";

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

function isStoredSuccessPayload(value: unknown): value is StoredSuccessPayload {
  if (!value || typeof value !== "object") return false;
  const payload = value as Partial<StoredSuccessPayload>;
  return (
    typeof payload.followupMessage === "string" &&
    typeof payload.referenceCode === "string" &&
    (payload.plan === null || typeof payload.plan === "string" || payload.plan === undefined) &&
    (payload.preferredManualPaymentOption === null ||
      typeof payload.preferredManualPaymentOption === "string" ||
      payload.preferredManualPaymentOption === undefined)
  );
}

function readStoredSuccessPayload(referenceCode: string | null): StoredSuccessPayload | null {
  if (!referenceCode) return null;
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(APPLY_SUCCESS_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    if (!isStoredSuccessPayload(parsed)) return null;
    return parsed.referenceCode === referenceCode ? parsed : null;
  } catch {
    return null;
  }
}
let cachedPayload: StoredSuccessPayload | null = null;
let hasClearedStorage = false;

export function ApplySuccess({
  messengerPageUrl,
  paymentOption,
  plan,
  referenceCode,
}: ApplySuccessProps) {
  const [storedPayload] = useState<StoredSuccessPayload | null>(() => {
    if (cachedPayload && cachedPayload.referenceCode === referenceCode) {
      return cachedPayload;
    }
    const payload = readStoredSuccessPayload(referenceCode);
    if (payload) {
      cachedPayload = payload;
    }
    return payload;
  });

  useEffect(() => {
    if (!hasClearedStorage && referenceCode) {
      window.sessionStorage.removeItem(APPLY_SUCCESS_STORAGE_KEY);
      hasClearedStorage = true;
    }
  }, [referenceCode]);

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

  const messengerUrl = buildMessengerContinueUrl(messengerPageUrl);

  async function copyReference() {
    if (!referenceCode) return;
    try {
      await navigator.clipboard.writeText(referenceCode);
      toast.success("Reference code copied.");
    } catch {
      toast.error("Could not copy the reference code.");
    }
  }

  async function copyFollowupMessage() {
    try {
      await navigator.clipboard.writeText(followupMessage);
      toast.success("Follow-up message copied.");
    } catch {
      toast.error("Could not copy the follow-up message.");
    }
  }

  async function handleContinueOnMessenger() {
    trackMetaAcquisitionClick("Contact", {
      contact_method: "messenger",
      reference_code: referenceCode,
      source: "success",
    });

    // Auto-copy the full followup message to clipboard first
    try {
      await navigator.clipboard.writeText(followupMessage);
      toast.success("Message copied! Opening Messenger…");
    } catch {
      // Non-fatal — still open Messenger
    }
    if (messengerUrl) {
      window.open(messengerUrl, "_blank", "noopener,noreferrer");
    }
  }

  const planLabel = formatPlanLabel(displayPlan);
  const paymentLabel = getPaymentOptionLabel(
    (displayPaymentOption as "gcash" | "maya" | null | undefined) ?? null,
  );

  return (
    <div className="flex w-full flex-col items-center">
      {/* Confetti particles */}
      <div className="as-confetti pointer-events-none opacity-20" aria-hidden="true">
        {Array.from({ length: 20 }).map((_, i) => (
          <div key={i} className={`as-confetti-piece as-confetti-piece--${(i % 5) + 1}`} />
        ))}
      </div>

      {/* ── Main card ── */}
      <div className="flex w-full max-w-xl flex-col rounded-3xl border border-white/[0.08] bg-white/[0.02] p-6 shadow-2xl shadow-black/40 backdrop-blur-2xl sm:p-10">
        {/* Coral/orange checkmark circle icon */}
        <div className="mb-6 flex justify-center">
          <div className="flex size-12 items-center justify-center rounded-full border border-[#ff8a5c]/25 bg-[#ff8a5c]/10 text-[#ff8a5c] shadow-lg shadow-orange-950/20 sm:size-14">
            <span className="text-xl font-black sm:text-2xl">✓</span>
          </div>
        </div>

        {/* Heading */}
        <div className="mb-8 text-center">
          <h1 className="mb-3 text-2xl font-extrabold tracking-wide text-white sm:text-3xl">
            Application received
          </h1>
          <p className="mx-auto max-w-md text-sm leading-relaxed text-white/70">
            Your RSVP event website preview request has been submitted. Save your reference code and
            continue on Messenger so we can confirm your{" "}
            {planLabel ? `${planLabel} details` : "details"} and next steps.
          </p>
        </div>

        {/* Reference code box */}
        <div className="flex flex-col justify-between gap-4 rounded-2xl border border-white/[0.06] bg-[#050505]/40 p-4 shadow-inner sm:flex-row sm:items-center">
          <div className="flex flex-col gap-0.5">
            <span className="text-[9px] font-bold tracking-wider text-white/40 uppercase">
              YOUR REFERENCE CODE
            </span>
            <span className="font-mono text-base font-extrabold tracking-wider text-[#ff8a5c] sm:text-lg">
              {referenceCode ?? "Not available"}
            </span>
          </div>
          <button
            type="button"
            className="inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-[#ff8a5c]/20 bg-[#ff8a5c]/10 px-3.5 py-1.5 text-xs font-bold text-[#ff8a5c] transition-all duration-200 hover:bg-[#ff8a5c]/20 disabled:cursor-not-allowed disabled:opacity-40"
            onClick={() => void copyReference()}
            disabled={!referenceCode}
            aria-label="Copy reference code"
          >
            <Copy className="size-3.5" />
            Copy code
          </button>
        </div>
        <p className="mt-2 mb-6 text-[10px] text-white/35">
          Save this code. You&apos;ll need it when messaging WebSerbisyo.
        </p>

        {/* Plan / Payment Summary Metadata Row */}
        {(planLabel || paymentLabel) && (
          <div className="my-2 grid grid-cols-2 gap-4 border-t border-b border-white/[0.06] py-5">
            {planLabel && (
              <div className="flex flex-col gap-0.5">
                <span className="text-[9px] font-bold tracking-wider text-white/40 uppercase">
                  Selected Plan
                </span>
                <span className="text-sm font-semibold text-white">{planLabel}</span>
              </div>
            )}
            {paymentLabel && (
              <div className="flex flex-col gap-0.5">
                <span className="text-[9px] font-bold tracking-wider text-white/40 uppercase">
                  Payment Option
                </span>
                <span className="text-sm font-semibold text-white">{paymentLabel}</span>
              </div>
            )}
          </div>
        )}

        {/* What happens next */}
        <div className="my-6">
          <p className="mb-4 text-[10px] font-bold tracking-widest text-[#ff8a5c] uppercase">
            WHAT HAPPENS NEXT
          </p>
          <ol className="space-y-4">
            <li className="flex items-start gap-3 text-xs leading-relaxed text-white/70">
              <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border border-[#ff8a5c]/25 bg-[#ff8a5c]/10 text-[10px] font-bold text-[#ff8a5c]">
                1
              </span>
              <span>Copy your reference message.</span>
            </li>
            <li className="flex items-start gap-3 text-xs leading-relaxed text-white/70">
              <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border border-[#ff8a5c]/25 bg-[#ff8a5c]/10 text-[10px] font-bold text-[#ff8a5c]">
                2
              </span>
              <span>Continue on Messenger and send it to WebSerbisyo.</span>
            </li>
            <li className="flex items-start gap-3 text-xs leading-relaxed text-white/70">
              <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border border-[#ff8a5c]/25 bg-[#ff8a5c]/10 text-[10px] font-bold text-[#ff8a5c]">
                3
              </span>
              <span>
                We&apos;ll confirm your details, payment option, and website preview process.
              </span>
            </li>
          </ol>
        </div>

        {/* Copyable follow-up message block */}
        <div className="mt-4 mb-6 border-t border-white/[0.06] pt-6">
          <p className="mb-1 text-[10px] font-bold tracking-wider text-white/40 uppercase">
            REFERENCE MESSAGE FOR MESSENGER
          </p>
          <p className="mb-3 text-[11px] leading-normal text-white/50">
            Copy this message before opening Messenger so your application is easy to find.
          </p>
          <pre className="overflow-visible rounded-2xl border border-white/[0.06] bg-[#050505]/40 p-4 font-mono text-xs leading-relaxed break-words whitespace-pre-wrap text-white/70 shadow-inner">
            {followupMessage}
          </pre>
          <button
            type="button"
            className="mt-3 inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-xs font-bold text-white transition-all hover:bg-white/[0.08]"
            onClick={() => void copyFollowupMessage()}
            aria-label="Copy reference message"
          >
            <Copy className="size-3.5" />
            Copy message
          </button>
        </div>

        {/* Continue on Messenger button */}
        {messengerUrl ? (
          <button
            type="button"
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#0084FF] px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-[#0084FF]/10 transition-all duration-200 hover:bg-[#0074e0] focus-visible:ring-2 focus-visible:ring-[#0084FF]/50 focus-visible:outline-none"
            onClick={() => void handleContinueOnMessenger()}
          >
            <MessageCircleMore className="size-4" />
            Continue on Messenger
          </button>
        ) : null}

        {/* Back link */}
        <div className="mt-6 text-center">
          <Link
            href="/apply"
            className="text-xs font-semibold text-white/40 transition-colors hover:text-white"
          >
            ← Back to packages
          </Link>
        </div>
      </div>

      {/* Footer */}
      <p className="mt-12 pb-6 text-center text-[10px] tracking-wider text-white/30">
        © 2024 WebSerbisyo RSVP · Made with love for Filipino couples
      </p>
    </div>
  );
}

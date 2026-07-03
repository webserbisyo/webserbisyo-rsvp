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
import { trackMetaPixelEvent } from "@/lib/meta/browser-events";
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
    trackMetaPixelEvent("Contact", {
      contact_method: "messenger",
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
    <div className="w-full flex flex-col items-center">
      {/* Confetti particles */}
      <div className="as-confetti opacity-20 pointer-events-none" aria-hidden="true">
        {Array.from({ length: 20 }).map((_, i) => (
          <div key={i} className={`as-confetti-piece as-confetti-piece--${(i % 5) + 1}`} />
        ))}
      </div>

      {/* ── Main card ── */}
      <div className="w-full max-w-xl bg-white/[0.02] border border-white/[0.08] backdrop-blur-2xl rounded-3xl p-6 sm:p-10 shadow-2xl shadow-black/40 flex flex-col">
        {/* Coral/orange checkmark circle icon */}
        <div className="flex justify-center mb-6">
          <div className="size-12 sm:size-14 rounded-full bg-[#ff8a5c]/10 border border-[#ff8a5c]/25 flex items-center justify-center text-[#ff8a5c] shadow-lg shadow-orange-950/20">
            <span className="text-xl sm:text-2xl font-black">✓</span>
          </div>
        </div>

        {/* Heading */}
        <div className="text-center mb-8">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-wide mb-3">
            Application received
          </h1>
          <p className="text-sm text-white/70 leading-relaxed max-w-md mx-auto">
            Your RSVP wedding website preview request has been submitted. Save your reference code and continue on Messenger so we can confirm your{" "}
            {planLabel ? `${planLabel} details` : "details"} and next steps.
          </p>
        </div>

        {/* Reference code box */}
        <div className="bg-[#050505]/40 border border-white/[0.06] rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-inner">
          <div className="flex flex-col gap-0.5">
            <span className="text-[9px] font-bold tracking-wider uppercase text-white/40">YOUR REFERENCE CODE</span>
            <span className="text-base sm:text-lg font-extrabold text-[#ff8a5c] font-mono tracking-wider">
              {referenceCode ?? "Not available"}
            </span>
          </div>
          <button
            type="button"
            className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-[#ff8a5c]/20 bg-[#ff8a5c]/10 hover:bg-[#ff8a5c]/20 px-3.5 py-1.5 text-xs font-bold text-[#ff8a5c] transition-all duration-200 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            onClick={() => void copyReference()}
            disabled={!referenceCode}
            aria-label="Copy reference code"
          >
            <Copy className="size-3.5" />
            Copy code
          </button>
        </div>
        <p className="text-[10px] text-white/35 mt-2 mb-6">
          Save this code. You&apos;ll need it when messaging WebSerbisyo.
        </p>

        {/* Plan / Payment Summary Metadata Row */}
        {(planLabel || paymentLabel) && (
          <div className="grid grid-cols-2 gap-4 border-t border-b border-white/[0.06] py-5 my-2">
            {planLabel && (
              <div className="flex flex-col gap-0.5">
                <span className="text-[9px] font-bold tracking-wider uppercase text-white/40">Selected Plan</span>
                <span className="text-sm font-semibold text-white">{planLabel}</span>
              </div>
            )}
            {paymentLabel && (
              <div className="flex flex-col gap-0.5">
                <span className="text-[9px] font-bold tracking-wider uppercase text-white/40">Payment Option</span>
                <span className="text-sm font-semibold text-white">{paymentLabel}</span>
              </div>
            )}
          </div>
        )}

        {/* What happens next */}
        <div className="my-6">
          <p className="text-[10px] font-bold tracking-widest text-[#ff8a5c] uppercase mb-4">WHAT HAPPENS NEXT</p>
          <ol className="space-y-4">
            <li className="flex items-start gap-3 text-xs text-white/70 leading-relaxed">
              <span className="size-5 rounded-full bg-[#ff8a5c]/10 border border-[#ff8a5c]/25 flex items-center justify-center text-[10px] font-bold text-[#ff8a5c] shrink-0 mt-0.5">
                1
              </span>
              <span>Copy your reference message.</span>
            </li>
            <li className="flex items-start gap-3 text-xs text-white/70 leading-relaxed">
              <span className="size-5 rounded-full bg-[#ff8a5c]/10 border border-[#ff8a5c]/25 flex items-center justify-center text-[10px] font-bold text-[#ff8a5c] shrink-0 mt-0.5">
                2
              </span>
              <span>Continue on Messenger and send it to WebSerbisyo.</span>
            </li>
            <li className="flex items-start gap-3 text-xs text-white/70 leading-relaxed">
              <span className="size-5 rounded-full bg-[#ff8a5c]/10 border border-[#ff8a5c]/25 flex items-center justify-center text-[10px] font-bold text-[#ff8a5c] shrink-0 mt-0.5">
                3
              </span>
              <span>We&apos;ll confirm your details, payment option, and website preview process.</span>
            </li>
          </ol>
        </div>

        {/* Copyable follow-up message block */}
        <div className="border-t border-white/[0.06] pt-6 mt-4 mb-6">
          <p className="text-[10px] font-bold tracking-wider uppercase text-white/40 mb-1">REFERENCE MESSAGE FOR MESSENGER</p>
          <p className="text-[11px] text-white/50 leading-normal mb-3">
            Copy this message before opening Messenger so your application is easy to find.
          </p>
          <pre className="bg-[#050505]/40 border border-white/[0.06] rounded-2xl p-4 text-xs font-mono text-white/70 whitespace-pre-wrap break-words overflow-visible leading-relaxed shadow-inner">
            {followupMessage}
          </pre>
          <button
            type="button"
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.08] px-4 py-3 text-xs font-bold text-white transition-all mt-3 cursor-pointer"
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
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#0084FF] hover:bg-[#0074e0] px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-[#0084FF]/10 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0084FF]/50"
            onClick={() => void handleContinueOnMessenger()}
          >
            <MessageCircleMore className="size-4" />
            Continue on Messenger
          </button>
        ) : null}

        {/* Back link */}
        <div className="text-center mt-6">
          <Link href="/apply" className="text-xs font-semibold text-white/40 hover:text-white transition-colors">
            ← Back to packages
          </Link>
        </div>
      </div>

      {/* Footer */}
      <p className="text-center text-[10px] text-white/30 tracking-wider mt-12 pb-6">
        © 2024 WebSerbisyo RSVP · Made with love for Filipino couples
      </p>
    </div>
  );
}

"use client";

import { useEffect, useMemo } from "react";
import Link from "next/link";
import { Copy, MessageCircleMore } from "lucide-react";
import { toast } from "sonner";
import {
  buildReferenceOnlyFollowupMessage,
  buildMessengerContinueUrl,
  formatPlanLabel,
} from "@/lib/apply/messenger";
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

export function ApplySuccess({
  messengerPageUrl,
  paymentOption,
  plan,
  referenceCode,
}: ApplySuccessProps) {
  const storedPayload = useMemo(() => readStoredSuccessPayload(referenceCode), [referenceCode]);

  useEffect(() => {
    window.sessionStorage.removeItem(APPLY_SUCCESS_STORAGE_KEY);
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
    // Auto-copy the full followup message to clipboard first
    try {
      await navigator.clipboard.writeText(followupMessage);
      toast.success("Message copied! Opening Messenger…");
    } catch {
      // Non-fatal — still open Messenger
    }
    if (messengerUrl) {
      window.open(messengerUrl, "_blank", "noreferrer");
    }
  }

  const planLabel = formatPlanLabel(displayPlan);
  const paymentLabel = getPaymentOptionLabel(
    (displayPaymentOption as "gcash" | "maya" | null | undefined) ?? null,
  );

  return (
    <div className="as-shell">
      {/* Confetti particles */}
      <div className="as-confetti" aria-hidden="true">
        {Array.from({ length: 20 }).map((_, i) => (
          <div key={i} className={`as-confetti-piece as-confetti-piece--${(i % 5) + 1}`} />
        ))}
      </div>

      {/* ── Main card ── */}
      <div className="as-card">
        {/* Gold checkmark icon */}
        <div className="as-icon-wrap">
          <div className="as-icon-circle">
            <span className="as-icon-check">✓</span>
          </div>
        </div>

        {/* Heading */}
        <h1 className="as-title">Application Received!</h1>
        <p className="as-subtitle">
          Congratulations on your upcoming wedding 💍
          <br />
          We&apos;ll confirm your{" "}
          <strong>{planLabel ? `${planLabel} plan` : "plan"}</strong> and next steps on Messenger.
        </p>

        {/* Reference code box */}
        <div className="as-ref-section">
          <p className="as-ref-label">YOUR REFERENCE CODE</p>
          <div className="as-ref-box">
            <span className="as-ref-code">{referenceCode ?? "Not available"}</span>
            <button
              type="button"
              className="as-ref-copy-btn"
              onClick={() => void copyReference()}
              disabled={!referenceCode}
            >
              <Copy className="as-ref-copy-icon" />
              Copy
            </button>
          </div>
          <p className="as-ref-hint">Save this code — you&apos;ll need it when messaging us.</p>
        </div>

        {/* Meta info */}
        {(planLabel || paymentLabel) && (
          <div className="as-meta-row">
            {planLabel && (
              <div className="as-meta-item">
                <span className="as-meta-label">Plan</span>
                <span className="as-meta-value">{planLabel}</span>
              </div>
            )}
            {paymentLabel && (
              <div className="as-meta-item">
                <span className="as-meta-label">Payment</span>
                <span className="as-meta-value">{paymentLabel}</span>
              </div>
            )}
          </div>
        )}

        {/* What happens next */}
        <div className="as-next-section">
          <p className="as-next-label">WHAT HAPPENS NEXT</p>
          <ol className="as-next-list">
            <li className="as-next-item">
              <span className="as-next-num">1</span>
              <span>We&apos;ll message you on Messenger within 1–2 business days.</span>
            </li>
            <li className="as-next-item">
              <span className="as-next-num">2</span>
              <span>Send your payment and we&apos;ll confirm your slot.</span>
            </li>
            <li className="as-next-item">
              <span className="as-next-num">3</span>
              <span>We&apos;ll build your wedding website and RSVP system.</span>
            </li>
          </ol>
        </div>

        {/* Copyable follow-up message block */}
        <div className="as-message-section">
          <p className="as-message-label">YOUR MESSAGE FOR MESSENGER</p>
          <p className="as-message-hint">
            Copy this message before opening Messenger so your reference is easy to share.
          </p>
          <pre className="as-message-pre">{followupMessage}</pre>
          <button
            type="button"
            className="as-copy-msg-btn"
            onClick={() => void copyFollowupMessage()}
          >
            <Copy className="as-copy-msg-icon" />
            Copy message
          </button>
        </div>

        {/* Continue on Messenger button */}
        {messengerUrl ? (
          <button
            type="button"
            className="as-messenger-btn"
            onClick={() => void handleContinueOnMessenger()}
          >
            <MessageCircleMore className="as-messenger-icon" />
            Continue on Messenger
          </button>
        ) : null}

        {/* Back link */}
        <div className="as-footer">
          <Link href="/apply" className="as-back-link">
            ← Back to Apply
          </Link>
        </div>
      </div>

      {/* Footer */}
      <p className="as-page-footer">© 2024 WebSerbisyo RSVP · Made with love for Filipino couples</p>
    </div>
  );
}

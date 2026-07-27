"use client";

import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2, LockKeyhole, CheckCircle2, AlertCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

export function AuthConfirmClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") ?? "recovery";
  const intent = searchParams.get("intent") ?? "password_recovery";
  const isSetup = intent === "password_setup";

  const [status, setStatus] = useState<"idle" | "verifying" | "invalid">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleVerify() {
    if (!tokenHash) {
      setStatus("invalid");
      setErrorMessage("No security token was provided.");
      return;
    }

    setStatus("verifying");
    setErrorMessage(null);

    const supabase = createClient();
    const { data, error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: type === "email" ? "email" : "recovery",
    });

    if (error || !data.session) {
      setStatus("invalid");
      setErrorMessage(
        error?.message || "This secure link has expired or is no longer valid.",
      );
      return;
    }

    const targetUrl = isSetup
      ? `/reset-password?intent=password_setup`
      : `/reset-password`;

    router.replace(targetUrl);
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-amber-500/20 bg-amber-950/20 p-5 text-center">
        <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-full bg-amber-500/10 text-amber-400">
          <LockKeyhole className="size-6" />
        </div>
        <h2 className="text-lg font-semibold text-white">
          {isSetup ? "Set Up Your Password" : "Reset Your Password"}
        </h2>
        <p className="mt-1 text-sm text-white/70">
          {isSetup
            ? "Click the button below to securely continue to password creation for your WebSerbisyo RSVP dashboard."
            : "Click the button below to securely verify your identity and reset your password."}
        </p>
      </div>

      {status === "invalid" ? (
        <div className="space-y-3 rounded-xl border border-red-500/20 bg-red-950/20 p-4 text-sm text-red-200">
          <div className="flex items-center gap-2 font-medium text-red-400">
            <AlertCircle className="size-4" />
            <span>{errorMessage || "This secure link has expired or is no longer valid."}</span>
          </div>
          <p className="text-xs text-white/70">
            Secure links can only be used once. If you need a new link, please request one from the forgot password page.
          </p>
          <Link
            href="/forgot-password"
            className="inline-block pt-1 font-medium text-amber-400 underline underline-offset-4 hover:text-amber-300"
          >
            Request a new secure link
          </Link>
        </div>
      ) : (
        <Button
          type="button"
          disabled={status === "verifying"}
          onClick={handleVerify}
          className="w-full h-12 bg-amber-500 font-semibold text-neutral-950 hover:bg-amber-400 focus-visible:ring-amber-400"
        >
          {status === "verifying" ? (
            <span className="flex items-center gap-2">
              <Loader2 className="size-4 animate-spin" />
              Verifying secure link…
            </span>
          ) : isSetup ? (
            "Create My Password"
          ) : (
            "Reset My Password"
          )}
        </Button>
      )}
    </div>
  );
}

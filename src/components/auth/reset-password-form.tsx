"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Eye, EyeOff, Loader2, LockKeyhole } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type RecoveryState = "checking" | "invalid" | "ready" | "success";

export function ResetPasswordForm() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [recoveryState, setRecoveryState] = useState<RecoveryState>("checking");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function checkExistingSession() {
      const { data } = await supabase.auth.getSession();
      if (isMounted && data.session) {
        setRecoveryState("ready");
      }
    }

    void checkExistingSession();

    const invalidTimer = window.setTimeout(() => {
      if (isMounted) {
        setRecoveryState((current) => (current === "checking" ? "invalid" : current));
      }
    }, 5_000);

    const { data: subscription } = supabase.auth.onAuthStateChange((event, session) => {
      if (isMounted && (event === "PASSWORD_RECOVERY" || (event === "SIGNED_IN" && session))) {
        window.clearTimeout(invalidTimer);
        setRecoveryState("ready");
      }
    });

    return () => {
      isMounted = false;
      window.clearTimeout(invalidTimer);
      subscription.subscription.unsubscribe();
    };
  }, [supabase]);

  async function handleSubmit(formData: FormData) {
    if (recoveryState !== "ready") {
      return;
    }

    const nextPassword = String(formData.get("password") ?? "");
    const nextConfirmPassword = String(formData.get("confirmPassword") ?? "");

    if (nextPassword.length < 12) {
      toast.error("Use at least 12 characters for your new password.");
      return;
    }

    if (nextPassword !== nextConfirmPassword) {
      toast.error("Your passwords do not match.");
      return;
    }

    setIsSubmitting(true);
    const { error } = await supabase.auth.updateUser({ password: nextPassword });

    if (error) {
      setIsSubmitting(false);
      toast.error("This secure link has expired or is no longer valid.");
      return;
    }

    setPassword("");
    setConfirmPassword("");
    setRecoveryState("success");

    const { error: signOutError } = await supabase.auth.signOut({ scope: "local" });

    if (signOutError) {
      setIsSubmitting(false);
      toast.error("Your password changed, but the recovery session could not be closed safely.");
      return;
    }

    toast.success("Password updated successfully. Sign in using your new password.");
    router.replace("/login?message=password_updated");
    router.refresh();
  }

  const isReady = recoveryState === "ready";

  return (
    <div className="space-y-5">
      <p className="text-sm leading-6 text-white/78">
        Set a secure password for your WebSerbisyo RSVP dashboard.
      </p>

      <div aria-live="polite" aria-atomic="true">
        {recoveryState === "checking" ? (
          <div className="flex items-center gap-2 rounded-xl bg-white/10 px-4 py-3 text-sm text-white/88">
            <Loader2 className="size-4 animate-spin" />
            Verifying your secure link…
          </div>
        ) : null}

        {recoveryState === "invalid" ? (
          <div className="space-y-3 rounded-xl bg-white/10 px-4 py-3 text-sm text-white/88">
            <p>This secure link has expired or is no longer valid.</p>
            <Link href="/forgot-password" className="font-medium underline underline-offset-4">
              Request a new secure link
            </Link>
          </div>
        ) : null}

        {recoveryState === "success" ? (
          <p className="rounded-xl bg-white/10 px-4 py-3 text-sm text-white/88">
            Password updated successfully. Redirecting to sign in…
          </p>
        ) : null}
      </div>

      <form
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          void handleSubmit(new FormData(event.currentTarget));
        }}
      >
        <PasswordField
          id="reset-password"
          label="New password"
          name="password"
          value={password}
          visible={showPassword}
          disabled={!isReady || isSubmitting}
          onChange={setPassword}
          onToggle={() => setShowPassword((current) => !current)}
        />

        <PasswordField
          id="reset-confirm-password"
          label="Confirm password"
          name="confirmPassword"
          value={confirmPassword}
          visible={showConfirmPassword}
          disabled={!isReady || isSubmitting}
          onChange={setConfirmPassword}
          onToggle={() => setShowConfirmPassword((current) => !current)}
        />

        <p className="text-xs leading-5 text-white/68">
          Use at least 12 characters. A longer, unique passphrase is recommended.
        </p>

        <Button type="submit" size="lg" className="h-11 w-full" disabled={!isReady || isSubmitting}>
          {isSubmitting ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <ArrowRight className="size-4" />
          )}
          {isSubmitting ? "Updating password..." : "Update password"}
        </Button>
      </form>

      <div className="text-center text-sm text-white/72">
        <Link href="/login" className="font-medium text-white underline underline-offset-4">
          Back to sign in
        </Link>
      </div>
    </div>
  );
}

function PasswordField(input: {
  disabled: boolean;
  id: string;
  label: string;
  name: string;
  onChange: (value: string) => void;
  onToggle: () => void;
  value: string;
  visible: boolean;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={input.id} className="text-white">
        {input.label}
      </Label>
      <div className="group relative">
        <LockKeyhole className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-500 transition-colors group-focus-within:text-slate-700" />
        <Input
          id={input.id}
          name={input.name}
          type={input.visible ? "text" : "password"}
          autoComplete="new-password"
          required
          value={input.value}
          onChange={(event) => input.onChange(event.currentTarget.value)}
          disabled={input.disabled}
          className="cn-glass-autofill h-11 border-white/40 bg-white/60 pr-11 pl-10 text-slate-900 shadow-sm placeholder:text-slate-500 hover:bg-white/80 focus-visible:border-white/60 focus-visible:bg-white/90 focus-visible:ring-2 focus-visible:ring-slate-900/10"
        />
        <button
          type="button"
          aria-label={
            input.visible
              ? `Hide ${input.label.toLowerCase()}`
              : `Show ${input.label.toLowerCase()}`
          }
          disabled={input.disabled}
          onClick={input.onToggle}
          className="absolute top-1/2 right-3 -translate-y-1/2 text-slate-600 hover:text-slate-900 disabled:opacity-50"
        >
          {input.visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </button>
      </div>
    </div>
  );
}

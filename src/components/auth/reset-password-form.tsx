"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2, LockKeyhole } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ResetPasswordForm() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [ready, setReady] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let mounted = true;

    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();

      if (mounted) {
        setReady(Boolean(data.session));
      }
    };

    void checkSession();

    const { data: subscription } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") {
        setReady(Boolean(session));
      }
    });

    return () => {
      mounted = false;
      subscription.subscription.unsubscribe();
    };
  }, [supabase]);

  async function handleSubmit(formData: FormData) {
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
    setIsSubmitting(false);

    if (error) {
      toast.error("Your password could not be updated. Request a new reset email and try again.");
      return;
    }

    toast.success("Password updated. You can now sign in to your dashboard.");
    router.replace("/login?next=/dashboard");
    router.refresh();
  }

  return (
    <div className="space-y-5">
      <p className="text-sm leading-6 text-white/78">
        Set a new password for your WebSerbisyo RSVP dashboard account.
      </p>

      {!ready ? (
        <div className="rounded-xl bg-white/10 px-4 py-3 text-sm text-white/88">
          Open this page from your reset email to continue. If the link expired, request a new one
          from Forgot password.
        </div>
      ) : null}

      <form
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          void handleSubmit(new FormData(event.currentTarget));
        }}
      >
        <div className="space-y-2">
          <Label htmlFor="reset-password" className="text-white">
            New password
          </Label>
          <div className="group relative">
            <LockKeyhole className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-500 transition-colors group-focus-within:text-slate-700" />
            <Input
              id="reset-password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              value={password}
              onChange={(event) => setPassword(event.currentTarget.value)}
              disabled={!ready || isSubmitting}
              className="cn-glass-autofill h-11 border-white/40 bg-white/60 pl-10 text-slate-900 shadow-sm placeholder:text-slate-500 hover:bg-white/80 focus-visible:border-white/60 focus-visible:bg-white/90 focus-visible:ring-2 focus-visible:ring-slate-900/10"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="reset-confirm-password" className="text-white">
            Confirm password
          </Label>
          <div className="group relative">
            <LockKeyhole className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-500 transition-colors group-focus-within:text-slate-700" />
            <Input
              id="reset-confirm-password"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              required
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.currentTarget.value)}
              disabled={!ready || isSubmitting}
              className="cn-glass-autofill h-11 border-white/40 bg-white/60 pl-10 text-slate-900 shadow-sm placeholder:text-slate-500 hover:bg-white/80 focus-visible:border-white/60 focus-visible:bg-white/90 focus-visible:ring-2 focus-visible:ring-slate-900/10"
            />
          </div>
        </div>

        <Button type="submit" size="lg" className="h-11 w-full" disabled={!ready || isSubmitting}>
          {isSubmitting ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <ArrowRight className="size-4" />
          )}
          {isSubmitting ? "Saving password..." : "Save new password"}
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

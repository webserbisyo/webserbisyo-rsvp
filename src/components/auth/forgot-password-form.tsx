"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { ArrowRight, Loader2, Mail } from "lucide-react";
import { toast } from "sonner";
import { requestPasswordResetAction } from "@/server/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await requestPasswordResetAction(formData);

      if (!result.ok) {
        toast.error(result.error);
        return;
      }

      setMessage(result.data.message);
      toast.success(result.data.message);
    });
  }

  return (
    <div className="space-y-5">
      <p className="text-sm leading-6 text-white/78">
        Enter your dashboard email and we&apos;ll send a reset link if the account is active.
      </p>

      {message ? (
        <p className="rounded-xl bg-white/10 px-4 py-3 text-sm text-white">{message}</p>
      ) : null}

      <form
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          handleSubmit(new FormData(event.currentTarget));
        }}
      >
        <div className="space-y-2">
          <Label htmlFor="forgot-email" className="text-white">
            Dashboard email
          </Label>
          <div className="group relative">
            <Mail className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-500 transition-colors group-focus-within:text-slate-700" />
            <Input
              id="forgot-email"
              name="email"
              type="email"
              autoComplete="email"
              inputMode="email"
              required
              value={email}
              onChange={(event) => setEmail(event.currentTarget.value)}
              placeholder="you@example.com"
              disabled={isPending}
              className="cn-glass-autofill h-11 border-white/40 bg-white/60 pl-10 text-slate-900 shadow-sm placeholder:text-slate-500 hover:bg-white/80 focus-visible:border-white/60 focus-visible:bg-white/90 focus-visible:ring-2 focus-visible:ring-slate-900/10"
            />
          </div>
        </div>

        <Button type="submit" size="lg" className="h-11 w-full" disabled={isPending}>
          {isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <ArrowRight className="size-4" />
          )}
          {isPending ? "Sending reset link..." : "Send reset link"}
        </Button>
      </form>

      <div className="text-center text-sm text-white/72">
        Remembered your password?{" "}
        <Link href="/login" className="font-medium text-white underline underline-offset-4">
          Back to sign in
        </Link>
      </div>
    </div>
  );
}

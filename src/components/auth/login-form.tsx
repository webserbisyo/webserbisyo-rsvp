"use client";

import Link from "next/link";
import { useActionState, useEffect } from "react";
import { ArrowRight, Loader2, LockKeyhole, Mail } from "lucide-react";
import { toast } from "sonner";
import {
  getAuthRedirectErrorMessage,
} from "@/lib/auth/redirects";
import { createClient } from "@/lib/supabase/client";
import { loginAction, type LoginActionState } from "@/server/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type LoginFormProps = {
  initialErrorCode?: string;
  nextPath?: string | null;
  signOutOnMount?: boolean;
};

const INITIAL_LOGIN_STATE: LoginActionState = {
  error: null,
};

export function LoginForm({ initialErrorCode, nextPath, signOutOnMount = false }: LoginFormProps) {
  const initialMessage = getAuthRedirectErrorMessage(initialErrorCode);
  const [state, formAction, isPending] = useActionState(loginAction, INITIAL_LOGIN_STATE);

  useEffect(() => {
    if (signOutOnMount) {
      const supabase = createClient();
      void supabase.auth.signOut();
    }
  }, [signOutOnMount]);

  useEffect(() => {
    if (initialMessage) {
      toast.error(initialMessage);
    }
  }, [initialMessage]);

  useEffect(() => {
    if (state.error) {
      toast.error(state.error);
    }
  }, [state.error]);

  return (
    <div className="space-y-5">
      <p className="sr-only" aria-live="assertive" aria-atomic="true">
        {state.error ?? initialMessage}
      </p>

      <form action={formAction} method="post" className="space-y-4">
        <input type="hidden" name="next" value={nextPath ?? ""} />

        <div className="space-y-2">
          <Label htmlFor="email" className="text-white">
            Email
          </Label>
          <div className="group relative">
            <Mail className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-500 transition-colors group-focus-within:text-slate-700" />
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              inputMode="email"
              required
              placeholder="you@example.com"
              disabled={isPending}
              className="cn-glass-autofill h-11 border-white/40 bg-white/60 pl-10 text-slate-900 shadow-sm placeholder:text-slate-500 hover:bg-white/80 focus-visible:border-white/60 focus-visible:bg-white/90 focus-visible:ring-2 focus-visible:ring-slate-900/10"
            />
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            <Label htmlFor="password" className="text-white">
              Password
            </Label>
            <Link
              href="/forgot-password"
              className="text-xs font-medium text-white/78 underline underline-offset-4 hover:text-white"
            >
              Forgot password?
            </Link>
          </div>
          <div className="group relative">
            <LockKeyhole className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-500 transition-colors group-focus-within:text-slate-700" />
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              placeholder="Enter your password"
              disabled={isPending}
              className="cn-glass-autofill h-11 border-white/40 bg-white/60 pl-10 text-slate-900 shadow-sm placeholder:text-slate-500 hover:bg-white/80 focus-visible:border-white/60 focus-visible:bg-white/90 focus-visible:ring-2 focus-visible:ring-slate-900/10"
            />
          </div>
        </div>

        {state.error ? (
          <p className="rounded-xl border border-red-300/30 bg-red-500/15 px-4 py-3 text-sm text-white">
            {state.error}
          </p>
        ) : null}

        <Button type="submit" size="lg" className="h-11 w-full" disabled={isPending}>
          {isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <ArrowRight className="size-4" />
          )}
          {isPending ? "Signing in..." : "Sign in"}
        </Button>
      </form>

      <p className="text-center text-xs leading-5 text-white/62">
        Use the email linked to your WebSerbisyo RSVP dashboard to continue.
      </p>
    </div>
  );
}

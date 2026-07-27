"use client";

import Link from "next/link";
import { useActionState, useEffect, useState } from "react";
import { ArrowRight, Eye, EyeOff, Loader2, LockKeyhole, Mail } from "lucide-react";
import { toast } from "sonner";
import {
  GOOGLE_AUTH_ENABLED,
  getGoogleOAuthCallbackUrl,
} from "@/lib/auth/google-oauth";
import { getAuthRedirectErrorMessage } from "@/lib/auth/redirects";
import { createClient } from "@/lib/supabase/client";
import { loginAction, type LoginActionState } from "@/server/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type LoginFormProps = {
  initialErrorCode?: string;
  initialSuccessMessage?: string | null;
  nextPath?: string | null;
  signOutOnMount?: boolean;
};

const INITIAL_LOGIN_STATE: LoginActionState = {
  error: null,
};

export function LoginForm({
  initialErrorCode,
  initialSuccessMessage,
  nextPath,
  signOutOnMount = false,
}: LoginFormProps) {
  const initialMessage = getAuthRedirectErrorMessage(initialErrorCode);
  const [state, formAction, isPending] = useActionState(loginAction, INITIAL_LOGIN_STATE);
  const [isGooglePending, setIsGooglePending] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [googleError, setGoogleError] = useState<string | null>(null);
  const isBusy = isPending || isGooglePending;
  const visibleError = state.error ?? googleError ?? initialMessage;

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
    if (initialSuccessMessage) {
      toast.success(initialSuccessMessage);
    }
  }, [initialSuccessMessage]);

  useEffect(() => {
    if (state.error) {
      toast.error(state.error);
    }
  }, [state.error]);

  useEffect(() => {
    if (googleError) {
      toast.error(googleError);
    }
  }, [googleError]);

  async function handleGoogleSignIn() {
    if (!GOOGLE_AUTH_ENABLED || isBusy) {
      return;
    }

    setGoogleError(null);
    setIsGooglePending(true);

    try {
      const intentResponse = await fetch("/api/auth/google-intent", {
        cache: "no-store",
        credentials: "same-origin",
        method: "POST",
      });

      if (!intentResponse.ok) {
        throw new Error("Google sign-in intent could not be created.");
      }

      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: getGoogleOAuthCallbackUrl(nextPath),
          queryParams: {
            prompt: "select_account",
          },
        },
      });

      if (error) {
        throw error;
      }
    } catch {
      setGoogleError("Google sign-in could not be started. Please try again or use email and password.");
      setIsGooglePending(false);
    }
  }

  return (
    <div className="space-y-5">
      <p className="sr-only" aria-live="assertive" aria-atomic="true">
        {isGooglePending ? "Redirecting to Google…" : visibleError ?? initialSuccessMessage}
      </p>

      {initialSuccessMessage ? (
        <p className="rounded-xl border border-emerald-200/30 bg-emerald-500/15 px-4 py-3 text-sm text-white">
          {initialSuccessMessage}
        </p>
      ) : null}

      {GOOGLE_AUTH_ENABLED ? (
        <>
          <Button
            type="button"
            variant="outline"
            size="lg"
            className="h-11 w-full border-white/40 bg-white text-slate-900 hover:bg-slate-100 focus-visible:ring-white/80"
            disabled={isBusy}
            aria-busy={isGooglePending}
            onClick={handleGoogleSignIn}
          >
            {isGooglePending ? <Loader2 className="size-4 animate-spin" /> : <GoogleMark />}
            {isGooglePending ? "Redirecting to Google..." : "Sign in with Google"}
          </Button>

          <div className="flex items-center gap-3" aria-hidden="true">
            <div className="h-px flex-1 bg-white/35" />
            <span className="shrink-0 text-xs font-medium tracking-wide text-white/70">or</span>
            <div className="h-px flex-1 bg-white/35" />
          </div>
        </>
      ) : null}

      <form action={formAction} className="space-y-4">
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
              disabled={isBusy}
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
              type={isPasswordVisible ? "text" : "password"}
              autoComplete="current-password"
              required
              placeholder="Enter your password"
              disabled={isBusy}
              className="cn-glass-autofill h-11 border-white/40 bg-white/60 pr-11 pl-10 text-slate-900 shadow-sm placeholder:text-slate-500 hover:bg-white/80 focus-visible:border-white/60 focus-visible:bg-white/90 focus-visible:ring-2 focus-visible:ring-slate-900/10"
            />
            <button
              type="button"
              className="absolute top-1/2 right-2 inline-flex size-8 -translate-y-1/2 items-center justify-center rounded-md text-slate-700 hover:bg-slate-200/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/30 disabled:cursor-not-allowed disabled:opacity-50"
              aria-label={isPasswordVisible ? "Hide password" : "Show password"}
              disabled={isBusy}
              onClick={() => setIsPasswordVisible((visible) => !visible)}
            >
              {isPasswordVisible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
        </div>

        {visibleError ? (
          <p className="rounded-xl border border-red-300/30 bg-red-500/15 px-4 py-3 text-sm text-white">
            {visibleError}
          </p>
        ) : null}

        <Button type="submit" size="lg" className="h-11 w-full" disabled={isBusy}>
          {isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <ArrowRight className="size-4" />
          )}
          {isPending ? "Signing in..." : "Sign in"}
        </Button>
      </form>

      <p className="text-center text-xs leading-5 text-white/62">
        First time here? Use the approved email connected to your WebSerbisyo dashboard. If your setup
        link expired, request a new secure link through Forgot password.
      </p>
    </div>
  );
}

function GoogleMark() {
  return (
    <svg aria-hidden="true" className="size-4" viewBox="0 0 24 24">
      <path
        fill="#4285F4"
        d="M21.8 12.2c0-.7-.1-1.3-.2-1.9H12v3.6h5.5a4.7 4.7 0 0 1-2 3.1v2.4h3.2c1.9-1.8 3.1-4.3 3.1-7.2Z"
      />
      <path
        fill="#34A853"
        d="M12 22c2.7 0 5-.9 6.7-2.5l-3.2-2.4c-.9.6-2 .9-3.5.9-2.7 0-5-1.8-5.8-4.3H2.9V16A10 10 0 0 0 12 22Z"
      />
      <path
        fill="#FBBC05"
        d="M6.2 13.7A6 6 0 0 1 5.9 12c0-.6.1-1.2.3-1.7V7.9H2.9A10 10 0 0 0 2 12c0 1.5.4 2.9.9 4.1l3.3-2.4Z"
      />
      <path
        fill="#EA4335"
        d="M12 6c1.6 0 3 .5 4.1 1.6l3.1-3.1C17 2.9 14.7 2 12 2A10 10 0 0 0 2.9 7.9l3.3 2.4C7 7.8 9.3 6 12 6Z"
      />
    </svg>
  );
}

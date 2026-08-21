"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useState } from "react";
import { useGoogleLogin } from "@react-oauth/google";
import { ArrowRight, Eye, EyeOff, Loader2, LockKeyhole, Mail } from "lucide-react";
import { toast } from "sonner";
import { GOOGLE_AUTH_ENABLED } from "@/lib/auth/google-oauth";
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
  const router = useRouter();
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

  const loginWithGoogle = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setIsGooglePending(true);
      setGoogleError(null);

      try {
        const supabase = createClient();
        const token = (tokenResponse as { credential?: string }).credential || tokenResponse.access_token;
        const { error } = await supabase.auth.signInWithIdToken({
          provider: "google",
          token: token,
          access_token: tokenResponse.access_token,
        });

        if (error) {
          throw error;
        }

        toast.success("Signed in successfully with Google.");
        router.push(nextPath || "/dashboard");
        router.refresh();
      } catch (err) {
        setGoogleError(
          err instanceof Error ? err.message : "Google sign-in could not be completed.",
        );
        setIsGooglePending(false);
      }
    },
    onError: () => {
      setGoogleError("Google sign-in was cancelled or failed. Please try again.");
      setIsGooglePending(false);
    },
  });

  return (
    <div className="space-y-5">
      <p className="sr-only" aria-live="assertive" aria-atomic="true">
        {isGooglePending ? "Connecting to Google…" : visibleError ?? initialSuccessMessage}
      </p>

      {initialSuccessMessage ? (
        <p className="rounded-xl border border-emerald-200/30 bg-emerald-500/15 px-4 py-3 text-sm text-white">
          {initialSuccessMessage}
        </p>
      ) : null}

      {GOOGLE_AUTH_ENABLED ? (
        <>
          <button
            type="button"
            onClick={() => {
              setGoogleError(null);
              loginWithGoogle();
            }}
            disabled={isBusy}
            aria-busy={isGooglePending}
            className="flex h-11 w-full items-center justify-center gap-3 rounded-xl border border-slate-700/80 bg-slate-900/90 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:border-slate-600 hover:bg-slate-800/90 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 disabled:pointer-events-none disabled:opacity-50"
          >
            {isGooglePending ? (
              <Loader2 className="size-4 animate-spin text-slate-300" />
            ) : (
              <svg className="size-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
            )}
            <span>{isGooglePending ? "Connecting to Google..." : "Continue with Google"}</span>
          </button>

          <div className="flex items-center gap-3" aria-hidden="true">
            <div className="h-px flex-1 bg-white/20" />
            <span className="shrink-0 text-xs font-medium tracking-wide text-white/60">or</span>
            <div className="h-px flex-1 bg-white/20" />
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

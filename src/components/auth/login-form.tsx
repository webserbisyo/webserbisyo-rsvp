"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useState } from "react";
import { GoogleLogin } from "@react-oauth/google";
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

  async function handleGoogleCredentialSuccess(credential: string) {
    setIsGooglePending(true);
    setGoogleError(null);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithIdToken({
        provider: "google",
        token: credential,
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
  }

  return (
    <div className="space-y-5">
      <p className="sr-only" aria-live="assertive" aria-atomic="true">
        {isGooglePending ? "Signing in with Google…" : visibleError ?? initialSuccessMessage}
      </p>

      {initialSuccessMessage ? (
        <p className="rounded-xl border border-emerald-200/30 bg-emerald-500/15 px-4 py-3 text-sm text-white">
          {initialSuccessMessage}
        </p>
      ) : null}

      {GOOGLE_AUTH_ENABLED ? (
        <>
          <div className="flex w-full flex-col items-center justify-center overflow-hidden rounded-xl bg-white p-0.5 shadow-sm">
            {isGooglePending ? (
              <div className="flex h-10 w-full items-center justify-center gap-2 text-sm font-medium text-slate-800">
                <Loader2 className="size-4 animate-spin text-slate-700" />
                Signing in with Google…
              </div>
            ) : (
              <div className="w-full">
                <GoogleLogin
                  onSuccess={(credentialResponse) => {
                    if (credentialResponse.credential) {
                      void handleGoogleCredentialSuccess(credentialResponse.credential);
                    } else {
                      setGoogleError("Google did not return valid credentials.");
                    }
                  }}
                  onError={() => {
                    setGoogleError("Google sign-in was cancelled or failed.");
                  }}
                  theme="outline"
                  size="large"
                  width="100%"
                  text="signin_with"
                  shape="rectangular"
                />
              </div>
            )}
          </div>

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

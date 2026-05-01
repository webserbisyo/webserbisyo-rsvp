"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2, LockKeyhole, Mail } from "lucide-react";
import { toast } from "sonner";
import {
  getAuthRedirectErrorMessage,
  getProfileLookupResult,
  mapSignInErrorMessage,
  resolvePostLoginPath,
} from "@/lib/auth/redirects";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

type LoginFormProps = {
  initialErrorCode?: string;
  nextPath?: string | null;
  signOutOnMount?: boolean;
};

export function LoginForm({ initialErrorCode, nextPath, signOutOnMount = false }: LoginFormProps) {
  const router = useRouter();
  const initialMessage = getAuthRedirectErrorMessage(initialErrorCode);
  const [liveMessage, setLiveMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);

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

  async function handleSubmit(formData: FormData) {
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");

    setIsSubmitting(true);
    setIsRedirecting(false);
    setLiveMessage(null);

    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      const message = mapSignInErrorMessage(signInError.message);
      setLiveMessage(message);
      toast.error(message);
      setIsSubmitting(false);
      return;
    }

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      const message = "Your session could not be verified after sign-in. Please try again.";
      setLiveMessage(message);
      toast.error(message);
      setIsSubmitting(false);
      return;
    }

    const profileLookup = await getProfileLookupResult(supabase, user.id);

    if (profileLookup.status !== "ok") {
      await supabase.auth.signOut();

      const message =
        getAuthRedirectErrorMessage(profileLookup.status) ??
        "Your account could not be validated. Please try again.";

      setLiveMessage(message);
      toast.error(message);
      setIsSubmitting(false);
      return;
    }

    const destination = resolvePostLoginPath(profileLookup.profile, nextPath);

    setIsRedirecting(true);
    setIsSubmitting(false);
    toast.success("Signed in successfully.");
    router.replace(destination);
    router.refresh();
  }

  return (
    <div className="space-y-5">
      <p className="sr-only" aria-live="assertive" aria-atomic="true">
        {liveMessage ?? initialMessage}
      </p>

      <form
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          void handleSubmit(new FormData(event.currentTarget));
        }}
      >
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
              disabled={isSubmitting}
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
              disabled={isSubmitting}
              className="cn-glass-autofill h-11 border-white/40 bg-white/60 pl-10 text-slate-900 shadow-sm placeholder:text-slate-500 hover:bg-white/80 focus-visible:border-white/60 focus-visible:bg-white/90 focus-visible:ring-2 focus-visible:ring-slate-900/10"
            />
          </div>
        </div>

        <Button
          type="submit"
          size="lg"
          className="h-11 w-full"
          disabled={isSubmitting || isRedirecting}
        >
          {isSubmitting ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <ArrowRight className="size-4" />
          )}
          {isRedirecting ? "Redirecting..." : isSubmitting ? "Signing in..." : "Sign in"}
        </Button>
      </form>

      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <Separator className="bg-white/12" />
          <span className="text-xs font-medium tracking-[0.18em] whitespace-nowrap text-white/48 uppercase">
            Coming soon
          </span>
          <Separator className="bg-white/12" />
        </div>

        {/* TODO: Google OAuth — configure provider in Supabase dashboard first. */}
        <p className="text-center text-xs leading-5 text-white/62">
          Google sign-in is deferred until the Supabase Google provider and callback settings are
          confirmed for this project.
        </p>
      </div>
    </div>
  );
}

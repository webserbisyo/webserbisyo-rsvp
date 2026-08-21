import { Suspense } from "react";
import { LoginForm } from "@/components/auth/login-form";
import { AuthShell } from "@/components/auth/auth-shell";
import { AuthSessionGuard } from "@/components/auth/auth-session-guard";
import { getSafeNextPath } from "@/lib/auth/redirects";

type LoginPageProps = {
  searchParams: Promise<{
    error?: string;
    message?: string;
    next?: string;
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const nextPath = getSafeNextPath(params?.next);

  return (
    <AuthShell>
      <Suspense fallback={null}>
        <AuthSessionGuard nextPath={nextPath} />
      </Suspense>
      <LoginForm
        initialErrorCode={params?.error}
        initialSuccessMessage={
          params?.message === "password_updated"
            ? "Password updated successfully. Sign in using your new password."
            : null
        }
        nextPath={nextPath}
      />
    </AuthShell>
  );
}

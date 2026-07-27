import { redirect } from "next/navigation";
import { LoginForm } from "@/components/auth/login-form";
import { AuthShell } from "@/components/auth/auth-shell";
import {
  getProfileLookupResult,
  getSafeNextPath,
  resolvePostLoginPath,
} from "@/lib/auth/redirects";
import { createServerSupabaseClient } from "@/lib/supabase/server";

type LoginPageProps = {
  searchParams: Promise<{
    error?: string;
    message?: string;
    next?: string;
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const nextPath = getSafeNextPath(params.next);
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let initialErrorCode = params.error;
  let signOutOnMount = false;

  if (user) {
    const profileLookup = await getProfileLookupResult(supabase, user.id);

    if (profileLookup.status === "ok") {
      redirect(resolvePostLoginPath(profileLookup.profile, nextPath));
    }

    initialErrorCode = profileLookup.status;
    signOutOnMount = true;
  }

  return (
    <AuthShell>
      <LoginForm
        initialErrorCode={initialErrorCode}
        initialSuccessMessage={
          params.message === "password_updated"
            ? "Password updated successfully. Sign in using your new password."
            : null
        }
        nextPath={nextPath}
        signOutOnMount={signOutOnMount}
      />
    </AuthShell>
  );
}

import { redirect } from "next/navigation";
import { getProfileLookupResult, resolvePostLoginPath } from "@/lib/auth/redirects";
import { createServerSupabaseClient } from "@/lib/supabase/server";

type AuthSessionGuardProps = {
  nextPath?: string | null;
};

export async function AuthSessionGuard({ nextPath }: AuthSessionGuardProps) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const profileLookup = await getProfileLookupResult(supabase, user.id);

    if (profileLookup.status === "ok") {
      redirect(resolvePostLoginPath(profileLookup.profile, nextPath));
    }
  }

  return null;
}

import { NextResponse, type NextRequest } from "next/server";
import {
  getProfileLookupResult,
  getSafeNextPath,
  resolvePostLoginPath,
} from "@/lib/auth/redirects";
import { createRouteHandlerClient } from "@/lib/supabase/route";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const nextPath = getSafeNextPath(requestUrl.searchParams.get("next"));
  const response = NextResponse.redirect(new URL("/dashboard", requestUrl.origin));

  if (!code) {
    return NextResponse.redirect(new URL("/login", requestUrl.origin));
  }

  const supabase = createRouteHandlerClient(request, response);
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(new URL("/login?error=callback_failed", requestUrl.origin));
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(new URL("/login?error=callback_failed", requestUrl.origin));
  }

  const profileLookup = await getProfileLookupResult(supabase, user.id);

  if (profileLookup.status !== "ok") {
    await supabase.auth.signOut();
    response.headers.set(
      "Location",
      new URL(`/login?error=${profileLookup.status}`, requestUrl.origin).toString(),
    );

    return response;
  }

  response.headers.set(
    "Location",
    new URL(resolvePostLoginPath(profileLookup.profile, nextPath), requestUrl.origin).toString(),
  );

  return response;
}

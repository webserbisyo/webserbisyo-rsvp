import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { DashboardShell } from "@/components/dashboard/shell";
import type { Metadata } from "next";
import { SOCIAL_PREVIEWS } from "@/config/social-previews";
import { getSafeNextPath } from "@/lib/auth/redirects";
import { AuthenticationError, PermissionError, requireTenantMember } from "@/lib/permissions";
import { createServerSupabaseClient } from "@/lib/supabase/server";

type DashboardLayoutProps = {
  children: React.ReactNode;
};

export const metadata: Metadata = {
  description: SOCIAL_PREVIEWS.neutral.description,
  openGraph: {
    images: [],
  },
  robots: {
    follow: false,
    index: false,
  },
  title: `Dashboard | ${SOCIAL_PREVIEWS.neutral.title}`,
  twitter: {
    images: [],
  },
};

export default async function DashboardLayout({ children }: DashboardLayoutProps) {
  let profile: Awaited<ReturnType<typeof requireTenantMember>>;
  let planType: string | null = null;
  const loginRedirectPath = await getDashboardLoginRedirectPath();

  try {
    profile = await requireTenantMember();
  } catch (error) {
    if (error instanceof AuthenticationError) {
      redirect(`/login?next=${encodeURIComponent(loginRedirectPath)}`);
    }

    if (error instanceof PermissionError) {
      if (
        error.code === "client_inactive" ||
        error.code === "missing_client" ||
        error.code === "wrong_client"
      ) {
        redirect(
          `/login?error=${error.code === "client_inactive" ? "client_inactive" : "missing_profile"}`,
        );
      }

      redirect("/admin");
    }

    throw error;
  }

  const clientId = profile.client_id;

  if (!clientId) {
    throw new Error("Client tenant profile is missing client_id.");
  }

  const supabase = await createServerSupabaseClient();
  const { data: clientData } = await supabase
    .from("clients")
    .select("plan_type")
    .eq("id", clientId)
    .single();

  planType = clientData?.plan_type ?? null;

  return (
    <DashboardShell
      clientId={clientId}
      email={profile.email}
      displayName={profile.full_name ?? undefined}
      planType={planType}
      profileId={profile.id}
    >
      {children}
    </DashboardShell>
  );
}

async function getDashboardLoginRedirectPath() {
  const requestHeaders = await headers();
  const candidates = [
    buildPathWithQuery(
      requestHeaders.get("x-webserbisyo-original-path"),
      requestHeaders.get("x-webserbisyo-original-search"),
    ),
  ];

  for (const candidate of candidates) {
    const safePath = getSafeNextPath(candidate);

    if (safePath?.startsWith("/dashboard")) {
      return safePath;
    }
  }

  return "/dashboard";
}

function buildPathWithQuery(pathname: string | null, query: string | null) {
  if (!pathname) {
    return null;
  }

  if (!query) {
    return pathname;
  }

  const normalizedQuery = query.startsWith("?") ? query : `?${query}`;
  return `${pathname}${normalizedQuery}`;
}

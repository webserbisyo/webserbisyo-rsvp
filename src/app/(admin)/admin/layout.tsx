import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AdminShell } from "@/components/app-shell/admin-shell";
import { AuthenticationError, PermissionError, requireAdmin } from "@/lib/permissions";

type AdminLayoutProps = {
  children: React.ReactNode;
};

export const metadata: Metadata = {
  title: {
    default: "Admin · RSVP Admin",
    template: "%s · RSVP Admin",
  },
  robots: {
    follow: false,
    index: false,
  },
};

export default async function AdminLayout({ children }: AdminLayoutProps) {
  let profile: Awaited<ReturnType<typeof requireAdmin>>;

  try {
    profile = await requireAdmin();
  } catch (error) {
    if (error instanceof AuthenticationError) {
      redirect("/login?next=/admin");
    }

    if (error instanceof PermissionError) {
      redirect("/dashboard");
    }

    throw error;
  }

  return (
    <AdminShell
      profile={{
        email: profile.email,
        full_name: profile.full_name,
        role: profile.role,
      }}
    >
      {children}
    </AdminShell>
  );
}

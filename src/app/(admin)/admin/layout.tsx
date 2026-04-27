import { redirect } from "next/navigation";
import { AuthenticationError, PermissionError, requireAdmin } from "@/lib/permissions";

type AdminLayoutProps = {
  children: React.ReactNode;
};

export default async function AdminLayout({ children }: AdminLayoutProps) {
  try {
    await requireAdmin();
  } catch (error) {
    if (error instanceof AuthenticationError) {
      redirect("/login?next=/admin");
    }

    if (error instanceof PermissionError) {
      redirect("/dashboard");
    }

    throw error;
  }

  return <div className="bg-muted/30 min-h-screen">{children}</div>;
}

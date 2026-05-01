"use client";

import { usePathname } from "next/navigation";
import { getClientPageMeta } from "@/components/client-dashboard/navigation/client-nav-config";
import { ClientBreadcrumbs } from "./client-breadcrumbs";
import { ClientProfileMenu } from "./client-profile-menu";

type ClientTopbarProps = {
  clientName: string;
  email: string | null;
  fullName: string | null;
  role: string;
};

export function ClientTopbar({ clientName, email, fullName, role }: ClientTopbarProps) {
  const pathname = usePathname();
  const pageMeta = getClientPageMeta(pathname);

  return (
    <header className="client-topbar-glass sticky top-0 z-30">
      <div className="mx-auto flex h-[var(--client-topbar-height)] w-full max-w-[calc(var(--client-content-max-width)+4rem)] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <div className="min-w-0">
          <ClientBreadcrumbs />
          <p className="mt-1 truncate text-sm font-semibold text-[var(--client-text)] sm:text-base">
            {pageMeta.title}
          </p>
        </div>
        <ClientProfileMenu clientName={clientName} email={email} fullName={fullName} role={role} />
      </div>
    </header>
  );
}

"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { usePathname } from "next/navigation";
import { getClientPageMeta } from "@/components/client-dashboard/navigation/client-nav-config";

export function ClientBreadcrumbs() {
  const pathname = usePathname();
  const pageMeta = getClientPageMeta(pathname);
  const showLeaf = pathname !== "/dashboard";

  return (
    <nav aria-label="Breadcrumb" className="min-w-0">
      <ol className="flex min-w-0 items-center gap-2 text-xs font-medium tracking-[0.14em] text-[var(--client-text-soft)] uppercase">
        <li className="truncate">
          <Link
            href="/dashboard"
            className="client-focus-ring rounded-sm px-0.5 py-0.5 transition-colors hover:text-[var(--client-text)]"
          >
            Dashboard
          </Link>
        </li>
        {showLeaf ? (
          <>
            <li aria-hidden="true" className="shrink-0">
              <ChevronRight className="size-3.5" />
            </li>
            <li className="truncate text-[var(--client-text-muted)]">{pageMeta.breadcrumb}</li>
          </>
        ) : null}
      </ol>
    </nav>
  );
}

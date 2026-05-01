"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { getClientPageMeta } from "@/components/client-dashboard/navigation/client-nav-config";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

export function ClientBreadcrumbs() {
  const pathname = usePathname();
  const pageMeta = getClientPageMeta(pathname);
  const showLeaf = pathname !== "/dashboard";

  return (
    <Breadcrumb className="min-w-0">
      <BreadcrumbList className="min-w-0 gap-2 text-xs font-medium tracking-[0.14em] text-[var(--client-text-soft)] uppercase">
        <BreadcrumbItem className="min-w-0">
          <BreadcrumbLink asChild>
            <Link
              href="/dashboard"
              className="client-focus-ring rounded-sm px-0.5 py-0.5 hover:text-[var(--client-text)]"
            >
              Dashboard
            </Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        {showLeaf ? (
          <>
            <BreadcrumbSeparator className="text-[var(--client-text-soft)]" />
            <BreadcrumbItem className="min-w-0">
              <BreadcrumbPage className="truncate text-[var(--client-text-muted)]">
                {pageMeta.breadcrumb}
              </BreadcrumbPage>
            </BreadcrumbItem>
          </>
        ) : (
          <BreadcrumbItem className="sr-only">
            <BreadcrumbPage>Dashboard</BreadcrumbPage>
          </BreadcrumbItem>
        )}
      </BreadcrumbList>
    </Breadcrumb>
  );
}

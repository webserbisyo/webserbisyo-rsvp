"use client";

import { usePathname } from "next/navigation";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { dashboardNavItems } from "@/components/dashboard/nav-items";
import { useDashboardBreadcrumbDetail } from "./dashboard-breadcrumb-state";

export function DashboardBreadcrumb() {
  const pathname = usePathname();
  const detail = useDashboardBreadcrumbDetail();

  const currentItem = dashboardNavItems.find(
    (item) => item.href === pathname || (item.href !== "/dashboard" && pathname.startsWith(item.href)),
  );
  const label = currentItem?.label ?? "Home";
  const showDetail = pathname === "/dashboard/event" && detail;

  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbPage
            className="text-sm font-semibold"
            style={{ color: "var(--dash-foreground)" }}
          >
            {label}
          </BreadcrumbPage>
        </BreadcrumbItem>
        {showDetail ? (
          <>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage
                className="text-sm font-medium"
                style={{ color: "var(--dash-muted)" }}
              >
                {detail}
              </BreadcrumbPage>
            </BreadcrumbItem>
          </>
        ) : null}
      </BreadcrumbList>
    </Breadcrumb>
  );
}

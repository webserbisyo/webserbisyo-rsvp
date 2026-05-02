"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { dashboardNavItems, isDashboardNavItemActive } from "@/components/dashboard/nav-items";

export function DashboardMobileBottomNav() {
  const pathname = usePathname();
  const items = dashboardNavItems.slice(0, 5);

  return (
    <nav
      className="fixed right-0 bottom-0 left-0 z-50 border-t md:hidden"
      style={{
        background: "var(--dash-surface)",
        borderColor: "var(--dash-border)",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      <div className="flex h-14 items-center justify-around">
        {items.map((item) => {
          const active = isDashboardNavItemActive(pathname, item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-1 flex-col items-center gap-0.5 px-3 py-2"
              style={{ color: active ? "var(--dash-brand)" : "var(--dash-muted)" }}
            >
              <Icon className="h-5 w-5" />
              <span className="text-[10px] leading-none">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

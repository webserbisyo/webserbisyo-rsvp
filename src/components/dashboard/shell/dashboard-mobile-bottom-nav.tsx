"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { dashboardNavItems, isDashboardNavItemActive } from "@/components/dashboard/nav-items";
import { DashboardMoreDrawer } from "./dashboard-more-drawer";
import { LayoutGrid } from "lucide-react";

type DashboardMobileBottomNavProps = {
  email: string;
};

export function DashboardMobileBottomNav({ email }: DashboardMobileBottomNavProps) {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);
  const items = dashboardNavItems.slice(0, 4);

  return (
    <>
      <nav
        className="fixed right-0 bottom-0 left-0 z-50 border-t md:hidden"
        style={{
          background: "var(--dash-surface)",
          borderColor: "var(--dash-border)",
          paddingBottom: "env(safe-area-inset-bottom)",
        }}
      >
        <div className="flex h-16 items-center justify-around">
          {items.map((item) => {
            const active = isDashboardNavItemActive(pathname, item.href);
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex flex-1 flex-col items-center gap-0.5 px-2 py-2"
                style={{ color: active ? "var(--dash-brand)" : "var(--dash-muted)" }}
              >
                <Icon className="h-5 w-5" />
                <span className="max-w-full truncate text-[10px] leading-none">{item.label}</span>
              </Link>
            );
          })}

          <button
            type="button"
            onClick={() => setMoreOpen(true)}
            className="flex flex-1 flex-col items-center gap-0.5 px-2 py-2"
            style={{ color: moreOpen ? "var(--dash-brand)" : "var(--dash-muted)" }}
          >
            <LayoutGrid className="h-5 w-5" />
            <span className="text-[10px] leading-none">More</span>
          </button>
        </div>
      </nav>
      <DashboardMoreDrawer
        email={email}
        onOpenChange={setMoreOpen}
        open={moreOpen}
        pathname={pathname}
      />
    </>
  );
}

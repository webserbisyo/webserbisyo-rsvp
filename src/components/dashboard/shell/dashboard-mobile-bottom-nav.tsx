"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { isDashboardNavItemActive } from "@/components/dashboard/nav-items";
import { DashboardMoreDrawer } from "./dashboard-more-drawer";
import { CalendarSearch, LayoutDashboard, LayoutGrid, Users } from "lucide-react";

type DashboardMobileBottomNavProps = {
  email: string;
};

export function DashboardMobileBottomNav({ email }: DashboardMobileBottomNavProps) {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);
  const items = [
    { href: "/dashboard", label: "Home", icon: LayoutDashboard },
    { href: "/dashboard/event", label: "Event Website", icon: CalendarSearch },
    { href: "/dashboard/responses", label: "RSVP Responses", icon: Users },
  ];

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
                className={
                  active
                    ? "flex flex-1 cursor-pointer flex-col items-center gap-0.5 px-2 py-2 text-[--dash-brand] transition-colors duration-150"
                    : "flex flex-1 cursor-pointer flex-col items-center gap-0.5 px-2 py-2 text-[--dash-muted] transition-colors duration-150 hover:text-[--dash-foreground]"
                }
              >
                <Icon className="h-5 w-5" />
                <span className="max-w-full truncate text-[10px] leading-none">{item.label}</span>
              </Link>
            );
          })}

          <button
            type="button"
            onClick={() => setMoreOpen(true)}
            className={
              moreOpen
                ? "flex flex-1 cursor-pointer flex-col items-center gap-0.5 px-2 py-2 text-[--dash-brand] transition-colors duration-150"
                : "flex flex-1 cursor-pointer flex-col items-center gap-0.5 px-2 py-2 text-[--dash-muted] transition-colors duration-150 hover:text-[--dash-foreground]"
            }
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

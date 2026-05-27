"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { DashboardMoreDrawer } from "./dashboard-more-drawer";
import { CalendarSearch, LayoutDashboard, LayoutGrid, Users } from "lucide-react";
import { cn } from "@/lib/utils";

type DashboardMobileBottomNavProps = {
  email: string;
};

export function DashboardMobileBottomNav({ email }: DashboardMobileBottomNavProps) {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);
  const items = [
    { href: "/dashboard", label: "Home", icon: LayoutDashboard },
    { href: "/dashboard/event", label: "Event Website", icon: CalendarSearch },
    { href: "/dashboard/responses", label: "RSVP", icon: Users },
  ];
  const moreRouteActive =
    pathname.startsWith("/dashboard") &&
    !items.some((item) => isMobileNavItemActive(pathname, item.href));
  const morePressed = moreOpen || moreRouteActive;

  return (
    <>
      <nav
        data-dashboard
        className="dashboard-mobile-bottom-nav"
        style={{
          background: "var(--dash-surface)",
          borderColor: "var(--dash-border)",
          paddingBottom: "env(safe-area-inset-bottom)",
        }}
      >
        <div className="dashboard-mobile-bottom-nav__inner">
          {items.map((item) => {
            const active = isMobileNavItemActive(pathname, item.href);
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                data-active={active}
                className="dashboard-mobile-bottom-nav__item"
              >
                <Icon className="dashboard-mobile-bottom-nav__icon" />
                <span className="dashboard-mobile-bottom-nav__label">
                  {item.label}
                </span>
              </Link>
            );
          })}

          <button
            type="button"
            onClick={() => setMoreOpen(true)}
            aria-current={moreRouteActive ? "page" : undefined}
            aria-expanded={moreOpen}
            data-active={moreRouteActive}
            data-open={moreOpen}
            className={cn(
              "dashboard-mobile-bottom-nav__item",
              morePressed && "dashboard-mobile-bottom-nav__item--pressed",
            )}
          >
            <LayoutGrid className="dashboard-mobile-bottom-nav__icon" />
            <span className="dashboard-mobile-bottom-nav__label">More</span>
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

function isMobileNavItemActive(pathname: string, href: string) {
  if (href === "/dashboard") {
    return pathname === "/dashboard";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

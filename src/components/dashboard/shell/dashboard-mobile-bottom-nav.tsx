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
        className="fixed right-0 bottom-0 left-0 z-50 border-t md:hidden"
        style={{
          background: "var(--dash-surface)",
          borderColor: "var(--dash-border)",
          paddingBottom: "env(safe-area-inset-bottom)",
        }}
      >
        <div className="flex h-16 items-center justify-around">
          {items.map((item) => {
            const active = isMobileNavItemActive(pathname, item.href);
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative flex flex-1 cursor-pointer flex-col items-center gap-0.5 px-2 py-2 transition-colors duration-150",
                  active
                    ? "text-[--dash-brand]"
                    : "text-[--dash-muted] hover:text-[--dash-foreground]",
                )}
              >
                <span
                  className={cn(
                    "absolute top-0 h-1.5 w-8 rounded-full bg-[--dash-brand] transition-opacity duration-150",
                    active ? "opacity-100" : "opacity-0",
                  )}
                  aria-hidden="true"
                />
                <Icon className="h-5 w-5" />
                <span
                  className={cn(
                    "max-w-full truncate text-[10px] leading-none",
                    active && "font-semibold",
                  )}
                >
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
            className={cn(
              "relative flex flex-1 cursor-pointer flex-col items-center gap-0.5 px-2 py-2 transition-colors duration-150",
              morePressed
                ? "text-[--dash-brand]"
                : "text-[--dash-muted] hover:text-[--dash-foreground]",
            )}
          >
            <span
              className={cn(
                "absolute top-0 h-1.5 w-8 rounded-full bg-[--dash-brand] transition-opacity duration-150",
                morePressed ? "opacity-100" : "opacity-0",
              )}
              aria-hidden="true"
            />
            <LayoutGrid className="h-5 w-5" />
            <span className={cn("text-[10px] leading-none", morePressed && "font-semibold")}>
              More
            </span>
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

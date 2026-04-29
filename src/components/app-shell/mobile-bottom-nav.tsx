"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { isAdminNavItemActive, mobilePrimaryNavItems } from "./nav-items";

export function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav className="bg-background/95 supports-[backdrop-filter]:bg-background/86 fixed inset-x-0 bottom-0 z-40 border-t backdrop-blur md:hidden">
      <div className="admin-safe-bottom grid min-h-[var(--admin-mobile-nav-height)] grid-cols-5">
        {mobilePrimaryNavItems.map((item) => {
          const isActive = isAdminNavItemActive(item, pathname);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "text-muted-foreground flex min-w-0 flex-col items-center justify-center gap-1 px-1 py-2 text-[0.72rem] font-medium",
                isActive && "text-rsvp-brand",
              )}
            >
              <item.icon className="size-5" />
              <span className="max-w-full truncate">{item.title}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

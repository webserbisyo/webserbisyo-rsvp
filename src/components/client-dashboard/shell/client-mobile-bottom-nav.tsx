"use client";

import Link from "next/link";
import { Ellipsis } from "lucide-react";
import { usePathname } from "next/navigation";
import {
  clientMobilePrimaryNavItems,
  isClientNavItemActive,
} from "@/components/client-dashboard/navigation/client-nav-config";
import { cn } from "@/lib/utils";

type ClientMobileBottomNavProps = {
  onMoreOpen: () => void;
};

export function ClientMobileBottomNav({ onMoreOpen }: ClientMobileBottomNavProps) {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Client dashboard mobile navigation"
      className="client-bottom-nav fixed inset-x-0 bottom-0 z-40 border-t lg:hidden"
    >
      <div className="client-safe-bottom grid min-h-[var(--client-bottom-nav-height)] grid-cols-5 px-1">
        {clientMobilePrimaryNavItems.map((item) => {
          const isActive = isClientNavItemActive(item, pathname);

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              data-active={isActive}
              className={cn(
                "client-bottom-nav-button client-focus-ring flex min-w-0 flex-col items-center justify-center gap-1 rounded-[var(--client-radius-lg)] px-1 py-2 text-[0.72rem] font-medium",
              )}
            >
              <item.icon className="size-4.5 shrink-0" />
              <span className="max-w-full truncate">{item.mobileLabel}</span>
            </Link>
          );
        })}

        <button
          type="button"
          onClick={onMoreOpen}
          className="client-bottom-nav-button client-focus-ring flex min-w-0 flex-col items-center justify-center gap-1 rounded-[var(--client-radius-lg)] px-1 py-2 text-[0.72rem] font-medium"
        >
          <Ellipsis className="size-4.5 shrink-0" />
          <span className="max-w-full truncate">More</span>
        </button>
      </div>
    </nav>
  );
}

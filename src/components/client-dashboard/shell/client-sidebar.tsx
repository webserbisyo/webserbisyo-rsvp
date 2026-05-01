"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SignOutButton } from "@/components/app-shell/sign-out-button";
import {
  clientDesktopNavItems,
  isClientNavItemActive,
} from "@/components/client-dashboard/navigation/client-nav-config";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

type ClientSidebarProps = {
  clientName: string;
};

export function ClientSidebar({ clientName }: ClientSidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="client-shell-edge sticky top-0 hidden h-svh w-[var(--client-sidebar-width)] shrink-0 border-r border-[var(--client-border)] lg:flex">
      <div className="flex h-full w-full flex-col px-4 py-5">
        <Link
          href="/dashboard"
          className="client-focus-ring client-surface-raised rounded-[var(--client-radius-2xl)] px-4 py-4 transition-transform hover:-translate-y-0.5"
        >
          <div className="flex items-start gap-3">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-[var(--client-radius-lg)] bg-[var(--client-accent-soft)] text-base font-semibold text-[var(--client-accent-hover)] shadow-[var(--client-shadow-soft)]">
              WS
            </div>
            <div className="min-w-0 space-y-1">
              <p className="text-[0.72rem] font-semibold tracking-[0.18em] text-[var(--client-text-soft)] uppercase">
                Client Portal
              </p>
              <p className="truncate text-base font-semibold text-[var(--client-text)]">
                WebSerbisyo RSVP
              </p>
              <p className="truncate text-sm text-[var(--client-text-muted)]">{clientName}</p>
            </div>
          </div>
        </Link>

        <Separator className="my-5 bg-[var(--client-border)]" />

        <nav aria-label="Client dashboard navigation" className="flex-1">
          <ul className="space-y-1.5">
            {clientDesktopNavItems.map((item) => {
              const isActive = isClientNavItemActive(item, pathname);

              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={isActive ? "page" : undefined}
                    data-active={isActive}
                    data-soon={item.badgeLabel ? "true" : undefined}
                    className={cn(
                      "client-nav-link client-focus-ring flex items-center gap-3 rounded-[var(--client-radius-lg)] px-3 py-3 text-sm font-medium",
                    )}
                  >
                    <item.icon className="size-4.5 shrink-0" />
                    <span className="flex min-w-0 flex-1 items-center gap-2">
                      <span className="truncate">{item.label}</span>
                      {item.badgeLabel ? (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Badge
                              variant="outline"
                              className="client-soon-badge rounded-full px-2"
                            >
                              {item.badgeLabel}
                            </Badge>
                          </TooltipTrigger>
                          <TooltipContent side="right">
                            Placeholder only until the related schema is ready.
                          </TooltipContent>
                        </Tooltip>
                      ) : null}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="mt-6 rounded-[var(--client-radius-2xl)] border border-[var(--client-border)] bg-white/72 p-2 shadow-[var(--client-shadow-soft)]">
          <SignOutButton className="client-focus-ring w-full justify-start rounded-[var(--client-radius-lg)] text-[var(--client-text-muted)] hover:bg-[var(--client-accent-soft)] hover:text-[var(--client-accent-hover)]" />
        </div>
      </div>
    </aside>
  );
}

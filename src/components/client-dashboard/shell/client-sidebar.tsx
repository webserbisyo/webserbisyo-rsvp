"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SignOutButton } from "@/components/app-shell/sign-out-button";
import {
  clientDesktopNavItems,
  isClientNavItemActive,
} from "@/components/client-dashboard/navigation/client-nav-config";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

type ClientSidebarProps = {
  clientName: string;
};

export function ClientSidebar({ clientName }: ClientSidebarProps) {
  const pathname = usePathname();

  return (
    <Sidebar
      collapsible="none"
      className="client-shell-edge hidden border-r-0 bg-transparent text-[var(--client-text)] lg:flex"
    >
      <SidebarHeader className="gap-0 p-4 pb-3">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              size="lg"
              className="client-focus-ring client-surface-raised h-auto rounded-[var(--client-radius-2xl)] border-[var(--client-border)] px-4 py-4 hover:bg-white/78"
            >
              <Link href="/dashboard">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-[var(--client-radius-lg)] bg-[var(--client-accent-soft)] text-base font-semibold text-[var(--client-accent-hover)] shadow-[var(--client-shadow-soft)]">
                  WS
                </span>
                <span className="grid min-w-0 flex-1 gap-0.5 leading-tight">
                  <span className="truncate text-[0.68rem] font-semibold tracking-[0.2em] text-[var(--client-text-soft)] uppercase">
                    Client Portal
                  </span>
                  <span className="truncate text-base font-semibold text-[var(--client-text)]">
                    WebSerbisyo RSVP
                  </span>
                  <span className="truncate text-sm font-normal text-[var(--client-text-muted)]">
                    {clientName}
                  </span>
                </span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarSeparator className="mx-4 bg-[var(--client-border)]" />

      <SidebarContent className="px-2 py-4">
        <ScrollArea className="min-h-0 flex-1">
          <SidebarGroup className="p-0">
            <SidebarGroupContent>
              <SidebarMenu className="gap-1.5">
                {clientDesktopNavItems.map((item) => {
                  const isActive = isClientNavItemActive(item, pathname);

                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        asChild
                        isActive={isActive}
                        size="lg"
                        tooltip={item.label}
                        data-soon={item.badgeLabel ? "true" : undefined}
                        className={cn(
                          "client-nav-link client-focus-ring relative h-11 rounded-[var(--client-radius-lg)] px-3 font-medium before:absolute before:top-1/2 before:left-1 before:h-5 before:w-0 before:-translate-y-1/2 before:rounded-full before:transition-all",
                        )}
                      >
                        <Link href={item.href} aria-current={isActive ? "page" : undefined}>
                          <item.icon className="size-4.5" />
                          <span className="min-w-0 flex-1 truncate">{item.label}</span>
                          {item.badgeLabel ? (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Badge
                                  variant="outline"
                                  className="client-soon-badge rounded-full px-2 text-[0.68rem]"
                                >
                                  {item.badgeLabel}
                                </Badge>
                              </TooltipTrigger>
                              <TooltipContent side="right">
                                Placeholder only until the related schema is ready.
                              </TooltipContent>
                            </Tooltip>
                          ) : null}
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </ScrollArea>
      </SidebarContent>

      <SidebarFooter className="p-4 pt-2">
        <div className="rounded-[var(--client-radius-2xl)] border border-[var(--client-border)] bg-white/72 p-2 shadow-[var(--client-shadow-soft)]">
          <SignOutButton className="client-focus-ring h-10 w-full justify-start rounded-[var(--client-radius-lg)] text-[var(--client-text-muted)] hover:bg-[var(--client-accent-soft)] hover:text-[var(--client-accent-hover)]" />
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}

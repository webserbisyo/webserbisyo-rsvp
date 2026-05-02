"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { dashboardNavItems, isDashboardNavItemActive } from "@/components/dashboard/nav-items";
import { CalendarHeart } from "lucide-react";

type DashboardSidebarProps = {
  email: string;
  displayName?: string;
};

function getInitials(email: string, displayName?: string) {
  const source = displayName?.trim() || email.trim();
  const compact = source.replace(/\s+/g, "");
  return compact.slice(0, 2).toUpperCase();
}

export function DashboardSidebar({ email, displayName }: DashboardSidebarProps) {
  const pathname = usePathname();
  const { state } = useSidebar();
  const initials = getInitials(email, displayName);
  const collapsed = state === "collapsed";

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-[--dash-border] px-2 py-3">
        <div className="flex items-center gap-2 px-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[--dash-brand]">
            <CalendarHeart className="h-4 w-4 text-white" />
          </div>
          <span className="text-sm font-semibold text-[--dash-foreground] group-data-[collapsible=icon]:hidden">
            WebSerbisyo
          </span>
        </div>
      </SidebarHeader>

      <SidebarContent
        className="px-2 py-3"
        style={{ background: "var(--dash-surface)" }}
      >
        <SidebarMenu>
          {dashboardNavItems.map((item) => {
            const active = isDashboardNavItemActive(pathname, item.href);
            const Icon = item.icon;
            const button = (
              <SidebarMenuButton
                asChild
                isActive={active}
                className={
                  active
                    ? "border-l-2 border-[--dash-brand] bg-[--dash-surface-muted] text-[--dash-brand]"
                    : "border-l-2 border-transparent text-[--dash-muted] hover:bg-[--dash-surface-muted] hover:text-[--dash-foreground]"
                }
              >
                <Link href={item.href}>
                  <Icon className="h-[18px] w-[18px] shrink-0" />
                  <span className="group-data-[collapsible=icon]:hidden">{item.label}</span>
                </Link>
              </SidebarMenuButton>
            );

            return (
              <SidebarMenuItem key={item.href}>
                {collapsed ? (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>{button}</TooltipTrigger>
                      <TooltipContent side="right">{item.label}</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                ) : (
                  button
                )}
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter className="border-t border-[--dash-border] px-2 py-3">
        <div className="flex items-center gap-2 px-2">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[--dash-brand] text-xs font-medium text-white">
            {initials}
          </div>
          <div className="flex min-w-0 flex-col group-data-[collapsible=icon]:hidden">
            <span className="truncate text-xs font-medium text-[--dash-foreground]">
              {displayName ?? email}
            </span>
            <span className="truncate text-[10px] text-[--dash-muted]">{email}</span>
          </div>
        </div>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}

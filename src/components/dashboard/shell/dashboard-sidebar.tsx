"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { DashboardNavLink } from "@/components/dashboard/dashboard-nav-link";
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
import { dashboardNavItems, isDashboardNavItemActive } from "@/components/dashboard/nav-items";
import { createClient } from "@/lib/supabase/client";
import { useDashboardSpaPathname } from "@/lib/dashboard/dashboard-spa-navigation";
import { LogOut } from "lucide-react";
import { cn } from "@/lib/utils";

type DashboardSidebarProps = {
  email: string;
  displayName?: string;
};

export function DashboardSidebar({ email, displayName }: DashboardSidebarProps) {
  const pathname = useDashboardSpaPathname();
  const router = useRouter();
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  void email;
  void displayName;

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <Sidebar collapsible="icon">
      {/* ── Header ─────────────────────────────────────────── */}
      <SidebarHeader className="border-border h-14 flex-shrink-0 justify-center border-b">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild size="lg" tooltip="WebSerbisyo RSVP">
              <DashboardNavLink href="/dashboard" className="w-full min-w-0">
                <span className="bg-secondary flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-lg">
                  <Image
                    src="/images/brand/webserbisyo-logo.jpeg"
                    alt="WebSerbisyo"
                    width={32}
                    height={32}
                    priority
                    className="h-8 w-8 rounded-lg object-contain"
                    style={{ width: "auto", height: "auto" }}
                  />
                </span>
                <span className="flex min-w-0 flex-col leading-tight group-data-[collapsible=icon]:hidden">
                  <span className="text-foreground truncate text-sm font-bold">WebSerbisyo</span>
                  <span className="text-muted-foreground truncate text-xs font-medium">
                    RSVP Platform
                  </span>
                </span>
              </DashboardNavLink>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      {/* ── Nav items ───────────────────────────────────────── */}
      {/* All hover/active/press states are handled by scoped CSS in components.css */}
      <SidebarContent>
        <SidebarMenu className="gap-0.5 px-2 py-2">
          {dashboardNavItems.map((item) => {
            const isActive = isDashboardNavItemActive(pathname, item.href);
            const Icon = item.icon;

            return (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton asChild isActive={isActive} tooltip={item.label}>
                  <DashboardNavLink
                    href={item.href}
                    className="w-full min-w-0 group-data-[collapsible=icon]:justify-center"
                  >
                    <Icon className="size-4 shrink-0" />
                    <span className="min-w-0 truncate group-data-[collapsible=icon]:hidden">
                      {item.label}
                    </span>
                  </DashboardNavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarContent>

      {/* ── Footer — sign out ───────────────────────────────── */}
      <SidebarFooter className="border-border border-t">
        <div className={cn("py-1", collapsed ? "flex justify-center px-0" : "px-2")}>
          <button
            type="button"
            onClick={handleSignOut}
            title="Sign out"
            className={cn(
              "text-foreground hover:bg-destructive/10 hover:text-destructive active:bg-destructive/15 active:text-destructive flex cursor-pointer items-center gap-2 rounded-md text-sm transition-colors duration-150",
              collapsed ? "h-8 w-8 justify-center px-0 py-0" : "w-full px-3 py-2",
            )}
          >
            <LogOut className="h-4 w-4 shrink-0" aria-hidden="true" />
            {!collapsed && <span className="truncate">Sign out</span>}
          </button>
        </div>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}

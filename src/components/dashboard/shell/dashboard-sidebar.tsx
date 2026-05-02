"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
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
import { LogOut } from "lucide-react";
import { cn } from "@/lib/utils";

type DashboardSidebarProps = {
  email: string;
  displayName?: string;
};

export function DashboardSidebar({ email, displayName }: DashboardSidebarProps) {
  const pathname = usePathname();
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
      <SidebarHeader className="h-14 flex-shrink-0 justify-center border-b border-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild size="lg" tooltip="WebSerbisyo RSVP">
              <Link href="/dashboard">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-secondary">
                  <Image
                    src="/images/brand/webserbisyo-logo.jpeg"
                    alt="WebSerbisyo"
                    width={32}
                    height={32}
                    priority
                    className="h-8 w-8 rounded-lg object-contain"
                  />
                </span>
                <span className="flex min-w-0 flex-col leading-tight group-data-[collapsible=icon]:hidden">
                  <span className="truncate text-sm font-bold text-foreground">
                    WebSerbisyo
                  </span>
                  <span className="text-muted-foreground truncate text-xs font-medium">RSVP Platform</span>
                </span>
              </Link>
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
                <SidebarMenuButton
                  asChild
                  isActive={isActive}
                  tooltip={item.label}
                >
                  <Link href={item.href}>
                    <Icon className="size-4 shrink-0" />
                    <span>{item.label}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarContent>

      {/* ── Footer — sign out ───────────────────────────────── */}
      <SidebarFooter className="border-t border-border">
        <div className={cn("py-1", collapsed ? "flex justify-center px-0" : "px-2")}>
          <button
            type="button"
            onClick={handleSignOut}
            title="Sign out"
            className={cn(
              "flex cursor-pointer items-center gap-2 rounded-md text-sm transition-colors duration-150 text-foreground hover:bg-destructive/10 hover:text-destructive active:bg-destructive/15 active:text-destructive",
              collapsed
                ? "h-8 w-8 justify-center px-0 py-0"
                : "w-full px-3 py-2",
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

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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { dashboardNavItems, isDashboardNavItemActive } from "@/components/dashboard/nav-items";
import { createClient } from "@/lib/supabase/client";
import { LogOut } from "lucide-react";
import { cn } from "@/lib/utils";

type DashboardSidebarProps = {
  email: string;
  displayName?: string;
  planType?: string | null;
};

export function DashboardSidebar({ email, displayName, planType }: DashboardSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  void email;
  void displayName;
  void planType;

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  const signOutButton = (
    <button
      type="button"
      onClick={handleSignOut}
      className="flex w-full cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm text-[--dash-muted] transition-colors duration-150 hover:bg-[--dash-destructive-subtle] hover:text-[--dash-destructive]"
    >
      <LogOut className="h-4 w-4 shrink-0" aria-hidden="true" />
      <span className="truncate transition-opacity duration-200 motion-safe:group-data-[collapsible=icon]:opacity-0 group-data-[collapsible=icon]:w-0 group-data-[collapsible=icon]:overflow-hidden">
        Sign out
      </span>
    </button>
  );

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="h-14 flex-shrink-0 overflow-hidden border-b border-[--dash-border]">
        <div className="flex h-full items-center gap-2 px-2 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:gap-0 group-data-[collapsible=icon]:px-0">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[--dash-surface-muted]">
            <Image
              src="/images/brand/webserbisyo-logo.jpeg"
              alt="WebSerbisyo"
              width={84}
              height={84}
              priority
              className="h-8 w-8 rounded-lg object-contain"
            />
          </div>
          <div className="flex min-w-0 flex-col overflow-hidden transition-opacity duration-200 motion-safe:group-data-[collapsible=icon]:opacity-0 group-data-[collapsible=icon]:w-0">
            <span className="text-sm font-semibold text-[--dash-foreground]">WebSerbisyo</span>
            <span className="truncate text-xs text-[--dash-muted]">RSVP Platform</span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent
        className="px-2 py-3"
        style={{ background: "var(--dash-surface)" }}
      >
        <SidebarMenu className="gap-0.5">
          {dashboardNavItems.map((item) => {
            const active = isDashboardNavItemActive(pathname, item.href);
            const Icon = item.icon;
            const button = (
              <SidebarMenuButton
                asChild
                isActive={false}
                className={cn(
                  "relative flex w-full cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors duration-150 outline-none",
                  active
                    ? "bg-[--dash-brand-subtle] text-[--dash-brand] font-medium"
                    : "text-[--dash-muted] hover:bg-[--dash-surface-hover] hover:text-[--dash-foreground]",
                )}
              >
                <Link href={item.href}>
                  <Icon className="h-[18px] w-[18px] shrink-0" />
                  <span className="truncate transition-opacity duration-200 motion-safe:group-data-[collapsible=icon]:opacity-0 group-data-[collapsible=icon]:w-0 group-data-[collapsible=icon]:overflow-hidden">
                    {item.label}
                  </span>
                </Link>
              </SidebarMenuButton>
            );

            return (
              <SidebarMenuItem key={item.href} className="px-2">
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

      <SidebarFooter className="flex-shrink-0 border-t border-[--dash-border] px-2 py-2">
        {collapsed ? (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>{signOutButton}</TooltipTrigger>
              <TooltipContent side="right">Sign out</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ) : (
          signOutButton
        )}
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}

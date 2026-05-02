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

  const signOutButton = (
    <button
      type="button"
      onClick={handleSignOut}
      className="flex h-9 w-full items-center gap-2 overflow-hidden rounded-md px-2 text-sm text-[--dash-muted] transition-colors duration-150 hover:bg-[--dash-destructive-subtle] hover:text-[--dash-destructive]"
    >
      <LogOut className="h-4 w-4 shrink-0" aria-hidden="true" />
      <span className="min-w-0 max-w-28 truncate whitespace-nowrap opacity-100 motion-safe:transition-[max-width,opacity,transform] motion-safe:duration-200 motion-safe:ease-in-out group-data-[collapsible=icon]:max-w-0 group-data-[collapsible=icon]:translate-x-1 group-data-[collapsible=icon]:opacity-0">
        Sign out
      </span>
    </button>
  );

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="h-14 flex-shrink-0 justify-center overflow-hidden border-b border-[--dash-border] px-2 py-0">
        <div className="flex h-full items-center gap-2 overflow-hidden px-2">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-[--dash-border] bg-white/90">
            <Image
              src="/images/brand/webserbisyo-logo.jpeg"
              alt="WebSerbisyo"
              width={84}
              height={84}
              priority
              className="h-full w-full object-cover"
            />
          </div>
          <div className="flex min-w-0 max-w-36 flex-col leading-tight opacity-100 motion-safe:transition-[max-width,opacity,transform] motion-safe:duration-200 motion-safe:ease-in-out group-data-[collapsible=icon]:max-w-0 group-data-[collapsible=icon]:translate-x-1 group-data-[collapsible=icon]:opacity-0">
            <span className="text-sm font-semibold text-[--dash-foreground]">WebSerbisyo</span>
            <span className="truncate text-xs text-[--dash-muted]">RSVP Platform</span>
          </div>
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
                    ? "border-l-2 border-[--dash-brand] bg-[--dash-brand-subtle] font-medium text-[--dash-brand] transition-colors duration-150 [&_svg]:text-[--dash-brand]"
                    : "border-l-2 border-transparent bg-transparent text-[--dash-muted] transition-colors duration-150 hover:border-[--dash-border-hover] hover:bg-[--dash-surface-hover] hover:text-[--dash-foreground] [&_svg]:text-[--dash-muted] hover:[&_svg]:text-[--dash-foreground]"
                }
              >
                <Link href={item.href}>
                  <Icon className="h-[18px] w-[18px] shrink-0" />
                  <span className="min-w-0 max-w-40 truncate whitespace-nowrap opacity-100 motion-safe:transition-[max-width,opacity,transform] motion-safe:duration-200 motion-safe:ease-in-out group-data-[collapsible=icon]:max-w-0 group-data-[collapsible=icon]:translate-x-1 group-data-[collapsible=icon]:opacity-0">
                    {item.label}
                  </span>
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

      <SidebarFooter className="h-14 flex-shrink-0 overflow-hidden border-t border-[--dash-border] px-2 py-2">
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

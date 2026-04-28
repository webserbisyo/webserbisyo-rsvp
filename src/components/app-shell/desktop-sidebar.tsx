"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SignOutButton } from "./sign-out-button";
import { desktopAdminNavItems, isAdminNavItemActive } from "./nav-items";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";

export type AdminShellProfile = {
  email: string | null;
  full_name: string | null;
  role: string;
};

type DesktopSidebarProps = {
  profile: AdminShellProfile;
};

function getInitials(profile: AdminShellProfile) {
  const source = profile.full_name || profile.email || "Admin";
  const parts = source.split(/\s+/).filter(Boolean).slice(0, 2);
  return parts.map((part) => part[0]?.toUpperCase()).join("") || "A";
}

export function DesktopSidebar({ profile }: DesktopSidebarProps) {
  const pathname = usePathname();
  const displayName = profile.full_name || "Platform admin";
  const displayEmail = profile.email || "No email on profile";

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-sidebar-border/50 h-14 justify-center border-b">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[active=true]:bg-rsvp-brand data-[active=true]:text-rsvp-brand-foreground"
              size="lg"
              tooltip="WebSerbisyo RSVP"
            >
              <Link href="/admin">
                <span className="bg-background flex aspect-square size-8 items-center justify-center overflow-hidden rounded-lg border">
                  <Image
                    src="/images/brand/webserbisyo-logo.jpeg"
                    alt=""
                    width={32}
                    height={32}
                    className="size-8 object-cover"
                  />
                </span>
                <span className="flex min-w-0 flex-col leading-tight group-data-[collapsible=icon]:hidden">
                  <span className="truncate font-medium">WebSerbisyo</span>
                  <span className="text-muted-foreground truncate text-xs">RSVP Admin</span>
                </span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarMenu className="gap-1 px-2 py-2">
          {desktopAdminNavItems.map((item) => {
            const isActive = isAdminNavItemActive(item, pathname);

            return (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  asChild
                  isActive={isActive}
                  tooltip={item.title}
                  className="data-[active=true]:bg-rsvp-brand/10 data-[active=true]:text-rsvp-brand data-[active=true]:hover:bg-rsvp-brand/15 data-[active=true]:font-medium"
                >
                  <Link href={item.href}>
                    <item.icon className="size-4" />
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="h-8 w-8 rounded-lg">
                <AvatarFallback className="bg-rsvp-brand text-rsvp-brand-foreground rounded-lg">
                  {getInitials(profile)}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
                <span className="truncate font-semibold">{displayName}</span>
                <span className="truncate text-xs">{displayEmail}</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        <div className="px-2 pb-2 group-data-[collapsible=icon]:px-0">
          <SignOutButton className="text-muted-foreground hover:text-foreground w-full group-data-[collapsible=icon]:w-8 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0" />
        </div>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}

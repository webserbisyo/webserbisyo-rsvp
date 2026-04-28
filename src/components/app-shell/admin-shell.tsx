"use client";

import { usePathname } from "next/navigation";
import { DesktopSidebar, type AdminShellProfile } from "./desktop-sidebar";
import { getAdminPageTitle } from "./nav-items";
import { MobileBottomNav } from "./mobile-bottom-nav";
import { MobileTopHeader } from "./mobile-top-header";
import { OfflineBanner } from "@/components/feedback/offline-banner";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";

type AdminShellProps = {
  children: React.ReactNode;
  profile: AdminShellProfile;
};

export function AdminShell({ children, profile }: AdminShellProps) {
  const pathname = usePathname();
  const title = getAdminPageTitle(pathname);

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "var(--admin-sidebar-width)",
          "--sidebar-width-icon": "var(--admin-sidebar-width-icon)",
        } as React.CSSProperties
      }
    >
      <DesktopSidebar profile={profile} />
      <SidebarInset className="bg-muted/25 min-h-svh">
        <header className="bg-background sticky top-0 z-30 hidden h-14 shrink-0 items-center gap-3 border-b px-4 sm:px-6 md:flex lg:px-8">
          <SidebarTrigger className="-ml-1" />
          <p className="text-sm font-medium">{title}</p>
        </header>
        <MobileTopHeader title={title} />
        <OfflineBanner />
        <div className="flex flex-1 flex-col pb-[calc(var(--admin-mobile-nav-height)+env(safe-area-inset-bottom))] md:pb-0">
          {children}
        </div>
        <MobileBottomNav />
      </SidebarInset>
    </SidebarProvider>
  );
}

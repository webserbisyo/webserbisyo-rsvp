"use client";

import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { DashboardMobileBottomNav } from "./dashboard-mobile-bottom-nav";
import { DashboardSidebar } from "./dashboard-sidebar";
import { DashboardTopHeader } from "./dashboard-top-header";

type DashboardShellProps = {
  children: React.ReactNode;
  email: string;
  displayName?: string;
};

export function DashboardShell({ children, email, displayName }: DashboardShellProps) {
  return (
    <div
      data-dashboard
      className="min-h-screen"
      style={{ background: "var(--dash-surface)" }}
    >
      <SidebarProvider
        style={
          {
            "--sidebar-width": "var(--dash-sidebar-width)",
            "--sidebar-width-icon": "var(--dash-sidebar-collapsed-width)",
          } as React.CSSProperties
        }
      >
        <div className="hidden md:block">
          <DashboardSidebar email={email} displayName={displayName} />
        </div>

        <SidebarInset>
          <DashboardTopHeader email={email} displayName={displayName} />
          <main className="flex-1 p-4 pb-20 sm:p-6 md:pb-6">{children}</main>
        </SidebarInset>
      </SidebarProvider>

      <DashboardMobileBottomNav email={email} />
    </div>
  );
}

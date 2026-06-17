"use client";

import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { DashboardQueryProvider } from "@/components/dashboard/dashboard-query-provider";
import { DashboardRealtimeNotifications } from "@/components/dashboard/notifications/dashboard-realtime-notifications";
import { DashboardMobileBottomNav } from "./dashboard-mobile-bottom-nav";
import { DashboardSidebar } from "./dashboard-sidebar";
import { DashboardTopHeader } from "./dashboard-top-header";

type DashboardShellProps = {
  children: React.ReactNode;
  clientId: string;
  email: string;
  displayName?: string;
  planType?: string | null;
  profileId: string;
};

export function DashboardShell({
  children,
  clientId,
  email,
  displayName,
  planType,
  profileId,
}: DashboardShellProps) {
  return (
    <DashboardQueryProvider>
      <div data-dashboard className="min-h-screen" style={{ background: "var(--dash-surface)" }}>
        <DashboardRealtimeNotifications clientId={clientId} profileId={profileId} />
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

          <SidebarInset className="min-h-screen">
            <DashboardTopHeader email={email} displayName={displayName} planType={planType} />
            <main className="dash-page-bg flex-1 p-4 pb-20 sm:p-6 md:pb-6">{children}</main>
          </SidebarInset>
        </SidebarProvider>

        <DashboardMobileBottomNav email={email} />
      </div>
    </DashboardQueryProvider>
  );
}

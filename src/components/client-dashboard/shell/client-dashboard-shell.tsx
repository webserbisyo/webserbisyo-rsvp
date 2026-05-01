"use client";

import { useState } from "react";
import { ClientMobileBottomNav } from "./client-mobile-bottom-nav";
import { ClientMobileMoreDrawer } from "./client-mobile-more-drawer";
import { ClientSidebar } from "./client-sidebar";
import { ClientTopbar } from "./client-topbar";

type ClientDashboardShellProps = {
  children: React.ReactNode;
  client: {
    name: string;
  };
  profile: {
    email: string | null;
    fullName: string | null;
    role: string;
  };
};

export function ClientDashboardShell({ children, client, profile }: ClientDashboardShellProps) {
  const [moreDrawerOpen, setMoreDrawerOpen] = useState(false);

  return (
    <div className="client-dashboard-theme min-h-svh text-[var(--client-text)]">
      <div className="relative flex min-h-svh">
        <ClientSidebar clientName={client.name} />

        <div className="flex min-h-svh min-w-0 flex-1 flex-col">
          <ClientTopbar
            clientName={client.name}
            email={profile.email}
            fullName={profile.fullName}
            role={profile.role}
          />
          <div className="client-body-offset flex flex-1 flex-col">{children}</div>
          <ClientMobileBottomNav onMoreOpen={() => setMoreDrawerOpen(true)} />
          <ClientMobileMoreDrawer open={moreDrawerOpen} onOpenChange={setMoreDrawerOpen} />
        </div>
      </div>
    </div>
  );
}

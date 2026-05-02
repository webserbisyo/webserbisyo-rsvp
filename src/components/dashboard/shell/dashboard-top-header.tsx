"use client";

import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { DashboardAvatarDropdown } from "./dashboard-avatar-dropdown";
import { DashboardBreadcrumb } from "./dashboard-breadcrumb";

type DashboardTopHeaderProps = {
  email: string;
  displayName?: string;
};

export function DashboardTopHeader({
  email,
  displayName,
}: DashboardTopHeaderProps) {
  return (
    <header
      className="sticky top-0 z-40 flex h-14 items-center gap-3 border-b px-4"
      style={{ background: "var(--dash-surface)", borderColor: "var(--dash-border)" }}
    >
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="h-5" />
      <DashboardBreadcrumb />
      <div className="ml-auto">
        <DashboardAvatarDropdown email={email} displayName={displayName} />
      </div>
    </header>
  );
}

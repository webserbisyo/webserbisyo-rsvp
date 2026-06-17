"use client";

import { SidebarTrigger } from "@/components/ui/sidebar";
import { DashboardAvatarDropdown } from "./dashboard-avatar-dropdown";
import { DashboardBreadcrumb } from "./dashboard-breadcrumb";

type DashboardTopHeaderProps = {
  email: string;
  displayName?: string;
  planType?: string | null;
};

export function DashboardTopHeader({ email, displayName, planType }: DashboardTopHeaderProps) {
  return (
    <header
      className="sticky top-0 z-40 flex h-[var(--dash-header-height)] items-center gap-3 border-b px-4"
      style={{ background: "var(--dash-surface)", borderColor: "var(--dash-border)" }}
    >
      <SidebarTrigger className="-ml-1 hidden md:inline-flex" />
      <div className="hidden h-5 w-px bg-[--dash-border] opacity-60 md:block" aria-hidden="true" />
      <DashboardBreadcrumb />
      <div className="ml-auto">
        <DashboardAvatarDropdown email={email} displayName={displayName} planType={planType} />
      </div>
    </header>
  );
}

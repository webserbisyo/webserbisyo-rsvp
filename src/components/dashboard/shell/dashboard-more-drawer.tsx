"use client";

import { DashboardNavLink } from "@/components/dashboard/dashboard-nav-link";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Separator } from "@/components/ui/separator";
import { createClient } from "@/lib/supabase/client";
import { isDashboardNavItemActive } from "@/components/dashboard/nav-items";
import { ChevronRight, CreditCard, KeyRound, LogOut, Settings2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

type DashboardMoreDrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pathname: string;
  email: string;
};

export function DashboardMoreDrawer({
  open,
  onOpenChange,
  pathname,
  email,
}: DashboardMoreDrawerProps) {
  const router = useRouter();
  const remainingItems = [
    { href: "/dashboard/website-access", label: "Website Access", icon: KeyRound },
    { href: "/dashboard/billing", label: "Billing", icon: CreditCard },
    { href: "/dashboard/settings", label: "Settings", icon: Settings2 },
  ];
  void email;

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    onOpenChange(false);
    router.push("/login");
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent data-dashboard className="dashboard-more-drawer">
        <DrawerHeader className="sr-only">
          <DrawerTitle>More</DrawerTitle>
          <DrawerDescription>Account shortcuts and settings.</DrawerDescription>
        </DrawerHeader>

        <div className="dashboard-more-drawer__header">
          <h2 className="dashboard-more-drawer__title">More</h2>
        </div>

        <div className="dashboard-more-drawer__list" role="list">
          {remainingItems.map((item) => {
            const active = isDashboardNavItemActive(pathname, item.href);
            const Icon = item.icon;

            return (
              <DashboardNavLink
                key={item.href}
                href={item.href}
                onClick={() => onOpenChange(false)}
                className={cn("dashboard-more-drawer__item", active && "is-active")}
              >
                <span className="dashboard-more-drawer__item-icon" aria-hidden="true">
                  <Icon className="h-4.5 w-4.5 shrink-0" />
                </span>
                <span className="dashboard-more-drawer__item-label">{item.label}</span>
                <ChevronRight className="dashboard-more-drawer__item-chevron h-4 w-4 shrink-0" />
              </DashboardNavLink>
            );
          })}

          <Separator className="dashboard-more-drawer__separator" />

          <button
            type="button"
            onClick={handleSignOut}
            className="dashboard-more-drawer__item dashboard-more-drawer__item--signout"
          >
            <span className="dashboard-more-drawer__item-icon" aria-hidden="true">
              <LogOut className="h-4.5 w-4.5 shrink-0" />
            </span>
            <span className="dashboard-more-drawer__item-label">Sign out</span>
          </button>
        </div>
      </DrawerContent>
    </Drawer>
  );
}

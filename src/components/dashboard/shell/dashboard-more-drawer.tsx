"use client";

import Link from "next/link";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { createClient } from "@/lib/supabase/client";
import { isDashboardNavItemActive } from "@/components/dashboard/nav-items";
import { Activity, ChevronRight, CreditCard, Globe, LogOut, Settings2 } from "lucide-react";
import { useRouter } from "next/navigation";

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
    { href: "/dashboard/website-access", label: "Website Access", icon: Globe },
    { href: "/dashboard/billing", label: "Billing", icon: CreditCard },
    { href: "/dashboard/activity", label: "Activity", icon: Activity },
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
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        showCloseButton={false}
        overlayClassName="bg-black/40"
        style={{ background: "var(--dash-surface)" }}
        className="max-h-[75vh] overflow-y-auto rounded-t-2xl border-t border-[--dash-border] bg-[--dash-surface] px-0 pt-0 pb-5 text-[--dash-foreground]"
      >
        <div className="mx-auto mt-3 mb-2 h-1 w-8 rounded-full bg-[--dash-border]" />
        <p className="px-4 pb-2 text-xs text-[--dash-muted]">More options</p>

        <div className="grid gap-1">
          {remainingItems.map((item) => {
            const active = isDashboardNavItemActive(pathname, item.href);
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => onOpenChange(false)}
                className={
                  active
                    ? "flex w-full cursor-pointer items-center gap-3 rounded-md px-4 py-3 text-[--dash-brand] transition-colors duration-150 hover:bg-[--dash-surface-hover]"
                    : "flex w-full cursor-pointer items-center gap-3 rounded-md px-4 py-3 transition-colors duration-150 hover:bg-[--dash-surface-hover]"
                }
              >
                <Icon
                  className={
                    active
                      ? "h-5 w-5 shrink-0 text-[--dash-brand]"
                      : "h-5 w-5 shrink-0 text-[--dash-muted]"
                  }
                />
                <span
                  className={
                    active
                      ? "min-w-0 flex-1 truncate text-sm text-[--dash-brand]"
                      : "min-w-0 flex-1 truncate text-sm text-[--dash-foreground]"
                  }
                >
                  {item.label}
                </span>
                <ChevronRight className="h-4 w-4 shrink-0 text-[--dash-muted]" />
              </Link>
            );
          })}

          <div className="my-1 h-px bg-[--dash-border]" />

          <button
            type="button"
            onClick={handleSignOut}
            className="flex w-full cursor-pointer items-center gap-3 rounded-md px-4 py-3 text-[--dash-destructive] transition-colors duration-150 hover:bg-[--dash-destructive-subtle]"
          >
            <LogOut className="h-5 w-5 shrink-0" />
            <span className="min-w-0 flex-1 text-left text-sm">Sign out</span>
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

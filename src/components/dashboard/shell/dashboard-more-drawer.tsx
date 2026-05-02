"use client";

import Link from "next/link";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { createClient } from "@/lib/supabase/client";
import { dashboardNavItems, isDashboardNavItemActive } from "@/components/dashboard/nav-items";
import { ChevronRight, LogOut } from "lucide-react";
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
  const remainingItems = dashboardNavItems.slice(4);
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
        className="max-h-[75vh] overflow-y-auto rounded-t-2xl border-t border-[--dash-border] bg-[--dash-surface] px-4 pb-5 pt-0 text-[--dash-foreground]"
      >
        <div className="mx-auto mb-4 mt-3 h-1 w-8 rounded-full bg-[--dash-border]" />
        <SheetHeader className="p-0">
          <SheetTitle className="mb-2 text-xs font-medium text-[--dash-muted]">
            More options
          </SheetTitle>
        </SheetHeader>

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
                    ? "flex w-full items-center gap-3 rounded-lg border-l-2 border-[--dash-brand] px-4 py-3 text-sm text-[--dash-brand] transition-colors duration-150 hover:bg-[--dash-surface-hover]"
                    : "flex w-full items-center gap-3 rounded-lg border-l-2 border-transparent px-4 py-3 text-sm text-[--dash-foreground] transition-colors duration-150 hover:bg-[--dash-surface-hover]"
                }
              >
                <Icon
                  className={active ? "h-5 w-5 shrink-0 text-[--dash-brand]" : "h-5 w-5 shrink-0 text-[--dash-muted]"}
                />
                <span className="min-w-0 flex-1 truncate">{item.label}</span>
                <ChevronRight className="h-4 w-4 shrink-0 text-[--dash-muted]" />
              </Link>
            );
          })}

          <div className="my-2 h-px bg-[--dash-border]" />

          <button
            type="button"
            onClick={handleSignOut}
            className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm text-[--dash-destructive] transition-colors duration-150 hover:bg-[--dash-destructive-subtle]"
          >
            <LogOut className="h-5 w-5 shrink-0" />
            <span className="min-w-0 flex-1 text-left">Sign out</span>
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

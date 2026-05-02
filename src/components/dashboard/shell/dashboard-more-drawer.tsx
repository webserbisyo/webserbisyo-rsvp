"use client";

import Link from "next/link";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
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
        className="max-h-[70vh] overflow-y-auto rounded-t-2xl border-[--dash-border] bg-[--dash-surface] px-4 pb-5 pt-3 text-[--dash-foreground]"
      >
        <div className="mx-auto mb-4 h-1 w-8 rounded-full bg-[--dash-border]" />
        <SheetHeader className="p-0">
          <SheetTitle className="text-sm font-medium text-[--dash-muted]">
            More options
          </SheetTitle>
        </SheetHeader>

        <div className="mt-4 grid gap-1">
          {remainingItems.map((item) => {
            const active = isDashboardNavItemActive(pathname, item.href);
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => onOpenChange(false)}
                className="flex min-h-11 items-center gap-3 rounded-lg px-2 text-sm transition-colors hover:bg-[--dash-surface-muted]"
                style={{ color: active ? "var(--dash-brand)" : "var(--dash-foreground)" }}
              >
                <Icon className="h-5 w-5 shrink-0" />
                <span className="min-w-0 flex-1 truncate">{item.label}</span>
                <ChevronRight className="h-4 w-4 shrink-0 text-[--dash-muted]" />
              </Link>
            );
          })}

          <Separator className="my-2 bg-[--dash-border]" />

          <button
            type="button"
            onClick={handleSignOut}
            className="flex min-h-11 items-center gap-3 rounded-lg px-2 text-sm text-[--dash-destructive] transition-colors hover:bg-[--dash-surface-muted]"
          >
            <LogOut className="h-5 w-5 shrink-0" />
            <span className="min-w-0 flex-1 text-left">Sign out</span>
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

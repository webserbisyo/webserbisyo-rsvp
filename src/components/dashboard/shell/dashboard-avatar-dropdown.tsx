"use client";

import { useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/client";
import { ChevronDown, LogOut, Moon, Settings2 } from "lucide-react";
import { cn } from "@/lib/utils";

type DashboardAvatarDropdownProps = {
  email: string;
  displayName?: string;
  planType?: string | null;
};

function getInitials(email: string, displayName?: string) {
  const source = (displayName?.trim() || email).replace(/\s+/g, "");
  return source.slice(0, 2).toUpperCase();
}

function getDisplayLabel(email: string, displayName?: string) {
  return displayName?.trim() || email.split("@")[0] || email;
}

export function DashboardAvatarDropdown({
  email,
  displayName,
  planType,
}: DashboardAvatarDropdownProps) {
  const router = useRouter();
  const label = getDisplayLabel(email, displayName);
  const planBadgeClassName = cn(
    "inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
    planType?.toLowerCase() === "max" ? "dash-plan-badge-max" : "border dash-plan-badge-default",
  );

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="dash-avatar-trigger flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-1.5 text-sm transition-all focus-visible:ring-2 focus-visible:ring-[--dash-ring] focus-visible:outline-none"
          aria-label="Open account menu"
        >
          <Avatar className="h-7 w-7">
            <AvatarFallback className="dash-avatar-fallback rounded-full text-xs font-medium">
              {getInitials(email, displayName)}
            </AvatarFallback>
          </Avatar>
          <span className="hidden max-w-[120px] truncate font-medium text-[--dash-foreground] sm:inline">
            {label}
          </span>
          {planType ? <span className={planBadgeClassName}>{planType}</span> : null}
          <ChevronDown className="h-3.5 w-3.5 text-[--dash-muted]" aria-hidden="true" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        data-dashboard
        className="border-border bg-popover text-popover-foreground min-w-[220px] rounded-xl border p-1 shadow-lg"
      >
        <div className="border-border flex items-center gap-3 border-b p-3">
          <Avatar className="h-10 w-10">
            <AvatarFallback className="dash-avatar-fallback rounded-full text-sm font-medium">
              {getInitials(email, displayName)}
            </AvatarFallback>
          </Avatar>
          <div className="flex min-w-0 flex-col">
            <div className="flex items-center gap-2">
              <span className="text-foreground truncate text-sm font-bold">{label}</span>
              {planType ? <span className={planBadgeClassName}>{planType}</span> : null}
            </div>
            <div className="text-muted-foreground truncate text-xs font-medium">{email}</div>
          </div>
        </div>

        <div className="p-1">
          <DropdownMenuItem
            onClick={() => router.push("/dashboard/settings")}
            className="flex w-full cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm"
          >
            <Settings2 className="text-muted-foreground h-4 w-4" />
            Settings
          </DropdownMenuItem>
          <DropdownMenuItem
            aria-disabled="true"
            className="flex w-full cursor-default items-center gap-2 rounded-md px-3 py-2 text-sm opacity-70 focus:bg-transparent"
            disabled
          >
            <Moon className="text-muted-foreground h-4 w-4" />
            <span className="min-w-0 flex-1">Dark mode</span>
            <Badge
              variant="outline"
              className="h-5 rounded-full border-[color:color-mix(in_srgb,var(--dash-brand)_22%,var(--dash-border))] bg-[color:var(--dash-brand-subtle)] px-2 text-[10px] font-black text-[color:var(--dash-brand-active)]"
            >
              Soon
            </Badge>
          </DropdownMenuItem>
        </div>

        <DropdownMenuSeparator className="bg-border mx-1" />

        <div className="p-1">
          <DropdownMenuItem
            onClick={handleSignOut}
            variant="destructive"
            className="flex w-full cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </DropdownMenuItem>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

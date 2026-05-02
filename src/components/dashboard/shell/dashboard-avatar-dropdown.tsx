"use client";

import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { createClient } from "@/lib/supabase/client";
import { ChevronDown, LogOut, Moon, Settings2, Sun } from "lucide-react";
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
  const { resolvedTheme, setTheme } = useTheme();
  const darkMode = resolvedTheme === "dark";
  const label = getDisplayLabel(email, displayName);
  const planBadgeClassName = cn(
    "inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase",
    planType?.toLowerCase() === "max"
      ? "bg-[--dash-brand] text-white"
      : "border border-[--dash-border] bg-[--dash-surface-muted] text-[--dash-brand]",
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
          className="flex cursor-pointer items-center gap-2 rounded-lg border border-[--dash-border] bg-[--dash-surface] px-3 py-1.5 text-sm transition-colors hover:bg-[--dash-surface-hover] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--dash-ring]"
          aria-label="Open account menu"
        >
          <Avatar className="h-7 w-7">
            {/* Future: support gender-selectable default avatars; v1 uses initials only. */}
            <AvatarFallback className="rounded-full bg-[--dash-brand] text-xs font-medium text-white">
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
        className="min-w-[220px] rounded-xl border border-[--dash-border] bg-[--dash-surface] p-1 text-[--dash-foreground] shadow-lg"
      >
        <div className="flex items-center gap-3 border-b border-[--dash-border] p-3">
          <Avatar className="h-10 w-10">
            <AvatarFallback className="rounded-full bg-[--dash-brand] text-sm font-medium text-white">
              {getInitials(email, displayName)}
            </AvatarFallback>
          </Avatar>
          <div className="flex min-w-0 flex-col">
            <div className="flex items-center gap-2">
              <span className="truncate text-sm font-medium text-[--dash-foreground]">
                {label}
              </span>
              {planType ? <span className={planBadgeClassName}>{planType}</span> : null}
            </div>
            <div className="truncate text-xs text-[--dash-muted]">{email}</div>
          </div>
        </div>

        <div className="p-1">
          <DropdownMenuItem
            onClick={() => router.push("/dashboard/settings")}
            className="flex w-full cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm text-[--dash-foreground] transition-colors hover:bg-[--dash-surface-hover] focus:bg-[--dash-surface-hover] focus:text-[--dash-foreground]"
          >
            <Settings2 className="h-4 w-4 text-[--dash-muted]" />
            Settings
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => setTheme(darkMode ? "light" : "dark")}
            className="flex w-full cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm text-[--dash-foreground] transition-colors hover:bg-[--dash-surface-hover] focus:bg-[--dash-surface-hover] focus:text-[--dash-foreground]"
          >
            {darkMode ? (
              <Sun className="h-4 w-4 text-[--dash-muted]" />
            ) : (
              <Moon className="h-4 w-4 text-[--dash-muted]" />
            )}
            {darkMode ? "Light mode" : "Dark mode"}
          </DropdownMenuItem>
        </div>

        <DropdownMenuSeparator className="mx-1 bg-[--dash-border]" />

        <div className="p-1">
          <DropdownMenuItem
            onClick={handleSignOut}
            className="flex w-full cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm text-[--dash-destructive] transition-colors hover:bg-[--dash-destructive-subtle] focus:bg-[--dash-destructive-subtle] focus:text-[--dash-destructive]"
          >
            <LogOut className="h-4 w-4 text-[--dash-destructive]" />
            Sign out
          </DropdownMenuItem>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

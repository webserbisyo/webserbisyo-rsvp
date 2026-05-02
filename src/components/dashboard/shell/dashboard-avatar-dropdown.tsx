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

type DashboardAvatarDropdownProps = {
  email: string;
  displayName?: string;
};

function getInitials(email: string, displayName?: string) {
  const source = (displayName?.trim() || email).replace(/\s+/g, "");
  return source.slice(0, 2).toUpperCase();
}

function getDisplayLabel(email: string, displayName?: string) {
  const trimmedName = displayName?.trim();
  if (trimmedName) {
    return trimmedName.split(/\s+/)[0] || trimmedName;
  }

  return email.split("@")[0] || email;
}

export function DashboardAvatarDropdown({
  email,
  displayName,
}: DashboardAvatarDropdownProps) {
  const router = useRouter();
  const { resolvedTheme, setTheme } = useTheme();
  const darkMode = resolvedTheme === "dark";

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
          className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm text-[--dash-foreground] transition-colors hover:bg-[--dash-surface-hover] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--dash-ring]"
          aria-label="Open account menu"
        >
          <Avatar className="h-8 w-8">
            {/* Future: support gender-selectable default avatars; v1 uses initials only. */}
            <AvatarFallback className="rounded-full bg-[--dash-brand] text-xs font-medium text-white">
              {getInitials(email, displayName)}
            </AvatarFallback>
          </Avatar>
          <span className="hidden max-w-[16ch] truncate sm:inline">
            {getDisplayLabel(email, displayName)}
          </span>
          <ChevronDown className="h-3.5 w-3.5 text-[--dash-muted]" aria-hidden="true" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="min-w-[220px] rounded-xl border border-[--dash-border] bg-[--dash-surface] p-1 text-[--dash-foreground] shadow-md"
      >
        <div className="flex items-center gap-3 border-b border-[--dash-border] p-3">
          <Avatar className="h-10 w-10">
            <AvatarFallback className="rounded-full bg-[--dash-brand] text-sm font-medium text-white">
              {getInitials(email, displayName)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <div className="truncate text-sm font-medium text-[--dash-foreground]">
              {displayName?.trim() || getDisplayLabel(email)}
            </div>
            <div className="truncate text-xs text-[--dash-muted]">{email}</div>
          </div>
        </div>

        <div className="p-1">
          <DropdownMenuItem
            onClick={() => router.push("/dashboard/settings")}
            className="gap-2 rounded-md px-3 py-2 text-[--dash-foreground] transition-colors focus:bg-[--dash-surface-hover] focus:text-[--dash-foreground]"
          >
            <Settings2 className="h-4 w-4 text-[--dash-muted]" />
          Settings
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => setTheme(darkMode ? "light" : "dark")}
            className="gap-2 rounded-md px-3 py-2 text-[--dash-foreground] transition-colors focus:bg-[--dash-surface-hover] focus:text-[--dash-foreground]"
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
            className="gap-2 rounded-md px-3 py-2 text-[--dash-destructive] transition-colors focus:bg-[--dash-destructive-subtle] focus:text-[--dash-destructive]"
          >
            <LogOut className="h-4 w-4 text-[--dash-destructive]" />
          Sign out
          </DropdownMenuItem>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

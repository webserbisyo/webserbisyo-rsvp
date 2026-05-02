"use client";

import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { createClient } from "@/lib/supabase/client";
import { LogOut, Moon, Settings2, Sun } from "lucide-react";

type DashboardAvatarDropdownProps = {
  email: string;
  displayName?: string;
};

function getInitials(email: string, displayName?: string) {
  const source = (displayName?.trim() || email).replace(/\s+/g, "");
  return source.slice(0, 2).toUpperCase();
}

function getDisplayLabel(email: string, displayName?: string) {
  const source = displayName?.trim() || email.split("@")[0] || email;
  return source.slice(0, 16);
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
          className="flex items-center gap-2 rounded-full px-1.5 py-1 text-sm text-[--dash-foreground] focus-visible:outline-none focus-visible:ring-2"
          style={{ "--tw-ring-color": "var(--dash-ring)" } as React.CSSProperties}
          aria-label="Open account menu"
        >
          <Avatar className="h-9 w-9">
            <AvatarFallback className="rounded-full bg-[--dash-brand] text-sm font-medium text-white">
              {getInitials(email, displayName)}
            </AvatarFallback>
          </Avatar>
          <span className="hidden max-w-40 truncate sm:inline">
            {getDisplayLabel(email, displayName)}
          </span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="text-xs text-[--dash-muted]">{email}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => router.push("/dashboard/settings")}>
          <Settings2 className="mr-2 h-4 w-4" />
          Settings
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => setTheme(darkMode ? "light" : "dark")}>
          {darkMode ? <Sun className="mr-2 h-4 w-4" /> : <Moon className="mr-2 h-4 w-4" />}
          {darkMode ? "Light mode" : "Dark mode"}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onClick={handleSignOut}>
          <LogOut className="mr-2 h-4 w-4" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

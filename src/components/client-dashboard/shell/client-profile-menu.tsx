"use client";

import { ChevronDown, CircleUser, MessageCircle } from "lucide-react";
import { formatUserRoleLabel } from "@/lib/auth/role-labels";
import { SignOutButton } from "@/components/app-shell/sign-out-button";
import { clientToast } from "@/components/client-dashboard/feedback/client-toast";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

type ClientProfileMenuProps = {
  clientName: string;
  email: string | null;
  fullName: string | null;
  role: string;
};

function getInitials(fullName: string | null, email: string | null) {
  const source = fullName || email || "Client";
  const parts = source.split(/\s+/).filter(Boolean).slice(0, 2);
  return parts.map((part) => part[0]?.toUpperCase()).join("") || "C";
}

export function ClientProfileMenu({ clientName, email, fullName, role }: ClientProfileMenuProps) {
  const displayName = fullName || clientName;
  const displayEmail = email || "No email on file";
  const roleLabel = formatUserRoleLabel(role);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          className="client-focus-ring h-auto rounded-[var(--client-radius-xl)] border border-[var(--client-border)] bg-white/62 px-2 py-2 text-left shadow-[var(--client-shadow-soft)] hover:border-[var(--client-border-strong)] hover:bg-white/82"
        >
          <span className="flex min-w-0 items-center gap-3">
            <Avatar className="size-10 rounded-full border border-[var(--client-border)] bg-white/85 shadow-[var(--client-shadow-soft)]">
              <AvatarFallback className="bg-[var(--client-accent-soft)] text-[var(--client-accent-hover)]">
                {getInitials(fullName, email)}
              </AvatarFallback>
            </Avatar>
            <span className="hidden min-w-0 sm:grid">
              <span className="truncate text-sm font-semibold text-[var(--client-text)]">
                {displayEmail}
              </span>
              <span className="truncate text-xs text-[var(--client-text-soft)]">{roleLabel}</span>
            </span>
            <ChevronDown className="size-4 text-[var(--client-text-soft)]" />
          </span>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        sideOffset={10}
        className="client-floating-surface w-72 rounded-[var(--client-radius-xl)] p-1.5"
      >
        <DropdownMenuLabel className="px-2.5 py-2">
          <div className="space-y-1">
            <p className="truncate text-sm font-semibold text-[var(--client-text)]">
              {displayName}
            </p>
            <p className="truncate text-xs text-[var(--client-text-muted)]">{displayEmail}</p>
            <p className="truncate text-[0.7rem] tracking-[0.18em] text-[var(--client-text-soft)] uppercase">
              {clientName} · {roleLabel}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-[var(--client-border)]" />
        <DropdownMenuItem
          className="rounded-[var(--client-radius-md)] px-2.5 py-2 focus:bg-[var(--client-accent-soft)] focus:text-[var(--client-accent-hover)]"
          onSelect={() =>
            clientToast.info("Profile tools are still being prepared.", {
              description: "Account details will live here in a later phase.",
            })
          }
        >
          <CircleUser className="size-4" />
          <span>Account / Profile</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          className="rounded-[var(--client-radius-md)] px-2.5 py-2 focus:bg-[var(--client-accent-soft)] focus:text-[var(--client-accent-hover)]"
          onSelect={() =>
            clientToast.info("Support shortcuts are still being prepared.", {
              description: "Use your current WebSerbisyo contact channels for now.",
            })
          }
        >
          <MessageCircle className="size-4" />
          <span>Support</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator className="bg-[var(--client-border)]" />
        <div className="px-1 pb-1">
          <SignOutButton className="client-focus-ring w-full justify-start rounded-[var(--client-radius-md)] text-[var(--client-text-muted)] hover:bg-[var(--client-accent-soft)] hover:text-[var(--client-accent-hover)]" />
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

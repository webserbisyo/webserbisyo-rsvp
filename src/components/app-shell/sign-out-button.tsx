"use client";

import { useState } from "react";
import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type SignOutButtonProps = {
  className?: string;
  label?: string;
};

export function SignOutButton({ className, label = "Sign out" }: SignOutButtonProps) {
  const router = useRouter();
  const [isSigningOut, setIsSigningOut] = useState(false);

  async function handleSignOut() {
    setIsSigningOut(true);

    const supabase = createClient();
    await supabase.auth.signOut();

    router.replace("/login");
    router.refresh();
  }

  return (
    <Button
      type="button"
      variant="ghost"
      className={cn("justify-start", className)}
      disabled={isSigningOut}
      onClick={() => {
        void handleSignOut();
      }}
    >
      <LogOut className="size-4 shrink-0" />
      <span className="truncate group-data-[collapsible=icon]:hidden">
        {isSigningOut ? "Signing out..." : label}
      </span>
    </Button>
  );
}
